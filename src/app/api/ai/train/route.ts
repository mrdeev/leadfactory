import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { linkedinUrl } = body;

        if (!linkedinUrl) {
            return NextResponse.json({ error: 'LinkedIn URL is required' }, { status: 400 });
        }

        console.log(`Training AI with posts from: ${linkedinUrl} via Groq...`);

        // Scrape LinkedIn posts using Apify - using the correct actor params
        const run = await apifyClient.actor("Wpp1BZ6yGWjySadk3").call({
            urls: [linkedinUrl],
            limitPerSource: 5,
            deepScrape: true
        });

        const { items: posts } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        if (!posts || posts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Profile analyzed, but no recent public posts found. Basic profile data will be used for training."
            });
        }

        // --- NEW: Use Groq to "Train" (Analyze) the content ---
        const combinedPosts = posts.map(p => p.text || p.content).filter(Boolean).join('\n\n---\n\n');

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an AI trainer. Analyze the following LinkedIn posts to extract the author's writing style, core expertise, and common themes. Provide a 1-sentence summary of the 'AI Persona' learned."
                },
                { role: "user", content: `Posts:\n${combinedPosts.substring(0, 5000)}` }
            ],
            max_tokens: 150,
            temperature: 0.5,
        });

        const analysis = response.choices[0]?.message?.content || "Successfully analyzed profile posts.";

        return NextResponse.json({
            success: true,
            postCount: posts.length,
            message: `AI Trained! ${analysis}`
        });

    } catch (error: any) {
        console.error('AI Training Failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to train AI' }, { status: 500 });
    }
}
