import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId') || undefined;
        const messages = await db.getMessages(productId);
        return NextResponse.json(messages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, contactId, contactName, email, subject, body: messageBody, channel, direction, status } = body;

        // Basic validation
        if (!productId || !email || !messageBody) {
            return NextResponse.json({ error: 'Missing required fields (productId, email, body)' }, { status: 400 });
        }

        const newMessage = {
            id: crypto.randomUUID(),
            productId,
            contactId: contactId || null,
            contactName: contactName || 'Unknown Contact',
            email,
            from: direction === 'incoming' ? email : (body.from || 'platform'),
            subject: subject || 'No Subject',
            body: messageBody,
            snippet: messageBody.substring(0, 150) + (messageBody.length > 150 ? '...' : ''),
            status: status || (direction === 'incoming' ? 'Received' : 'Sent'),
            channel: channel || 'Email',
            direction: direction || 'incoming',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
        };

        await db.saveMessage(newMessage);

        return NextResponse.json({ success: true, message: newMessage });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
