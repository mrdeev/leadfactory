
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { contactId, productId } = await req.json();

        if (!contactId || !productId) {
            return NextResponse.json({ error: 'Missing contactId or productId' }, { status: 400 });
        }

        const contact = await db.getContact(contactId);
        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        await db.updateContact(contactId, {
            status: 'unsubscribed',
            unsubscribedAt: new Date().toISOString(),
            unsubscribed: true,
        });

        return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });

    } catch (error: any) {
        console.error('Unsubscribe Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
