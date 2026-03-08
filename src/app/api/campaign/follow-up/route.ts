import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstructions } from '@/lib/knowledge-base';
import { db } from '@/lib/db';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';
import { sendEmail } from '@/lib/email';

const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const maxDuration = 300;

const normalizeUrl = (url: string) => {
    if (!url) return '';
    return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('?')[0]
        .trim();
};

async function generateFollowUp(
    product: any,
    contact: any,
    recentPosts: string,
    systemInstructions: string,
    sequenceStep: any,
    previousEmail: string
): Promise<{ subject: string; body: string }> {
    const strategy = product.strategy || {};
    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || contact.fullName || 'there';
    const industries = (() => {
        const val = contact.orgIndustry;
        if (!val) return '';
        if (Array.isArray(val)) return val.join(', ');
        return String(val).replace(/^\[|\]$/g, '').replace(/'/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).join(', ');
    })();

    const focusArr: string[] = Array.isArray(contact.professional_focus) ? contact.professional_focus : [];
    const insightsArr: string[] = Array.isArray(contact.insights) ? contact.insights : [];
    const safeInsights = insightsArr.filter((s: string) =>
        !/^[A-Z][a-z]+ [A-Z][a-z]+ (is|has|was|are)\b/.test(s.trim())
    );

    const stepPurpose = sequenceStep.purpose;

    const stepRules = stepPurpose === 'breakup'
        ? `EMAIL RULES (Final break-up email):
- 1-2 sentences only
- Acknowledge you've reached out, no hard feelings, door is open any time
- Zero pressure, zero pitch
- Sign off as: ${product.senderName || product.ceoName || product.name}`
        : stepPurpose === 'value_add'
            ? `EMAIL RULES (Email ${sequenceStep.step} — Value add):
- 4-6 sentences
- Reference previous email very briefly (one line)
- Lead with a specific observation from their LinkedIn insights or a relevant fact about their industry
- Tie it to what ${product.name} does — naturally, no hard sell
- End with a soft question
- No links. Plain text.
- Sign off as: ${product.senderName || product.ceoName || product.name}`
            : `EMAIL RULES (Email ${sequenceStep.step} — Follow-up):
- 3-5 sentences
- One brief line referencing previous email
- New angle: use a LinkedIn insight or professional focus point to stay relevant
- Soft ask — invite conversation, not "book a demo"
- No links. Plain text.
- Sign off as: ${product.senderName || product.ceoName || product.name}`;

    const prompt = `PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Value Proposition: ${product.valueProp || strategy.keyValueMessages || ''}
- Pain Points Solved: ${product.painPoints || ''}

PROSPECT:
- Name: ${contact.fullName} (address as: ${firstName})
- Title: ${contact.position || 'N/A'}
- Company: ${contact.orgName || 'N/A'}
- Industry: ${industries || 'N/A'}
- Company Size: ${contact.orgSize ? `${contact.orgSize} employees` : 'N/A'}
${focusArr.length ? `
WHAT ${firstName.toUpperCase()} CARES ABOUT (their professional interests — primary personalisation hook):
${focusArr.map((f: string) => `- ${f}`).join('\n')}
` : ''}${safeInsights.length ? `
TOPICS THEY ENGAGE WITH ON LINKEDIN (supporting context):
${safeInsights.map((s: string) => `- ${s}`).join('\n')}
` : ''}${recentPosts ? `
RECENT LINKEDIN ACTIVITY:
${recentPosts.substring(0, 1200)}
` : ''}
PREVIOUS EMAIL SENT (for context — do NOT repeat it):
${previousEmail.substring(0, 400)}

${stepRules}

Return ONLY valid JSON — no markdown, no explanation:
{"subject": "subject line", "body": "email body"}`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: `You are an expert B2B cold email writer and SDR. You MUST return ONLY valid JSON with exactly two fields: "subject" and "body". No markdown, no code fences, no extra text.${systemInstructions ? '\n\n' + systemInstructions : ''}`
            },
            { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;

    try {
        const parsed = JSON.parse(jsonStr);
        return {
            subject: parsed.subject || `Following up — ${product.name}`,
            body: parsed.body || raw,
        };
    } catch {
        return {
            subject: `Following up — ${product.name}`,
            body: raw,
        };
    }
}

// GET: return count of contacts due for follow-ups per product
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    const allContacts = await db.getContacts(productId);
    const now = new Date();

    const dueContacts = allContacts.filter((c: any) => {
        const hasCampaignStep = c.campaignStep && c.campaignStep > 0;
        const isDue = c.nextEmailAt && new Date(c.nextEmailAt) <= now;
        return hasCampaignStep && isDue;
    });

    return NextResponse.json({ dueCount: dueContacts.length });
}

// POST: send due follow-up emails
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId } = body;

        const allContacts = productId ? await db.getContacts(productId) : await db.getContacts();
        const now = new Date();

        // Find contacts due for their next follow-up
        const dueContacts = allContacts.filter((c: any) => {
            const hasCampaignStep = c.campaignStep && c.campaignStep > 0;
            const isDue = c.nextEmailAt && new Date(c.nextEmailAt) <= now;
            return hasCampaignStep && isDue;
        });

        if (dueContacts.length === 0) {
            return NextResponse.json({ success: true, message: 'No follow-ups due right now.', count: 0 });
        }

        console.log(`--- Sending follow-ups for ${dueContacts.length} contacts ---`);

        const systemInstructions = getSystemInstructions();

        // Group by product to batch LinkedIn scraping per product
        const byProduct: Record<string, any[]> = {};
        for (const contact of dueContacts) {
            if (!byProduct[contact.productId]) byProduct[contact.productId] = [];
            byProduct[contact.productId].push(contact);
        }

        let totalSent = 0;
        const updatedContactIds: string[] = [];

        for (const [pid, contacts] of Object.entries(byProduct)) {
            const product = await db.getProduct(pid);
            if (!product || !product.campaignSequence) continue;

            const senderEmail = product.senderEmail || 'support@topsalesagent.ai';

            // Scrape fresh LinkedIn posts
            const linkedinUrls = contacts
                .map((c: any) => c.linkedinUrl)
                .filter((url: string) => url && url.includes('linkedin.com/in/'));

            let postsMap: Record<string, string> = {};
            if (linkedinUrls.length > 0) {
                try {
                    const uniqueUrls = [...new Set(linkedinUrls)];
                    const postRun = await apifyClient.actor('supreme_coder/linkedin-post').call({
                        urls: uniqueUrls,
                        limitPerSource: 3,
                        deepScrape: false,
                        rawData: false,
                    });
                    const { items: posts } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();
                    posts.forEach((post: any) => {
                        const authorUrl = normalizeUrl(post.authorUrl || post.url || post.inputUrl || post.profileUrl);
                        if (authorUrl) {
                            const content = post.text || post.content || '';
                            if (content) {
                                postsMap[authorUrl] = (postsMap[authorUrl] || '') + '\n\n-- POST --\n' + content;
                            }
                        }
                    });
                } catch (err) {
                    console.error(`LinkedIn scrape failed for ${pid}, continuing:`, err);
                }
            }

            for (const contact of contacts) {
                const nextStep = contact.campaignStep + 1;
                const sequenceStep = product.campaignSequence.emails.find((e: any) => e.step === nextStep);

                if (!sequenceStep) {
                    // No more steps — mark as campaign complete
                    await db.updateContact(contact.id, { nextEmailAt: null, campaignComplete: true });
                    updatedContactIds.push(contact.id);
                    continue;
                }

                const cleanUrl = normalizeUrl(contact.linkedinUrl as string);
                const recentPosts = cleanUrl ? (postsMap[cleanUrl] || '') : '';

                let subject = 'Follow-up failed';
                let emailBody = 'Follow-up failed';

                try {
                    const result = await generateFollowUp(
                        product,
                        contact,
                        recentPosts,
                        systemInstructions,
                        sequenceStep,
                        contact.generatedEmail || ''
                    );
                    subject = result.subject;
                    emailBody = result.body;
                } catch (err: any) {
                    console.error(`Follow-up generation failed for ${contact.fullName}:`, err.message);
                }

                // Calculate next send date
                const nextSequenceStep = product.campaignSequence.emails.find((e: any) => e.step === nextStep + 1);
                const nextEmailAt = nextSequenceStep
                    ? new Date(Date.now() + (nextSequenceStep.delayDays || 7) * 24 * 60 * 60 * 1000).toISOString()
                    : null;

                await db.updateContact(contact.id, {
                    generatedEmail: emailBody,
                    generatedSubject: subject,
                    campaignStep: nextStep,
                    campaignStepAt: new Date().toISOString(),
                    nextEmailAt,
                    campaignComplete: !nextSequenceStep,
                });
                updatedContactIds.push(contact.id);

                // Send the follow-up
                if (emailBody !== 'Follow-up failed') {
                    try {
                        await sendEmail({
                            to: contact.email,
                            from: `${product.senderName || product.name} <${senderEmail}>`,
                            subject,
                            text: emailBody,
                            provider: product.sendingMethod || 'platform',
                            sesConfig: product.sesConfig,
                            sendgridConfig: product.sendgridConfig,
                            mailgunConfig: product.mailgunConfig,
                            smtpConfig: product.smtpConfig ? {
                                host: product.smtpConfig.host,
                                port: product.smtpConfig.port,
                                user: product.smtpConfig.username,
                                pass: product.smtpConfig.password || '',
                            } : undefined,
                            replyTo: product.replyToEmail,
                        });

                        // Log message
                        await db.saveMessage({
                            id: crypto.randomUUID(),
                            productId: pid,
                            contactId: contact.id,
                            contactName: contact.fullName,
                            email: contact.email,
                            from: senderEmail,
                            subject,
                            body: emailBody,
                            snippet: emailBody.substring(0, 150) + '...',
                            status: 'Sent',
                            channel: 'Email',
                            direction: 'outgoing',
                            campaignStep: nextStep,
                            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                            timestamp: new Date().toISOString(),
                        });
                        totalSent++;
                    } catch (sendErr) {
                        console.error(`Follow-up send failed for ${contact.email}:`, sendErr);
                    }
                }

                if (contacts.length > 5) await new Promise(r => setTimeout(r, 300));
            }
        }

        // Activity log
        await db.logActivity(
            productId || 'all',
            'follow-up',
            'batch',
            'follow_up_sent',
            `Sent ${totalSent} follow-up emails across ${Object.keys(byProduct).length} campaigns.`,
        );

        return NextResponse.json({ success: true, count: totalSent, processed: updatedContactIds.length });
    } catch (error: any) {
        console.error('Follow-up API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
