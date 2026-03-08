import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/products/airtop-config
// Sets Airtop cloud browser credentials on a product.
// Body: { productId, airtopApiKey, airtopProfileId }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { productId, airtopApiKey, airtopProfileId } = body

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            )
        }

        if (!airtopApiKey || !airtopProfileId) {
            return NextResponse.json(
                { error: 'Both airtopApiKey and airtopProfileId are required' },
                { status: 400 }
            )
        }

        const product = await db.getProduct(productId)
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        const updated = await db.updateProduct(productId, {
            airtopApiKey,
            airtopProfileId,
        })

        if (!updated) {
            return NextResponse.json(
                { error: 'Failed to update product' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            productId,
            airtopConfigured: true,
            message: 'Airtop credentials saved. The action-router will now prefer Airtop for LinkedIn actions when the extension is offline.',
        })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal error' },
            { status: 500 }
        )
    }
}

// GET /api/products/airtop-config?productId=xxx
// Check Airtop configuration status for a product.
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId')
    if (!productId) {
        return NextResponse.json(
            { error: 'productId query param required' },
            { status: 400 }
        )
    }

    const product = await db.getProduct(productId)
    if (!product) {
        return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
        )
    }

    return NextResponse.json({
        productId,
        airtopConfigured: !!(product.airtopApiKey && product.airtopProfileId),
        hasApiKey: !!product.airtopApiKey,
        hasProfileId: !!product.airtopProfileId,
    })
}
