import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Client
const grokApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
const grokBaseUrl = process.env.GROK_API_KEY ? 'https://api.x.ai/v1' : 'https://api.groq.com/openai/v1';

const aiClient = new OpenAI({
    apiKey: grokApiKey,
    baseURL: grokBaseUrl,
});

export const maxDuration = 300; // Allow 5 minutes for execution

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            productName = "NordicAirHost",
            productDescription = "Property management for Airbnb hosts.",
            pipelineTemplate = "general"
        } = body;

        const systemPrompt = `You are a sophisticated AI Sales Strategist. Your goal is to create a high-level sales and marketing strategy for a B2B product.
        The strategy should be tailored for a ${pipelineTemplate.toUpperCase()} sales model.
        
        Return the response in JSON format with the following keys:
        - targetAudience (string): Description of the ideal customer profile.
        - keyValueMessages (string): Core value propositions.
        - outreachApproach (string): How the AI assistant engages prospects.
        - followUpStrategy (string): Strategy for following up.
        - successMetrics (string): KPIs to track.
        
        Keep descriptions concise (2-3 sentences max per section), professional, and persuasive.
        Return ONLY valid JSON, no markdown formatting.`;

        const userPrompt = `Generate a marketing strategy for:
        Product Name: ${productName}
        Description: ${productDescription}`;

        const response = await aiClient.chat.completions.create({
            model: process.env.GROK_API_KEY ? "grok-beta" : "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || "{}";

        // Simple heuristic to extract JSON if wrapped in markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        try {
            const strategy = JSON.parse(jsonStr);
            return NextResponse.json(strategy);
        } catch (parseError) {
            console.error('AI Strategy JSON Parse Failed. Content:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('AI Strategy Generation Failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate strategy' }, { status: 500 });
    }
}
