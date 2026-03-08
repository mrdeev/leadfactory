import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { productId, to } = await req.json();

        if (!productId || !to) {
            return NextResponse.json({ error: 'Missing productId or to' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // --- VERIFICATION CHECK ---
        // BYOAK (Bring Your Own API Key) users don't need email verification
        // since they've already verified with their own provider
        const isByoak = product.sendingMethod && product.sendingMethod !== 'platform';

        if (!isByoak && product.emailVerification?.status !== 'verified') {
            return NextResponse.json({ error: 'Email not verified. Outreach is blocked. (Required for Platform users)' }, { status: 403 });
        }

        const fromEmail = product.senderEmail || product.emailVerification?.email;
        const senderName = product.senderName || 'AI Sales Agent';

        // Build email params using the user's configured provider
        const emailParams: any = {
            to: to,
            from: `${senderName} <${fromEmail}>`,
            subject: `Test Campaign Email for ${product.name}`,
            html: `
                <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h1 style="font-size: 18px;">Test Outreach for ${product.name}</h1>
                    <p>This is a real test email sent from your AI CRM server.</p>
                    <p><strong>Sender:</strong> ${senderName}</p>
                    <p><strong>From:</strong> ${fromEmail}</p>
                    <p><strong>Provider:</strong> ${product.sendingMethod || 'platform'}</p>
                </div>
            `,
            replyTo: product.replyToEmail,
            provider: product.sendingMethod || 'platform',
        };

        // Pass provider-specific configs
        if (product.smtpConfig) emailParams.smtpConfig = product.smtpConfig;
        if (product.sesConfig) emailParams.sesConfig = product.sesConfig;
        if (product.sendgridConfig) emailParams.sendgridConfig = product.sendgridConfig;
        if (product.mailgunConfig) emailParams.mailgunConfig = product.mailgunConfig;

        // Send email using the multi-provider sendEmail function
        await sendEmail(emailParams);

        console.log(`--- Real Test Email Sent via ${product.sendingMethod || 'platform'} for ${product.name} ---`);
        return NextResponse.json({ success: true, provider: product.sendingMethod || 'platform' });
    } catch (error: any) {
        console.error('Test email error:', error);

        let errorMessage = error.message;

        // Handle SendGrid's deeply nested errors
        if (error.response?.body?.errors?.[0]?.message) {
            errorMessage = error.response.body.errors[0].message;
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        return NextResponse.json({
            error: errorMessage,
            details: error.response?.body || error.response?.data || null
        }, { status: 500 });
    }
}
