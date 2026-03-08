import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, productName, name, ...rest } = body;

        const finalName = productName || name;

        if (!finalName) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        const baseId = finalName.toLowerCase().replace(/\s+/g, '-');
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const productId = id || `${baseId}-${randomSuffix}`;

        const newProduct = {
            id: productId,
            name: finalName,
            ...rest,
            createdAt: new Date().toISOString(),
            emailVerification: {
                email: rest.ceoEmail || '',
                status: 'unverified'
            }
        };

        await db.saveProduct(newProduct as any);

        return NextResponse.json(newProduct);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json(await db.getProducts());
}
