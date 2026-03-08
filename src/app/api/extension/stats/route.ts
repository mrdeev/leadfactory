import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCors, optionsResponse } from '@/lib/cors'

export async function OPTIONS() {
    return optionsResponse()
}

// GET /api/extension/stats?token=xxx&productId=xxx
// Returns aggregate stats for the extension popup dashboard.
export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const productId = url.searchParams.get('productId')

    if (!token || !productId) {
        return withCors(NextResponse.json({ error: 'Missing token or productId' }, { status: 400 }))
    }

    const product = await db.getProduct(productId)
    if (!product || (product as any).extensionToken !== token) {
        return withCors(NextResponse.json({ error: 'Invalid token or product' }, { status: 401 }))
    }

    const productTasks = await db.getExtensionTasks(productId)

    // Tasks done today
    const today = new Date().toISOString().slice(0, 10)
    const tasksToday = productTasks.filter(
        (t: any) => t.status === 'done' && t.completedAt?.startsWith(today)
    )

    const visitsToday = tasksToday.filter((t: any) => t.type === 'visit').length
    const invitesToday = tasksToday.filter((t: any) => t.type === 'invite').length
    const messagesToday = tasksToday.filter((t: any) => t.type === 'message').length

    // Pending count
    const pendingCount = productTasks.filter((t: any) => t.status === 'pending').length

    // Active leads (leads with active sequence state)
    const states = await db.getSequenceStates()
    const activeLeadCount = states.filter(
        (s: any) => s.productId === productId && s.status === 'active'
    ).length

    // Extension last seen
    const lastSeenAt = (product as any).extensionLastSeenAt || null

    return withCors(NextResponse.json({
        doneTodayCount: tasksToday.length,
        visitsToday,
        invitesToday,
        messagesToday,
        pendingCount,
        activeLeadCount,
        lastSeenAt,
        extensionConnected: (product as any).extensionConnected || false,
    }))
}
