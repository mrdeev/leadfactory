import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSystemInstructions } from '@/lib/knowledge-base';
import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

function parseIndustry(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val).replace(/^\[|\]$/g, '').replace(/'/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).join(', ');
}

export const maxDuration = 60;

// GET /api/campaign/preview?productId=xxx
// Generates a sample Email 1 for the first contact in the product to show in the wizard
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    const product = await db.getProduct(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const allContacts = await db.getContacts(productId);

    // Pick the contact with the most data (prioritise those with professional_focus)
    const contact = allContacts.sort((a: any, b: any) => {
        const aScore = (a.professional_focus?.length || 0) + (a.insights?.length || 0) + (a.orgDescription ? 1 : 0);
        const bScore = (b.professional_focus?.length || 0) + (b.insights?.length || 0) + (b.orgDescription ? 1 : 0);
        return bScore - aScore;
    })[0];

    if (!contact) return NextResponse.json({ error: 'No contacts found for this product' }, { status: 404 });

    const strategy = (product.strategy || {}) as { targetAudience?: string; keyValueMessages?: string; };
    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || 'there';
    const industries = parseIndustry(contact.orgIndustry);
    const focusArr: string[] = Array.isArray(contact.professional_focus) ? contact.professional_focus : [];
    const insightsArr: string[] = Array.isArray(contact.insights) ? contact.insights : [];
    const safeInsights = insightsArr.filter((s: string) =>
        !/^[A-Z][a-z]+ [A-Z][a-z]+ (is|has|was|are)\b/.test(s.trim())
    );

    const systemInstructions = getSystemInstructions();
    const baseInstruction = `You are an expert B2B cold email writer and SDR. You MUST return ONLY valid JSON with exactly two fields: "subject" and "body". No markdown, no code fences, no extra text.`;
    const systemPrompt = systemInstructions ? `${baseInstruction}\n\n${systemInstructions}` : baseInstruction;

    const prompt = `PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target Customers: ${product.targetCustomers || strategy.targetAudience || ''}
- Pain Points Solved: ${product.painPoints || ''}
- Value Proposition: ${(product as any).valueProp || strategy.keyValueMessages || ''}

PROSPECT:
- Name: ${contact.fullName} (address as: ${firstName})
- Title: ${contact.position || 'N/A'}
- Company: ${contact.orgName || 'N/A'}
- Industry: ${industries || 'N/A'}
- Company Size: ${contact.orgSize ? `${contact.orgSize} employees` : 'N/A'}
- Company Description: ${contact.orgDescription ? contact.orgDescription.substring(0, 300) : 'N/A'}
- Location: ${[contact.city, contact.state, contact.country].filter(Boolean).join(', ') || 'N/A'}
${focusArr.length ? `
WHAT ${firstName.toUpperCase()} CARES ABOUT (primary personalisation hook):
${focusArr.map((f: string) => `- ${f}`).join('\n')}
` : ''}${safeInsights.length ? `
TOPICS THEY ENGAGE WITH ON LINKEDIN:
${safeInsights.map((s: string) => `- ${s}`).join('\n')}
` : ''}
EMAIL RULES (Email 1 — Opening touch):
- MAXIMUM 3-4 sentences. Not a word more.
- Structure: one specific observation about them OR their company → end with a genuine curiosity question
- NO product pitch, NO promotional language
- NO links, NO booking links, NO CTAs
- Subject line: lowercase, short, peer-to-peer style
- Goal: START a conversation — not sell anything
- Sign off as: ${product.senderName || (product as any).ceoName || product.name}

Return ONLY valid JSON:
{"subject": "subject line here", "body": "email body here"}`;

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.8,
        });

        const raw = response.choices[0]?.message?.content || '{}';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

        return NextResponse.json({
            contact: {
                fullName: contact.fullName,
                position: contact.position,
                orgName: contact.orgName,
            },
            subject: parsed.subject || '',
            body: parsed.body || '',
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
