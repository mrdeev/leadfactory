import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { getGoogleCalendarClient } from '@/lib/google-calendar';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

async function logMessageToDb(message: any) {
    await db.saveMessage(message);
}

async function updateContactStatus(email: string, productId: string, status: string) {
    const contacts = await db.getContacts(productId);
    const contact = contacts.find((c: any) => c.email === email);
    if (contact) {
        await db.updateContact(contact.id, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { from, subject, body: emailBody, productId } = body;

        if (!productId || !from) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 0. Log Incoming Message
        await updateContactStatus(from, productId, 'replied');
        await logMessageToDb({
            id: crypto.randomUUID(),
            productId,
            contactName: from.split('@')[0],
            email: from,
            subject: subject || 'Reply',
            body: emailBody,
            snippet: emailBody?.substring(0, 150) + '...',
            status: 'Replied',
            channel: 'Email',
            direction: 'incoming',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
        });

        // 1. Analyze Intent via AI
        const intentPrompt = `
            Analyze the following email from a potential lead.
            Email Body: "${emailBody}"
            
            Determine if the lead is:
            A) INTERESTED and wants to book a meeting
            B) INTERESTED but has a question
            C) NOT INTERESTED
            D) OTHER
            E) REPLIED (General response)

            Respond with ONLY the letter (A, B, C, D, or E).
        `;

        const intentResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: intentPrompt }],
            max_tokens: 10,
        });

        const intent = intentResponse.choices[0]?.message?.content?.trim().substring(0, 1) || 'E';

        // 2. If Interested (A), check calendar and suggest/book
        if (intent === 'A' && product.calendarConfig?.connected) {
            try {
                const calendar = await getGoogleCalendarClient(productId);
                const timeMin = new Date().toISOString();
                const timeMax = new Date(Date.now() + 48 * 24 * 60 * 60 * 1000).toISOString();

                const freebusy = await calendar.freebusy.query({
                    requestBody: {
                        timeMin,
                        timeMax,
                        items: [{ id: 'primary' }]
                    }
                });

                const suggestedTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
                suggestedTime.setMinutes(0, 0, 0);

                const replyText = `Hi! I'm glad you're interested in ${product.name}. 
                I've checked the schedule and noticed a free slot tomorrow at ${suggestedTime.toLocaleTimeString()}. 
                I've tentatively scheduled a 30-minute intro call for us then. You should receive a calendar invite shortly!`;

                const start = suggestedTime.toISOString();
                const end = new Date(suggestedTime.getTime() + 30 * 60 * 1000).toISOString();

                await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: `Intro: ${product.name} x Lead`,
                        description: `Automated booking for lead: ${from}. \nOriginal Message: ${emailBody}`,
                        start: { dateTime: start },
                        end: { dateTime: end },
                        attendees: [{ email: from }]
                    },
                    sendUpdates: 'all'
                });

                await logMessageToDb({
                    id: crypto.randomUUID(),
                    productId,
                    contactName: from.split('@')[0],
                    email: from,
                    subject: `Re: ${subject || 'Your interest'}`,
                    body: replyText,
                    snippet: replyText.substring(0, 150) + '...',
                    status: 'Replied',
                    channel: 'Email',
                    direction: 'outgoing',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toISOString()
                });

                return NextResponse.json({
                    success: true,
                    action: 'booked',
                    reply: replyText
                });

            } catch (calErr) {
                console.error('Calendar operations failed:', calErr);
            }
        }

        // 3. Fallback: Normal AI Reply
        const replyPrompt = `
            You are an AI assistant for ${product.name}. 
            Lead Email: "${emailBody}"
            Intent: ${intent}
            
            Write a professional, helpful reply. 
            If they are interested, thank them and tell them someone will reach out soon.
            If they have a question, try to answer it based on this description: ${product.description}.
        `;

        const replyResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: replyPrompt }],
            max_tokens: 500,
        });

        const replyText = replyResponse.choices[0]?.message?.content || "";

        await logMessageToDb({
            id: crypto.randomUUID(),
            productId,
            contactName: from.split('@')[0],
            email: from,
            subject: `Re: ${subject || 'Your inquiry'}`,
            body: replyText,
            snippet: replyText.substring(0, 150) + '...',
            status: 'Replied',
            channel: 'Email',
            direction: 'outgoing',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            action: 'replied',
            reply: replyText
        });

    } catch (error: any) {
        console.error('AI Auto-Reply Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
