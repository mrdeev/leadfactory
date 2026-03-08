import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { productId, toEmail } = await req.json();

        if (!productId || !toEmail) {
            return NextResponse.json({ error: 'Product ID and recipient email are required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.emailVerification?.status !== 'verified') {
            return NextResponse.json({ error: 'Sender email must be verified before sending a test email.' }, { status: 403 });
        }

        const emailParams: any = {
            to: toEmail,
            from: `${product.senderName || 'TopSalesAgent'} <${product.senderEmail}>`,
            subject: 'Test Email from TopSalesAgent',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #6366F1;">Success!</h2>
                    <p>This is a real test email sent from your <strong>TopSalesAgent</strong> dashboard.</p>
                    <p>Settings used:</p>
                    <ul>
                        <li><strong>Provider:</strong> ${product.sendingMethod || 'Platform'}</li>
                        <li><strong>Sender:</strong> ${product.senderName} (${product.senderEmail})</li>
                    </ul>
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">If you received this, your email configuration is working correctly.</p>
                </div>
            `,
            replyTo: product.replyToEmail,
            provider: product.sendingMethod || 'platform'
        };

        // Pass specific config if needed (now handled in lib/email.ts)
        if (product.smtpConfig) emailParams.smtpConfig = product.smtpConfig;
        if (product.sesConfig) emailParams.sesConfig = product.sesConfig;
        if (product.sendgridConfig) emailParams.sendgridConfig = product.sendgridConfig;
        if (product.mailgunConfig) emailParams.mailgunConfig = product.mailgunConfig;

        await sendEmail(emailParams);

        return NextResponse.json({ message: 'Test email sent successfully' });
    } catch (error: any) {
        console.error('Test email failed:', error);
        return NextResponse.json({ error: `Failed to send test email: ${error.message}` }, { status: 500 });
    }
}
