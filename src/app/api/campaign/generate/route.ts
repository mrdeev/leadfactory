import { NextRequest, NextResponse } from 'next/server';
import { db, SequenceNode } from '@/lib/db';
import { getSystemInstructions } from '@/lib/knowledge-base';
import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const maxDuration = 120;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    const product = await db.getProduct(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ campaignSequence: product.campaignSequence || null });
}

export async function POST(req: NextRequest) {
    try {
        const { productId, variationSeed } = await req.json();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const product = await db.getProduct(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const strategy = (product.strategy || {}) as {
            targetAudience?: string;
            keyValueMessages?: string;
            outreachApproach?: string;
            followUpStrategy?: string;
        };

        // Pull real contact profiles to ground the template in actual audience data
        const allContacts = await db.getContacts(productId);
        const productContacts = allContacts.slice(0, 5);
        const contactSamples = productContacts
            .map((c: any) => {
                const focus: string[] = Array.isArray(c.professional_focus) ? c.professional_focus : [];
                const parts = [
                    c.position && c.orgName ? `${c.position} at ${c.orgName}` : c.position || c.orgName || null,
                    c.orgDescription ? c.orgDescription.substring(0, 150) : null,
                    focus.length ? `Interested in: ${focus.join(', ')}` : null,
                ].filter(Boolean);
                return parts.length ? `- ${parts.join(' | ')}` : null;
            })
            .filter(Boolean)
            .join('\n');

        const systemInstructions = getSystemInstructions();
        const baseInstruction = `You are an expert B2B outreach strategist. You MUST return ONLY valid JSON. No markdown, no code fences, no extra text.`;
        const systemPrompt = systemInstructions
            ? `${baseInstruction}\n\n${systemInstructions}`
            : baseInstruction;

        const seed = variationSeed || Date.now();
        const prompt = `[Variation ${seed}] Design a 3-email outreach sequence for the product below. The goal is to START CONVERSATIONS — not sell.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target Customers: ${product.targetCustomers || strategy.targetAudience || 'B2B decision makers'}
- Pain Points Solved: ${product.painPoints || 'Not specified'}
- Value Proposition: ${product.valueProp || strategy.keyValueMessages || 'Not specified'}
- Outreach Approach: ${strategy.outreachApproach || ''}
${contactSamples ? `
ACTUAL CONTACTS IN THIS CAMPAIGN (use their roles, interests and company context to make key messages specific — not generic placeholders):
${contactSamples}
` : ''}

SEQUENCE RULES (follow exactly):

Email 1 — "initial" (Day 0):
- subjectApproach: lowercase, peer-to-peer subject line (NOT promotional). Example style: "quick thought" or "your work at [Company]"
- keyMessages: 2 items describing what to OBSERVE about the prospect from their LinkedIn to open naturally. NO feature list. NO value prop. Just observation hooks.
- cta: "none — end with a genuine open question"
- tone: "conversational, peer-to-peer, curious — NOT salesy"
- purpose: "initial"
- delayDays: 0

Email 2 — "follow_up" (Day 4):
- subjectApproach: a soft follow-up line, can reference email 1
- keyMessages: 2 items — one relevant insight to share, one soft connection to what the product solves
- cta: "invite a reply or a quick conversation — no booking links"
- tone: "warm, low-pressure, adds value"
- purpose: "follow_up"
- delayDays: 4

Email 3 — "breakup" (Day 9):
- subjectApproach: gracious, no pressure subject
- keyMessages: 1-2 items — acknowledge they're busy, leave door open, nothing promotional
- cta: "no ask — just leave door open"
- tone: "brief, gracious, human"
- purpose: "breakup"
- delayDays: 9

Return ONLY valid JSON:
{
  "emails": [
    { "step": 1, "subjectApproach": "...", "keyMessages": ["...", "..."], "cta": "...", "tone": "...", "delayDays": 0, "purpose": "initial" },
    { "step": 2, "subjectApproach": "...", "keyMessages": ["...", "..."], "cta": "...", "tone": "...", "delayDays": 4, "purpose": "follow_up" },
    { "step": 3, "subjectApproach": "...", "keyMessages": ["...", "..."], "cta": "...", "tone": "...", "delayDays": 9, "purpose": "breakup" }
  ]
}`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 1200,
        });

        const content = response.choices[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        let sequenceData: any;
        try {
            sequenceData = JSON.parse(jsonStr);
        } catch {
            console.error('Failed to parse AI response:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        const campaignSequence = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            emails: sequenceData.emails || [],
            nodes: [
                { id: 'email1', type: 'email', label: 'Email — Opening touch', waitBeforeDays: 0, nextNodeId: 'visit' },
                { id: 'visit', type: 'linkedin_visit', label: 'Visit profile', waitBeforeDays: 0, nextNodeId: 'invite' },
                { id: 'invite', type: 'linkedin_invite', label: 'Invitation', waitBeforeDays: 1, nextNodeId: 'condition' },
                { id: 'condition', type: 'condition', label: 'Accepted invite within 5 days', waitBeforeDays: 5, yesNodeId: 'chat_yes1', noNodeId: 'email_no1' },
                { id: 'chat_yes1', type: 'linkedin_chat', label: 'Chat message', waitBeforeDays: 1, nextNodeId: 'email_yes' },
                { id: 'email_yes', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'chat_yes2' },
                { id: 'chat_yes2', type: 'linkedin_chat', label: 'Chat message', waitBeforeDays: 3, nextNodeId: 'email_final' },
                { id: 'email_no1', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'email_no2' },
                { id: 'email_no2', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'email_no3' },
                { id: 'email_no3', type: 'email', label: 'Email', waitBeforeDays: 3, nextNodeId: 'email_final' },
                { id: 'email_final', type: 'email', label: 'Email', waitBeforeDays: 5, nextNodeId: 'end' },
                { id: 'end', type: 'end', label: 'End of sequence', waitBeforeDays: 0 },
            ] as SequenceNode[]
        };

        await db.updateProduct(productId, { campaignSequence });

        return NextResponse.json({ success: true, campaignSequence });
    } catch (error: any) {
        console.error('Campaign generate error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
