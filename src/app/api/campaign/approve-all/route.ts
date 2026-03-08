import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { appendComplianceFooter } from '@/lib/compliance';

// GET: count contacts pending approval for a product
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    const contacts = await db.getContacts(productId);
    const pending = contacts.filter((c: any) => c.status === 'needs_approval');

    return NextResponse.json({ pendingCount: pending.length });
}

// POST: approve and send all pending emails for a product
export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const product = await db.getProduct(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const contacts = await db.getContacts(productId);
        const pendingContacts = contacts.filter(
            (c: any) => c.status === 'needs_approval'
        );

        if (pendingContacts.length === 0) {
            return NextResponse.json({ success: true, message: 'No contacts pending approval.', count: 0 });
        }

        const senderEmail = product.senderEmail || 'support@topsalesagent.ai';
        let sentCount = 0;
        let failCount = 0;

        for (const contact of pendingContacts) {
            const emailBody = contact.generatedEmail;
            const emailSubject = contact.generatedSubject || `${product.name} — quick question`;

            if (!emailBody) {
                failCount++;
                continue;
            }

            const bodyWithCompliance = appendComplianceFooter(emailBody, contact.id, productId, '');

            try {
                await sendEmail({
                    to: contact.email,
                    from: `${product.senderName || product.name} <${senderEmail}>`,
                    subject: emailSubject,
                    text: bodyWithCompliance,
                    provider: product.sendingMethod || 'platform',
                    sesConfig: product.sesConfig,
                    sendgridConfig: product.sendgridConfig,
                    mailgunConfig: product.mailgunConfig,
                    smtpConfig: product.smtpConfig ? {
                        host: product.smtpConfig.host,
                        port: product.smtpConfig.port,
                        user: product.smtpConfig.username,
                        pass: product.smtpConfig.password || '',
                    } : undefined,
                    replyTo: product.replyToEmail,
                });

                // Mark contact as sent
                await db.updateContact(contact.id, {
                    status: 'ready',
                });

                // Log message
                await db.saveMessage({
                    id: crypto.randomUUID(),
                    productId,
                    contactId: contact.id,
                    contactName: contact.fullName,
                    email: contact.email,
                    from: senderEmail,
                    subject: emailSubject,
                    body: emailBody,
                    snippet: emailBody.substring(0, 150) + '...',
                    status: 'Sent',
                    channel: 'Email',
                    direction: 'outgoing',
                    campaignStep: contact.campaignStep || 1,
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toISOString(),
                });

                sentCount++;
            } catch (sendErr: any) {
                console.error(`[Approve All] Failed to send to ${contact.email}:`, sendErr.message);
                await db.updateContact(contact.id, {
                    status: 'send_failed',
                });
                failCount++;
            }

            // Small delay to avoid rate limits
            if (pendingContacts.length > 5) await new Promise(r => setTimeout(r, 200));
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failCount,
            message: `Approved and sent ${sentCount} email${sentCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}.`,
        });
    } catch (error: any) {
        console.error('Approve All Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
