import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            sendingMethod: product.sendingMethod || 'platform',
            senderName: product.senderName || '',
            senderEmail: product.senderEmail || '',
            replyToEmail: product.replyToEmail || '',
            smtpConfig: product.smtpConfig || { host: '', port: 587, username: '' },
            domainAuth: product.domainAuth || { domain: '', status: 'pending' },
            verificationStatus: product.emailVerification?.status || 'unverified'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            productId,
            sendingMethod,
            senderName,
            senderEmail,
            replyToEmail,
            smtpConfig,
            sesConfig,
            sendgridConfig,
            mailgunConfig
        } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Update product with new settings
        await db.updateProduct(productId, {
            sendingMethod,
            senderName,
            senderEmail,
            replyToEmail,
            smtpConfig,
            sesConfig,
            sendgridConfig,
            mailgunConfig,
            // If sender email changed, reset verification
            ...(senderEmail && senderEmail !== product.senderEmail ? {
                emailVerification: {
                    email: senderEmail,
                    status: 'unverified'
                }
            } : {})
        });

        return NextResponse.json({ message: 'Settings saved successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
