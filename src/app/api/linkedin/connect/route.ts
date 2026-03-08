// POST /api/linkedin/connect — Accept li_at cookie, connect Unipile account
// GET  /api/linkedin/connect — Check LinkedIn connection status for a product

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unipileFetch } from '@/lib/unipile'

// POST — Accept cookie and connect Unipile account
export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json()
        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 })
        }

        const product = await db.getProduct(productId)
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // We expect the extension to have already synced linkedinCookie (li_at), linkedinCookieA (li_a),
        // linkedinUserAgent, and linkedinUserId to the product.
        if (!product.linkedinCookie) {
            return NextResponse.json({ error: 'No LinkedIn cookie found for this product. Please sync via Extension first.' }, { status: 400 })
        }

        // 2. Connect to Unipile
        let unipileAccountId = null
        try {
            // Use dynamic user_agent from extension if available, otherwise fallback
            const userAgent = product.linkedinUserAgent || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

            // Build the payload
            const payload: any = {
                provider: 'LINKEDIN',
                user_agent: userAgent
            };

            // If we have an explicit provider_id (LinkedIn User ID), pass it
            if (product.linkedinUserId) {
                payload.provider_id = product.linkedinUserId;
            }

            // Unipile supports the "cookies" array for robust auth
            const unipileCookies = [
                {
                    name: "li_at",
                    value: product.linkedinCookie,
                    domain: ".linkedin.com",
                    path: "/",
                    secure: true,
                    httpOnly: true,
                    expirationDate: Math.floor(Date.now() / 1000) + 31536000 // +1 year
                }
            ];

            if (product.linkedinCookieA) {
                unipileCookies.push({
                    name: "li_a",
                    value: product.linkedinCookieA,
                    domain: ".linkedin.com",
                    path: "/",
                    secure: true,
                    httpOnly: true,
                    expirationDate: Math.floor(Date.now() / 1000) + 31536000
                });
            }

            payload.cookies = unipileCookies;

            console.log(`[linkedin/connect] Connecting Unipile account for product ${productId}`, payload)
            const accountData = await unipileFetch('/api/v1/accounts', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            unipileAccountId = accountData.account_id || accountData.id
            if (!unipileAccountId) throw new Error('No account_id returned from Unipile')

            console.log(`[linkedin/connect] Successfully connected Unipile account: ${unipileAccountId}`)

            console.log(`[linkedin/connect] Successfully connected Unipile account: ${unipileAccountId}`)

            // Update the immediate product with Unipile account ID
            await db.updateProduct(productId, {
                unipileAccountId,
                linkedinConnected: true,
                linkedinAccountName: 'LinkedIn (via Unipile)',
            })

            // SaaS: Sync this Unipile account to ALL products owned by the same user
            if (product.userId) {
                const { supabaseAdmin } = await import('@/lib/supabase-admin');
                const { error: syncError } = await supabaseAdmin
                    .from('products')
                    .update({
                        unipile_account_id: unipileAccountId,
                        linkedin_connected: true,
                        linkedin_account_name: 'LinkedIn (via Unipile)',
                    })
                    .eq('user_id', product.userId)
                    .is('unipile_account_id', null);

                if (syncError) {
                    console.error(`[linkedin/connect] Failed to sync Unipile account to other products for user ${product.userId}:`, syncError.message);
                } else {
                    console.log(`[linkedin/connect] Synced Unipile account ${unipileAccountId} across user ${product.userId}'s products`);
                }
            }

            return NextResponse.json({
                success: true,
                unipileAccountId,
                method: 'unipile',
            })

        } catch (err: any) {
            console.error('[linkedin/connect] Unipile account connection failed:', err.message)
            // Even if it failed, the cookie is saved. We mark it as connected for basic functionality.
            await db.updateProduct(productId, {
                linkedinConnected: true,
                linkedinAccountName: 'LinkedIn (Cookie only - Unipile failed)',
            })

            return NextResponse.json({
                error: `Unipile connection failed: ${err.message}`,
                method: 'cookie-only'
            }, { status: 500 })
        }
    } catch (err: any) {
        console.error('[linkedin/connect] POST error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// GET — Check LinkedIn connection status for a product
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId')
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

    const product = await db.getProduct(productId)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    return NextResponse.json({
        linkedinConnected: !!product.unipileAccountId || !!product.linkedinCookie || product.linkedinConnected || false,
        unipileAccountId: product.unipileAccountId || null,
        hasCookie: !!product.linkedinCookie,
        linkedinAccountName: product.linkedinAccountName || null,
    })
}
