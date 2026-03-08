import { NextRequest, NextResponse } from 'next/server'
import { db, SequenceJob } from '@/lib/db'
import { ActionRouter } from '@/lib/action-router'
import { resolveNextNode, calcWaitUntil, getNode } from '@/lib/sequence-graph'

export const maxDuration = 300

function getBaseUrl() {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const host = process.env.VERCEL_URL || 'localhost:3000'
    return process.env.NEXTAUTH_URL || `${protocol}://${host}`
}

async function chainWorker() {
    const remaining = (await db.getSequenceJobs()).filter(j => j.status === 'pending')
    if (remaining.length > 0) {
        fetch(`${getBaseUrl()}/api/sequence/worker`, { method: 'POST' }).catch(() => { })
    }
}

// POST /api/sequence/worker
// Processes ONE pending job from the sequence_jobs table.
// Called fire-and-forget by the cron endpoint, or chained from itself.
export async function POST(_req: NextRequest) {
    // ─── Stale Check and Recovery ──────────────────────────────────────────
    const allStates = await db.getSequenceStates()
    const allJobs = await db.getSequenceJobs()
    const now = new Date().getTime()
    let recoveredCount = 0

    for (const state of allStates) {
        if (state.status === 'active') {
            const product = await db.getProduct(state.productId)
            if (!product || product.campaignStatus !== 'active') continue

            const node = getNode(state.sequenceNodeId, product.campaignSequence?.nodes)
            if (!node || !['linkedin_visit', 'linkedin_invite', 'linkedin_chat', 'condition'].includes(node.type)) continue

            const hasActiveJob = allJobs.some(j => j.leadId === state.leadId && j.nodeId === state.sequenceNodeId && (j.status === 'pending' || j.status === 'processing'))
            if (hasActiveJob) continue

            // If it's been > 15 mins since it entered this node, re-enqueue
            const enteredAt = new Date(state.updatedAt || state.sequenceEnteredAt).getTime()
            if (now - enteredAt > 15 * 60 * 1000) {
                console.log(`[worker] Recovering stalled node ${state.sequenceNodeId} for lead ${state.leadId}`)
                await db.saveSequenceJob({
                    id: crypto.randomUUID(),
                    leadId: state.leadId,
                    productId: state.productId,
                    nodeId: state.sequenceNodeId,
                    scheduledAt: new Date().toISOString(),
                    status: 'pending',
                    attempts: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                recoveredCount++
            }
        }
    }

    const jobs = await db.getSequenceJobs()
    const job = jobs.find(j => j.status === 'pending')

    if (!job) {
        return NextResponse.json({ message: 'No pending jobs', recoveredCount })
    }

    // Mark as processing immediately to prevent double-processing
    await db.updateSequenceJob(job.id, { status: 'processing' })

    try {
        // Check product status BEFORE executing
        const product = await db.getProduct(job.productId)
        if (!product || product.campaignStatus !== 'active') {
            await db.updateSequenceJob(job.id, { status: 'failed', error: 'Campaign not active or product not found' })
            await chainWorker()
            return NextResponse.json({ success: false, reason: 'Campaign not active' })
        }

        const result = await ActionRouter.execute(job.nodeId, job.leadId, job.productId)

        if (!result.success) {
            // Failed or skipped — do NOT advance the sequence
            const attempts = (job.attempts || 0) + 1
            if (result.skipped && attempts >= 3) {
                // Permanently skipped (e.g. no credentials) — mark failed, don't retry forever
                await db.updateSequenceJob(job.id, { status: 'failed', attempts, error: result.reason || 'Action skipped' })
                await db.updateSequenceState(job.leadId, { status: 'failed' })
                await db.logActivity(job.productId, job.nodeId, job.leadId, 'failed', `Skipped after ${attempts} attempts: ${result.reason || 'unknown'}`)
            } else if (attempts >= 3) {
                await db.updateSequenceJob(job.id, { status: 'failed', attempts, error: result.reason })
                await db.updateSequenceState(job.leadId, { status: 'failed' })
            } else {
                await db.updateSequenceJob(job.id, { status: 'pending', attempts, error: result.reason })
            }
            await chainWorker()
            return NextResponse.json({ success: false, reason: result.reason })
        }

        // ── Advance state immediately ─────────────────────────────────────
        const customNodes = product?.campaignSequence?.nodes
        const nextNodeId = resolveNextNode(job.nodeId, customNodes, result.linkedinConnected)

        if (!nextNodeId || nextNodeId === 'end') {
            await db.updateSequenceJob(job.id, { status: 'done' })
            await db.updateSequenceState(job.leadId, { status: 'complete', sequenceNodeId: 'end' })
            await chainWorker()
            return NextResponse.json({ success: true, complete: true })
        }

        const nextNode = getNode(nextNodeId, customNodes)
        if (!nextNode) {
            await db.updateSequenceJob(job.id, { status: 'failed', error: `Unknown next node: ${nextNodeId}` })
            await chainWorker()
            return NextResponse.json({ success: false, reason: `Unknown next node: ${nextNodeId}` })
        }

        // Advance the state
        const waitUntil = calcWaitUntil(nextNodeId, customNodes)
        await db.updateSequenceState(job.leadId, {
            sequenceNodeId: nextNodeId,
            sequenceWaitUntil: waitUntil,
            sequenceEnteredAt: new Date().toISOString(),
            status: 'active',
        })
        await db.updateSequenceJob(job.id, { status: 'done' })

        // If the next step is immediately due (waitBeforeDays 0), enqueue it now
        if (nextNode.waitBeforeDays === 0) {
            const immediateJob: SequenceJob = {
                id: crypto.randomUUID(),
                leadId: job.leadId,
                productId: job.productId,
                nodeId: nextNodeId,
                scheduledAt: new Date().toISOString(),
                status: 'pending',
                attempts: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            await db.saveSequenceJob(immediateJob)
        }

        await chainWorker()

        return NextResponse.json({
            success: true,
            completedNodeId: job.nodeId,
            nextNodeId,
            waitUntil,
        })
    } catch (err: any) {
        const attempts = (job.attempts || 0) + 1
        await db.updateSequenceJob(job.id, {
            status: attempts >= 3 ? 'failed' : 'pending',
            attempts,
            error: err.message,
        })
        await chainWorker()
        return NextResponse.json({ success: false, reason: err.message }, { status: 500 })
    }
}
