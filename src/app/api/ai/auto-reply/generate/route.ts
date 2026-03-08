import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // In a real app, this would be registered in a DB and potentially 
        // linked to a mail server (e.g., AWS SES or custom Postfix)
        const randomString = crypto.randomBytes(4).toString('hex');
        const forwardingAddress = `leads-${productId}-${randomString}@mail.topsalesagent.ai`;

        return NextResponse.json({
            success: true,
            forwardingAddress
        });

    } catch (error: any) {
        console.error('Auto-Reply Address Generation Failed:', error);
        return NextResponse.json({ error: 'Failed to generate forwarding address' }, { status: 500 });
    }
}
