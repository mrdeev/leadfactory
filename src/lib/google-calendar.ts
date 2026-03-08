import { google } from 'googleapis';
import { db } from '@/lib/db';

export async function getGoogleCalendarClient(productId: string) {
    const product = await db.getProduct(productId);
    if (!product || !product.calendarConfig?.googleTokens) {
        throw new Error('Google Calendar not connected for this product');
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(product.calendarConfig.googleTokens);

    // Handle token refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            // Update the refresh token if a new one is provided
            await db.updateProduct(productId, {
                calendarConfig: {
                    ...product.calendarConfig!,
                    googleTokens: {
                        ...product.calendarConfig!.googleTokens!,
                        refresh_token: tokens.refresh_token,
                        access_token: tokens.access_token || product.calendarConfig!.googleTokens!.access_token,
                        expiry_date: tokens.expiry_date || product.calendarConfig!.googleTokens!.expiry_date
                    }
                }
            });
        } else if (tokens.access_token) {
            // Update only the access token and expiry
            await db.updateProduct(productId, {
                calendarConfig: {
                    ...product.calendarConfig!,
                    googleTokens: {
                        ...product.calendarConfig!.googleTokens!,
                        access_token: tokens.access_token,
                        expiry_date: tokens.expiry_date || product.calendarConfig!.googleTokens!.expiry_date
                    }
                }
            });
        }
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}
