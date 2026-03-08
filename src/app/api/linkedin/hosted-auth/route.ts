import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unipileFetch } from '@/lib/unipile';

export async function POST(req: NextRequest) {
    try {
        const { productId, redirectUrl, userId, provider } = await req.json();

        // Optional productId - if it's missing, it implies we are connecting directly from the Channels Dashboard
        // We no longer require productId, we just need a userId for the SaaS flow.
        const reqProvider = provider ? [provider.toUpperCase()] : ['LINKEDIN'];

        let productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/campaigns`;

        if (productId) {
            const product = await db.getProduct(productId);
            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/campaigns/${productId}`;
        }

        if (redirectUrl) productUrl = redirectUrl;

        // Retrieve the logged-in user to map the Unipile account back to them in the webhook
        const { data: { user } } = await supabaseAdmin.auth.getUser(
            req.headers.get('Authorization')?.split('Bearer ')[1] || '' // Not fully relying on this if cookies are present, but good fallback
            // We ideally would use server client here but since this is an API called from the client, 
            // the auth headers or cookies should be present. We'll use a simpler approach of 
            // just decoding the JWT if needed, or trusting the client payload. 
        );

        const finalUserId = user?.id || userId;
        if (!finalUserId) {
            return NextResponse.json({ error: 'User must be logged in to connect' }, { status: 401 });
        }

        console.log(`[linkedin/hosted-auth] Generating Hosted Auth link for user ${finalUserId}, provider ${reqProvider[0]}`);

        // Construct the Unipile Hosted Auth payload
        // We embed the userId and optionally productId in the 'name' field separated by pipes so we can parse it in the webhook
        const namePayload = productId ? `${finalUserId}|${productId}` : `${finalUserId}|`;

        const payload = {
            type: 'create',
            providers: reqProvider,
            name: namePayload,
            api_url: process.env.UNIPILE_API_URL,
            expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiration
            success_url: productUrl,
            cancel_url: productUrl,
        };

        const responseData = await unipileFetch('/api/v1/hosted/accounts/link', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!responseData.url) {
            throw new Error('No Hosted Auth URL returned from Unipile');
        }

        console.log(`[linkedin / hosted - auth] Successfully generated link: ${responseData.url} `);

        return NextResponse.json({
            success: true,
            url: responseData.url
        });

    } catch (err: any) {
        console.error('[linkedin/hosted-auth] Error generating link:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
