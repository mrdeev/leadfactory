import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
    try {
        const { productId, summary, description, start, end, attendeeEmail } = await req.json();

        if (!productId || !start || !end || !attendeeEmail) {
            return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
        }

        const calendar = await getGoogleCalendarClient(productId);

        const event = {
            summary: summary || 'Meeting with AI Agent',
            description: description || 'Scheduled via TopSalesAgent.ai',
            start: { dateTime: start },
            end: { dateTime: end },
            attendees: [{ email: attendeeEmail }],
            reminders: {
                useDefault: true
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            sendUpdates: 'all'
        });

        return NextResponse.json({ success: true, event: response.data });
    } catch (error: any) {
        console.error('Failed to book meeting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
