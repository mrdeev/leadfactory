import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/db';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const productId = searchParams.get('state');

        if (!code || !productId) {
            return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 });
        }

        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens in product config
        await db.updateProduct(productId, {
            calendarConfig: {
                googleTokens: {
                    access_token: tokens.access_token || '',
                    refresh_token: tokens.refresh_token || undefined,
                    expiry_date: tokens.expiry_date || 0,
                    token_type: tokens.token_type || '',
                    scope: tokens.scope || ''
                },
                connected: true
            }
        });

        // Redirect back to the wizard step
        return NextResponse.redirect(new URL(`/wizard/${productId}?step=4&success=true`, req.url));

    } catch (error: any) {
        console.error('Google Auth Callback Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
