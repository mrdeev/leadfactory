import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { appendComplianceFooter } from '@/lib/compliance';

export async function POST(req: NextRequest) {
    try {
        const { contactId, productId, editedMessage, editedSubject } = await req.json();

        if (!contactId || !productId) {
            return NextResponse.json({ error: 'Contact ID and Product ID are required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const contact = await db.getContact(contactId);
        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Use edited content if provided, otherwise fallback to generated
        const finalEmailBody = editedMessage || contact.generatedEmail;
        const finalSubject = editedSubject || contact.generatedSubject || `Outreach for ${product.name}`;

        if (!finalEmailBody) {
            return NextResponse.json({ error: 'No email content to approve' }, { status: 400 });
        }

        // 1. Update contact status
        await db.updateContact(contactId, {
            status: 'ready',
            generatedEmail: finalEmailBody,
            generatedSubject: finalSubject,
        });

        // 2. Send Actual Email
        const senderEmail = product.senderEmail || 'support@topsalesagent.ai';
        const complianceBody = appendComplianceFooter(finalEmailBody, contact.id, productId, "123 Business Rd, Tech City, TC 90210");

        try {
            await sendEmail({
                to: contact.email,
                from: `${product.senderName || product.name} <${senderEmail}>`,
                subject: finalSubject,
                text: complianceBody,
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
            console.error('[Approve] Email sending failed:', sendError);
        }

        // 3. Log to messages via db
        await db.saveMessage({
            id: crypto.randomUUID(),
            productId,
            contactId: contact.id,
            contactName: contact.fullName,
            email: contact.email,
            from: senderEmail,
            subject: finalSubject,
            body: finalEmailBody,
            snippet: finalEmailBody.substring(0, 150) + '...',
            status: 'Sent',
            channel: 'Email',
            direction: 'outgoing',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Message approved and sent',
            contact
        });

    } catch (error: any) {
        console.error('Approval Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
