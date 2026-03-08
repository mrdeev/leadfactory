import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

// Initialize Clients
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// Use xAI's Grok or Groq (fallback to Groq if GROK_API_KEY is not set)
const grokApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
const grokBaseUrl = process.env.GROK_API_KEY ? 'https://api.x.ai/v1' : 'https://api.groq.com/openai/v1';

const aiClient = new OpenAI({
    apiKey: grokApiKey,
    baseURL: grokBaseUrl,
});

export const maxDuration = 300; // Allow 5 minutes for execution

export async function POST(req: NextRequest) {
    try {
        let { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Prepend https:// if protocol is missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        console.log(`--- AI Extract: Scraping ${url} ---`);

        // Step 1: Web Scraping using Apify Website Content Crawler (limited to 1 page)
        try {
            const run = await apifyClient.actor("apify/website-content-crawler").call({
                startUrls: [{ url }],
                maxPagesPerCrawl: 1,
                crawlerType: 'cheerio', // Fast and reliable for text extraction
            });

            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

            if (!items || items.length === 0) {
                console.error(`--- AI Extract: No content found for ${url} ---`);
                return NextResponse.json({ error: 'Failed to extract content from the website. Please check if the URL is correct.' }, { status: 404 });
            }

            const firstItem = items[0] as any;
            const pageContent = (firstItem.text || firstItem.markdown || firstItem.description || "") as string;

            if (!pageContent || pageContent.length < 50) {
                console.error(`--- AI Extract: Content too short for ${url} ---`);
                return NextResponse.json({ error: 'Website returned insufficient content for analysis.' }, { status: 400 });
            }

            const cleanContent = pageContent.substring(0, 15000); // Limit context size

            console.log(`--- AI Extract: Processing content with AI (${cleanContent.length} chars) ---`);

            // Step 2: Extract information using AI
            const systemPrompt = `You are an expert business analyst and sales strategist. 
            Extract key business information from the provided website content.
            
            Return exactly this JSON structure:
            {
              "productName": "string",
              "description": "string",
              "industry": "string",
              "targetCustomers": "string",
              "painPoints": "string",
              "valueProposition": "string"
            }

            - Keep descriptions concise (2-3 sentences).
            - Focus on what the product/service is, who it's for, and why it's better.
            - Industry should be 1-3 words.
            - Return ONLY valid JSON. No markdown, no prefixes.`;

            const userPrompt = `Website Content from ${url}:\n\n${cleanContent}`;

            const response = await aiClient.chat.completions.create({
                model: process.env.GROK_API_KEY ? "grok-beta" : "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1000,
            });

            const content = response.choices[0]?.message?.content || "{}";

            // Simple heuristic to extract JSON if wrapped
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;

            try {
                const extractedData = JSON.parse(jsonStr);
                return NextResponse.json(extractedData);
            } catch (parseError) {
                console.error('AI JSON Parse Failed:', content);
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
            }
        } catch (scrapeError: any) {
            console.error('Apify Scrape Error:', scrapeError);
            return NextResponse.json({ error: `Scraping failed: ${scrapeError.message}` }, { status: 500 });
        }

    } catch (error: any) {
        console.error('AI Extract API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
