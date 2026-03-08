import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
    try {
        const { productId, timeMin, timeMax } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const calendar = await getGoogleCalendarClient(productId);

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [{ id: 'primary' }]
            }
        });

        const busy = response.data.calendars?.primary?.busy || [];

        return NextResponse.json({ busy });
    } catch (error: any) {
        console.error('Failed to fetch availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
