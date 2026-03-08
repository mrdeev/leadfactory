import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;

    const contacts = await db.getContacts(productId);
    return NextResponse.json(contacts);
}

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const productId = url.searchParams.get('productId');
        const body = await request.json();
        let incomingContacts = Array.isArray(body) ? body : [body];

        const storedContacts = productId ? await db.getContacts(productId) : await db.getContacts();
        const addedContacts: any[] = [];

        for (const contact of incomingContacts) {
            // Deduplicate within the same product
            const exists = storedContacts.some((c: any) => {
                const sameProduct = c.productId === productId;
                if (!sameProduct) return false;

                const sameEmail = !!(c.email && contact.email && c.email.toLowerCase() === contact.email.toLowerCase());
                const sameLinkedIn = !!(c.linkedinUrl && contact.linkedinUrl && c.linkedinUrl === contact.linkedinUrl);
                return sameEmail || sameLinkedIn;
            });

            if (!exists) {
                const newContact = {
                    ...contact,
                    productId,
                    id: crypto.randomUUID(),
                    savedAt: new Date().toISOString(),
                };
                await db.saveContact(newContact);
                addedContacts.push(newContact);
            }
        }

        return NextResponse.json({
            success: true,
            addedCount: addedContacts.length,
            message: `Successfully saved ${addedContacts.length} contacts.`
        });
    } catch (error) {
        console.error('Failed to save contact:', error);
        return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Delete from Supabase using the admin client directly
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { error } = await supabaseAdmin.from('contacts').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete contact:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
        }

        const updatedContact = await db.updateContact(id, updates);
        if (!updatedContact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, contact: updatedContact });
    } catch (error) {
        console.error('Failed to update contact:', error);
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }
}
