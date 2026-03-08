import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId') || undefined;
        const activities = await db.getActivity(productId);
        return NextResponse.json(activities);
    } catch (error: any) {
        console.error('Fetch Activity Error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity history' }, { status: 500 });
    }
}
