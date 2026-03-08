import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing token', { status: 400 });
        }

        const products = await db.getProducts();
        const product = products.find(p => p.emailVerification?.verificationToken === token);

        if (!product || !product.emailVerification) {
            return new NextResponse('Invalid or expired token', { status: 400 });
        }

        const expires = new Date(product.emailVerification.verificationExpires || '');
        if (expires < new Date()) {
            return new NextResponse('Token has expired', { status: 400 });
        }

        // Token is valid, mark as verified
        await db.updateProduct(product.id, {
            emailVerification: {
                ...product.emailVerification,
                status: 'verified',
                verificationToken: undefined, // Clear token
                verificationExpires: undefined,
                verifiedAt: new Date().toISOString()
            }
        });

        // Redirect to setup page or show success message
        return NextResponse.redirect(new URL(`/dashboard/${product.id}/setup`, req.url));
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
