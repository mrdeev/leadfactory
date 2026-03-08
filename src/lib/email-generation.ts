import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export function normalizeUrl(url: string): string {
    if (!url) return '';
    return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .split('?')[0]
        .trim();
}

// Apify returns orgIndustry as Python-style string "['design']" or a real array
export function parseIndustry(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'string') {
        return val
            .replace(/^\[|\]$/g, '')   // strip outer [ ]
            .replace(/'/g, '')          // strip quotes
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .join(', ');
    }
    return String(val);
}

export async function generatePersonalizedEmail(
    product: any,
    contact: any,
    recentPosts: string,
    systemInstructions: string,
    sequenceStep?: any
): Promise<{ subject: string; body: string }> {
    const strategy = product.strategy || {};
    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || contact.fullName || 'there';
    const industries = parseIndustry(contact.orgIndustry);

    // professional_focus = reliable summary of the contact's OWN interests (use as primary hook)
    // insights = posts scraped from the contact's LinkedIn FEED — may reference other people by name, not the contact
    const focusArr: string[] = Array.isArray(contact.professional_focus) ? contact.professional_focus : [];
    const insightsArr: string[] = Array.isArray(contact.insights) ? contact.insights : [];
    // Only keep insights that don't mention third-party names (e.g. "Raphaelle Poly is pursuing...")
    const safeInsights = insightsArr.filter((s: string) => {
        const startsWithOtherName = /^[A-Z][a-z]+ [A-Z][a-z]+ (is|has|was|are)\b/.test(s.trim());
        return !startsWithOtherName;
    });

    const stepNum = sequenceStep?.step ?? 1;
    const purpose = sequenceStep?.purpose ?? 'initial';

    const stepRules = (() => {
        if (purpose === 'initial' || stepNum === 1) {
            return `EMAIL RULES (Email 1 — Opening touch):
- MAXIMUM 3-4 sentences. Not a word more.
- Structure: one specific observation about them OR their company → end with a genuine curiosity question
- NO product pitch, NO promotional language, NO "we help companies like yours"
- NO links, NO booking links, NO CTAs
- NO buzzwords, NO hype, NO "I came across your profile"
- Subject line: lowercase, short, reads like a peer message (e.g. "quick thought" or "your work at ${contact.orgName || 'your company'}")
- The goal is to START a conversation — not sell anything
- Sign off simply as: ${product.senderName || product.ceoName || product.name}`;
        }
        if (purpose === 'breakup') {
            return `EMAIL RULES (Final touch — break-up):
- 1-2 sentences only
- Acknowledge you've reached out a couple times, no hard feelings, leave the door open
- Zero pressure, zero pitch
- Sign off as: ${product.senderName || product.ceoName || product.name}`;
        }
        if (purpose === 'follow_up') {
            return `EMAIL RULES (Email ${stepNum} — Follow-up):
- 3-5 sentences
- Briefly reference your first email without being pushy
- Lead with one specific, relevant insight or observation from their LinkedIn activity
- Soft ask only — invite conversation, not "book a demo" or "schedule a call"
- No links. Plain text.
- Sign off as: ${product.senderName || product.ceoName || product.name}`;
        }
        // value_add
        return `EMAIL RULES (Email ${stepNum} — Value add):
- 4-6 sentences
- Share one piece of genuinely useful information or perspective relevant to their work
- Tie it naturally to what we do without hard-selling
- End with a soft question
- Sign off as: ${product.senderName || product.ceoName || product.name}`;
    })();

    const prompt = `PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target Customers: ${product.targetCustomers || strategy.targetAudience || ''}
- Pain Points Solved: ${product.painPoints || ''}
- Value Proposition: ${product.valueProp || strategy.keyValueMessages || ''}

PROSPECT:
- Name: ${contact.fullName} (address as: ${firstName})
- Title: ${contact.position || 'N/A'}
- Seniority: ${contact.seniority || 'N/A'}
- Company: ${contact.orgName || 'N/A'}
- Industry: ${industries || 'N/A'}
- Company Size: ${contact.orgSize ? `${contact.orgSize} employees` : 'N/A'}
- Company Description: ${contact.orgDescription ? contact.orgDescription.substring(0, 400) : 'N/A'}
- Location: ${[contact.city, contact.state, contact.country].filter(Boolean).join(', ') || 'N/A'}
${focusArr.length ? `
WHAT ${firstName.toUpperCase()} CARES ABOUT (their own professional interests — primary personalisation hook):
${focusArr.map((f: string) => `- ${f}`).join('\n')}
` : ''}${safeInsights.length ? `
TOPICS THEY ENGAGE WITH ON LINKEDIN (from their feed — use as supporting context only):
${safeInsights.map((s: string) => `- ${s}`).join('\n')}
` : ''}${recentPosts ? `
RECENT LINKEDIN ACTIVITY (reference something specific):
${recentPosts.substring(0, 1200)}
` : ''}
${stepRules}

Return ONLY valid JSON — no markdown, no explanation:
{"subject": "subject line here", "body": "email body here"}`;

    const baseInstruction = `You are an expert B2B cold email writer and SDR. You MUST return ONLY valid JSON with exactly two fields: "subject" and "body". No markdown, no code fences, no extra text before or after the JSON object.`;
    const systemPrompt = systemInstructions
        ? `${baseInstruction}\n\n${systemInstructions}`
        : baseInstruction;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.75,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;

    try {
        const parsed = JSON.parse(jsonStr);
        return {
            subject: parsed.subject || `${product.name} — quick question`,
            body: parsed.body || raw,
        };
    } catch {
        return {
            subject: `${product.name} — quick question for ${contact.orgName || firstName}`,
            body: raw,
        };
    }
}
