import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    let states = await db.getSequenceStates();

    if (productId) {
        states = states.filter(s => s.productId === productId);
    }

    return NextResponse.json(states);
}
