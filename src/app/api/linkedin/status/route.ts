import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyLinkedInCookie } from '@/lib/linkedin-automation'

// GET /api/linkedin/status?productId=xxx
// Returns whether the LinkedIn cookie is stored and valid.
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId')
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

    const product = await db.getProduct(productId)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    if (!product.linkedinCookie) {
        return NextResponse.json({ connected: false, reason: 'No cookie stored' })
    }

    // Live check via Apify
    const valid = await verifyLinkedInCookie(product.linkedinCookie)

    if (!valid) {
        // Cookie has expired — update the product record
        await db.updateProduct(productId, { linkedinConnected: false })
        return NextResponse.json({ connected: false, reason: 'Cookie expired or invalid' })
    }

    await db.updateProduct(productId, { linkedinConnected: true })
    return NextResponse.json({
        connected: true,
        accountName: product.linkedinAccountName || 'LinkedIn Account',
    })
}
