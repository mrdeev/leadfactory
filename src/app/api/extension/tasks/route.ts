import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCors, optionsResponse } from '@/lib/cors'

export async function OPTIONS() {
    return optionsResponse()
}

// GET /api/extension/tasks?token=xxx&productId=xxx
// Returns pending extension tasks for the Chrome extension to execute.
export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const productId = url.searchParams.get('productId')

    if (!token || !productId) {
        return withCors(NextResponse.json({ error: 'Missing token or productId' }, { status: 400 }))
    }

    const product = await db.getProduct(productId)
    if (!product) {
        return withCors(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
    }

    if ((product as any).extensionToken !== token) {
        return withCors(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
    }

    // Update last-seen heartbeat
    await db.updateProduct(productId, {
        extensionConnected: true,
        extensionLastSeenAt: new Date().toISOString(),
    })

    const allTasks = await db.getExtensionTasks(productId)
    const tasks = allTasks
        .filter((t: any) => t.status === 'pending')
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return withCors(NextResponse.json({ tasks, total: tasks.length }))
}
