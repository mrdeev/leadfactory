import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { getSystemInstructions } from '@/lib/knowledge-base';

// AI Clients
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { contactIds } = await req.json();

        if (!contactIds || !Array.isArray(contactIds)) {
            return NextResponse.json({ error: 'Contact IDs array is required' }, { status: 400 });
        }

        // Fetch all contacts — we need to filter by IDs
        const allContacts = await db.getContacts();
        const targets = allContacts.filter((c: any) => contactIds.includes(c.id));

        if (targets.length === 0) {
            return NextResponse.json({ error: 'No matching contacts found' }, { status: 404 });
        }

        // 1. Identify LinkedIn URLs
        const linkedinUrls = targets
            .map((c: any) => c.linkedinUrl)
            .filter((url: string) => url && url.includes('linkedin.com/in/'));

        // 2. Normalize and Map Posts
        const normalizeUrl = (url: string) => url ? url.toLowerCase().replace(/\/$/, '').replace('www.', '').trim() : '';
        let postsMap: Record<string, string> = {};

        if (linkedinUrls.length > 0) {
            console.log(`--- Personalize: Scraping posts for ${linkedinUrls.length} contacts ---`);
            try {
                const postRun = await apifyClient.actor("supreme_coder/linkedin-post").call({
                    urls: linkedinUrls,
                    limitPerSource: 5,
                    deepScrape: true,
                    rawData: false
                });

                const { items: posts } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();
                posts.forEach((post: any) => {
                    const authorUrl = normalizeUrl(post.authorUrl || post.url || post.inputUrl);
                    if (authorUrl) {
                        const content = post.text || post.content || '';
                        if (content) {
                            postsMap[authorUrl] = (postsMap[authorUrl] || '') + '\n\n' + content;
                        }
                    }
                });
            } catch (error) {
                console.error('LinkedIn Post Scraper Failed during personalization:', error);
            }
        }

        // 3. Generate Personalization sequentially
        const kbContent = getSystemInstructions();
        console.log(`--- Personalize: Generating emails for ${targets.length} contacts via Groq ---`);

        for (const target of targets) {
            const linkedinUrl = normalizeUrl(target.linkedinUrl);
            const recentPosts = linkedinUrl ? postsMap[linkedinUrl] : '';

            // Collect tactical insights already generated during search/scrape
            const tacticalInsights = [
                ...(target.insights || []),
                ...(target.professional_focus || []),
                ...(target.websiteContent || [])
            ].filter(Boolean).join('\n- ');

            const systemPrompt = `
                You are a top-tier sales expert and an AI personalization engine. 
                Your goal is to write a short, highly personalized cold email based on the provided prospect data AND strict business rules.

                ${kbContent}

                STRICT EXECUTION GUIDELINES:
                1. You MUST follow all formatting and tone rules found in the KNOWLEDGE BASE files above.
                2. Specifically, refer to 'email_copy_rules.md' for email length and structure.
                3. Use the provided 'LinkedIn Insights' to prove you've done your research.
                4. Tone: Professional, concise, NOT salesy.
            `;

            const userPrompt = `
                Write a personalized cold email for:
                Name: ${target.fullName}
                Title: ${target.position}
                Company: ${target.orgName}
                
                SCRAPED LINKEDIN INSIGHTS:
                ${tacticalInsights || 'No specific insights found, use company/title context.'}

                ${recentPosts ? `RAW RECENT ACTIVITY (Use for extra depth): "${recentPosts.substring(0, 1000)}..."` : ''}

                Output: Just the email body. No subject line, no placeholders.
            `;

            try {
                console.log(`Personalizing for ${target.fullName}...`);
                const response = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: 500,
                    temperature: 0.6,
                });

                const generatedEmail = response.choices[0]?.message?.content || "AI response empty";

                // Update the contact in Supabase
                await db.updateContact(target.id, {
                    generatedEmail,
                    lastPersonalizedAt: new Date().toISOString(),
                });

                if (targets.length > 3) await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err: any) {
                console.error(`Groq AI failed for saved contact ${target.fullName}:`, err.message || err);
            }
        }

        return NextResponse.json({ success: true, message: `Personalized ${targets.length} contacts.` });

    } catch (error: any) {
        console.error('Personalization API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
