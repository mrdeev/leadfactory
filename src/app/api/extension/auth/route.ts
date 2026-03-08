import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCors, optionsResponse } from '@/lib/cors'

export async function OPTIONS() {
    return optionsResponse()
}

// POST /api/extension/auth
export async function POST(req: NextRequest) {
    try {
        const { productId, token } = await req.json()

        if (!productId || !token) {
            return withCors(NextResponse.json({ error: 'Missing productId or token' }, { status: 400 }))
        }

        const product = await db.getProduct(productId)
        if (!product) {
            return withCors(NextResponse.json({ error: 'Product not found', success: false }, { status: 404 }))
        }

        // Validate the token
        if (!(product as any).extensionToken || (product as any).extensionToken !== token) {
            return withCors(NextResponse.json({ error: 'Invalid extension token', success: false }, { status: 401 }))
        }

        // Mark extension as connected
        await db.updateProduct(productId, {
            extensionConnected: true,
            extensionLastSeenAt: new Date().toISOString(),
        })

        return withCors(NextResponse.json({
            success: true,
            productName: product.name,
            productId: product.id,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message, success: false }, { status: 500 }))
    }
}
