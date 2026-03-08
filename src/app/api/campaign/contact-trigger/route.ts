import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { contactId, productId } = await req.json();

        if (!contactId) {
            return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product context required' }, { status: 400 });
        }

        // 1. Fetch contact
        const contact = await db.getContact(contactId);
        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // --- CAMPAIGN STATUS CHECK ---
        if (product.campaignStatus === 'paused') {
            return NextResponse.json({ error: 'Campaign is paused' }, { status: 403 });
        }

        // 2. Trigger Personalization
        const personalizeUrl = new URL('/api/ai/personalize', req.url);
        const personalizeRes = await fetch(personalizeUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactIds: [contactId] })
        });

        if (!personalizeRes.ok) {
            const error = await personalizeRes.json();
            return NextResponse.json({ error: error.error || 'Personalization failed' }, { status: personalizeRes.status });
        }

        // 3. Update status and handle approval
        const updatedContact = await db.getContact(contactId);
        let finalContact = null;

        if (updatedContact) {
            if (product.approvalRequired) {
                await db.updateContact(contactId, {
                    status: 'needs_approval',
                });
            } else {
                await db.updateContact(contactId, {
                    status: 'ready',
                });

                // Log message
                await db.saveMessage({
                    id: crypto.randomUUID(),
                    productId,
                    contactId: contact.id,
                    contactName: contact.fullName,
                    email: contact.email,
                    subject: `Outreach for ${product.name}`,
                    body: updatedContact.generatedEmail,
                    snippet: updatedContact.generatedEmail?.substring(0, 150) + '...',
                    status: 'Sent',
                    channel: 'Email',
                    direction: 'outgoing',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toISOString()
                });
            }

            finalContact = await db.getContact(contactId);
        }

        return NextResponse.json({
            success: true,
            message: `Contact ${contact.fullName} triggered successfully. AI has personalized the outreach and logged the message.`,
            contact: finalContact
        });

    } catch (error: any) {
        console.error('Contact Trigger Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
