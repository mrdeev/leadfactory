import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyEmailIdentity } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { productId, email } = await req.json();

        if (!productId || !email) {
            return NextResponse.json({ error: 'Product ID and email are required' }, { status: 400 });
        }

        // Email Validation Logic
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const domain = email.split('@')[1].toLowerCase();
        const blockedDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
            'icloud.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
            'live.com', 'msn.com', 'me.com', 'mac.com'
        ];

        if (blockedDomains.includes(domain)) {
            return NextResponse.json({
                error: 'Please use a business email address. Personal email providers are not accepted.'
            }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        console.log(`[Verify] Triggering AWS SES verification for ${email}`);

        // Trigger AWS SES Verification
        await verifyEmailIdentity(email);

        // Update DB
        await db.updateProduct(productId, {
            emailVerification: {
                email,
                status: 'pending',
                // No token needed for AWS SES (it handles the link)
            }
        });

        return NextResponse.json({ message: 'AWS Verification email sent. Please check your inbox for an email from Amazon Web Services.' });
    } catch (error: any) {
        console.error('Failed to trigger verification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
