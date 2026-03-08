import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sequence/runner?productId=xxx
// Returns current sequence state for all leads of a product.
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId')
    const states = await db.getSequenceStates()
    const filtered = productId ? states.filter(s => s.productId === productId) : states

    const jobs = await db.getSequenceJobs()
    const summary = filtered.map(s => ({
        ...s,
        pendingJob: jobs.find(j => j.leadId === s.leadId && j.status === 'pending') || null,
    }))

    return NextResponse.json({ states: summary, total: summary.length })
}

// POST /api/sequence/runner
// Manual trigger: enqueue all due jobs and kick the worker.
// Used for testing without waiting for the cron.
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}))
    const { productId } = body

    const now = new Date()
    const states = await db.getSequenceStates()
    const existingJobs = await db.getSequenceJobs()

    const due = states.filter(s => {
        if (s.status !== 'active') return false
        if (productId && s.productId !== productId) return false
        if (s.sequenceWaitUntil && new Date(s.sequenceWaitUntil) > now) return false

        const hasActive = existingJobs.some(j => j.leadId === s.leadId && (j.status === 'pending' || j.status === 'processing'))
        return !hasActive
    })

    let enqueued = 0
    for (const state of due) {
        await db.saveSequenceJob({
            id: crypto.randomUUID(),
            leadId: state.leadId,
            productId: state.productId,
            nodeId: state.sequenceNodeId,
            scheduledAt: state.sequenceWaitUntil || now.toISOString(),
            status: 'pending',
            attempts: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        })
        enqueued++
    }

    if (enqueued > 0) {
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
        const host = process.env.VERCEL_URL || 'localhost:3000'
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
        fetch(`${baseUrl}/api/sequence/worker`, { method: 'POST' }).catch(() => { })
    }

    return NextResponse.json({ enqueued, triggeredAt: now.toISOString() })
}
