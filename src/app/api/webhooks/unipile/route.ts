import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unipileFetch } from '@/lib/unipile';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log('[webhooks/unipile] Received webhook payload:', JSON.stringify(body));

        // When a new account is connected via Hosted Auth or API
        if (body.event === 'account.created' || body.event === 'account_created') {
            const accountId = body.account_id;
            const name = body.name || ''; // We passed userId|productId here in /api/linkedin/hosted-auth/route.ts
            const provider = body.type || 'UNKNOWN'; // Usually 'LINKEDIN', 'MAIL', 'WHATSAPP'

            console.log(`[webhooks/unipile] New account created: ${accountId} with name/reference: ${name}, Provider: ${provider}`);

            if (name && name.includes('|')) {
                const [userId, productId] = name.split('|');

                if (userId) {
                    console.log(`[webhooks/unipile] Linking new account ${accountId} to user ${userId}`);

                    // 1. Centralized Multi-Tenant Channels Table
                    const channelName = `${provider} Connection`;
                    await db.upsertUserChannel(userId, provider, accountId, channelName);

                    // 2. Legacy Campaign Product Sync (If product ID is present)
                    // First update the specific product if productId is present
                    if (productId && productId !== 'undefined' && productId !== 'null') {
                        await supabaseAdmin
                            .from('products')
                            .update({
                                unipile_account_id: accountId,
                                linkedin_connected: true,
                                linkedin_account_name: 'LinkedIn (via Unipile)'
                            })
                            .eq('id', productId);
                    }

                    // Then update ALL other products for this user so the Unipile connection is synced
                    // This creates the "SaaS experience" where connecting once applies to all their campaigns
                    const { error } = await supabaseAdmin
                        .from('products')
                        .update({
                            unipile_account_id: accountId,
                            linkedin_connected: true,
                            linkedin_account_name: 'LinkedIn (via Unipile)'
                        })
                        .eq('user_id', userId)
                        .is('unipile_account_id', null); // Don't override if they intentionally have different accounts per product

                    if (error) {
                        console.error(`[webhooks/unipile] Error syncing account ${accountId} to user ${userId}'s products:`, error.message);
                    } else {
                        console.log(`[webhooks/unipile] Successfully synced account ${accountId} across user ${userId}'s products`);
                    }
                }
            } else {
                console.warn(`[webhooks/unipile] Account ${accountId} created but missing properly formatted name reference: ${name}`);
            }

            return NextResponse.json({ success: true });
        }

        // We are only interested in account status updates where the account dropped connection
        if (body.event === 'account_status' || body.event === 'account.status') {
            const accountId = body.account_id;
            const status = body.status;

            if (status === 'CREDENTIALS' || status === 'STOPPED') {
                console.log(`[webhooks/unipile] Account ${accountId} needs reconnection. Status: ${status}`);

                // Find the product associated with this account_id
                const { data: product, error } = await supabaseAdmin
                    .from('products')
                    .select('id, linkedin_cookie, linkedin_cookie_a, linkedin_user_agent, linkedin_user_id')
                    .eq('unipile_account_id', accountId)
                    .single();

                if (error || !product) {
                    console.error(`[webhooks/unipile] Could not find product for account ${accountId}`);
                    return NextResponse.json({ success: true, message: 'No matching product found to reconnect' });
                }

                if (!product.linkedin_cookie) {
                    console.warn(`[webhooks/unipile] Product ${product.id} does not have a saved cookie. Cannot auto-reconnect.`);
                    return NextResponse.json({ success: true, message: 'Missing cookies to reconnect' });
                }

                console.log(`[webhooks/unipile] Attempting auto-reconnect for product ${product.id}`);

                const userAgent = product.linkedin_user_agent || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

                const payload: any = {
                    user_agent: userAgent
                };

                const unipileCookies = [
                    {
                        name: "li_at",
                        value: product.linkedin_cookie,
                        domain: ".linkedin.com",
                        path: "/",
                        secure: true,
                        httpOnly: true,
                        expirationDate: Math.floor(Date.now() / 1000) + 31536000
                    }
                ];

                if (product.linkedin_cookie_a) {
                    unipileCookies.push({
                        name: "li_a",
                        value: product.linkedin_cookie_a,
                        domain: ".linkedin.com",
                        path: "/",
                        secure: true,
                        httpOnly: true,
                        expirationDate: Math.floor(Date.now() / 1000) + 31536000
                    });
                }

                payload.cookies = unipileCookies;

                try {
                    const response = await unipileFetch(`/api/v1/accounts/${accountId}/reconnect`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    console.log(`[webhooks/unipile] Reconnection successful for account ${accountId}`);
                } catch (retryError: any) {
                    console.error(`[webhooks/unipile] Reconnection failed for ${accountId}:`, retryError.message);
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[webhooks/unipile] Webhook processing error:', err.message);
        // Let Unipile know we successfully received the hook, even if processing threw an unexpected error, 
        // to prevent Unipile from suspending webhook delivery.
        return NextResponse.json({ success: false, error: err.message }, { status: 200 });
    }
}
