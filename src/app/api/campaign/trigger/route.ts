import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { appendComplianceFooter } from '@/lib/compliance';

export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const product = await db.getProduct(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // --- STRICT BACKEND CHECK ---
        if (product.emailVerification?.status !== 'verified') {
            return NextResponse.json({ error: 'Email not verified. Campaign sending is blocked.' }, { status: 403 });
        }

        // 2. Fetch contacts for this product
        const allContacts = await db.getContacts(productId);

        // Filter contacts that belong to this product and haven't been processed yet
        const targetContacts = allContacts.filter((c: any) =>
            (!c.status || c.status === 'waiting' || c.status === 'imported')
        );

        if (targetContacts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending contacts to process for this campaign.'
            });
        }

        // 3. Trigger Personalization via Internal API Call
        const personalizeUrl = new URL('/api/ai/personalize', req.url);
        const personalizeRes = await fetch(personalizeUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactIds: targetContacts.map((c: any) => c.id) })
        });

        if (!personalizeRes.ok) {
            const error = await personalizeRes.json();
            return NextResponse.json({ error: error.error || 'Batch personalization failed' }, { status: personalizeRes.status });
        }

        // 4. Update statuses based on approvalRequired setting
        // Re-read contacts to get the personalized data
        const updatedAllContacts = await db.getContacts(productId);
        let processedCount = 0;

        for (const contactId of targetContacts.map((c: any) => c.id)) {
            const contact = updatedAllContacts.find((c: any) => c.id === contactId);
            if (!contact) continue;

            if (product.approvalRequired) {
                await db.updateContact(contactId, {
                    status: 'needs_approval',
                });
            } else {
                await db.updateContact(contactId, {
                    status: 'ready',
                });

                // Send email and log if no approval required
                const senderEmail = product.senderEmail || 'support@topsalesagent.ai';

                try {
                    await sendEmail({
                        to: contact.email,
                        from: `${product.senderName || product.name} <${senderEmail}>`,
                        subject: `Outreach for ${product.name}`,
                        text: contact.generatedEmail,
                        provider: product.sendingMethod || 'platform',
                        sesConfig: product.sesConfig,
                        sendgridConfig: product.sendgridConfig,
                        mailgunConfig: product.mailgunConfig,
                        smtpConfig: product.smtpConfig ? {
                            host: product.smtpConfig.host,
                            port: product.smtpConfig.port,
                            user: product.smtpConfig.username,
                            pass: product.smtpConfig.password || ''
                        } : undefined,
                        replyTo: product.replyToEmail
                    });
                } catch (sendError) {
                    console.error(`[Trigger] Failed to send email to ${contact.email}:`, sendError);
                }

                // Log message
                await db.saveMessage({
                    id: crypto.randomUUID(),
                    productId,
                    contactId: contact.id,
                    contactName: contact.fullName,
                    email: contact.email,
                    from: senderEmail,
                    subject: `Outreach for ${product.name}`,
                    body: contact.generatedEmail,
                    snippet: contact.generatedEmail?.substring(0, 150) + '...',
                    status: 'Sent',
                    channel: 'Email',
                    direction: 'outgoing',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toISOString()
                });
            }
            processedCount++;
        }

        // 5. Activity Logging
        await db.logActivity(
            productId,
            'trigger',
            'batch',
            'completed',
            `Processed ${processedCount} leads. Status set to ${product.approvalRequired ? 'Needs Review' : 'Ready'}.`
        );

        return NextResponse.json({ success: true, processedCount });
    } catch (error: any) {
        console.error('Batch Campaign Trigger Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
