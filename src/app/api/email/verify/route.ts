import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkIdentityStatus } from '@/lib/email';

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

        const email = product.emailVerification?.email;
        const currentStatus = product.emailVerification?.status;

        // If already verified, just return
        if (currentStatus === 'verified') {
            return NextResponse.json({ status: 'verified' });
        }

        if (!email) {
            return NextResponse.json({ status: 'unverified' });
        }

        // Poll AWS for status
        const awsStatus = await checkIdentityStatus(email);
        console.log(`[Verify] Checking status for ${email}: ${awsStatus}`);

        if (awsStatus === 'Success') {
            // Update DB if AWS says verified
            await db.updateProduct(productId, {
                senderEmail: email, // Sync verified email to senderEmail
                emailVerification: {
                    ...product.emailVerification!,
                    status: 'verified',
                    verifiedAt: new Date().toISOString()
                }
            });
            return NextResponse.json({ status: 'verified' });
        } else if (awsStatus === 'Failed' || awsStatus === 'TemporaryFailure') {
            return NextResponse.json({ status: 'failed', error: 'Verification failed in AWS' });
        }

        return NextResponse.json({ status: 'pending' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Keep POST for backward compatibility or valid token checks if needed, 
// but primarily we use GET for polling now.
export async function POST(req: NextRequest) {
    return GET(req);
}
