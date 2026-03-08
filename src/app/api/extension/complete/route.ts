import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCors, optionsResponse } from '@/lib/cors'

export async function OPTIONS() {
    return optionsResponse()
}

// POST /api/extension/complete
export async function POST(req: NextRequest) {
    try {
        const { taskId, token, status, data } = await req.json()

        if (!taskId || !token || !status) {
            return withCors(NextResponse.json({ error: 'Missing taskId, token, or status' }, { status: 400 }))
        }

        // Find and validate the task
        const allTasks = await db.getExtensionTasks()
        const task = allTasks.find((t: any) => t.id === taskId)
        if (!task) {
            return withCors(NextResponse.json({ error: 'Task not found' }, { status: 404 }))
        }

        // Validate token against the task's product
        const product = await db.getProduct(task.productId)
        if (!product || (product as any).extensionToken !== token) {
            return withCors(NextResponse.json({ error: 'Invalid token' }, { status: 401 }))
        }

        // Update task status
        await db.updateExtensionTask(taskId, {
            status,
            completedAt: new Date().toISOString(),
            resultData: data || null,
        })

        // Update contact record based on task type
        const now = new Date().toISOString()
        if (task.type === 'visit' && status === 'done') {
            await db.updateContact(task.leadId, { linkedinVisitedAt: now, sequenceNodeId: task.nodeId })
        } else if (task.type === 'invite' && status === 'done') {
            await db.updateContact(task.leadId, { linkedinInviteSentAt: now, sequenceNodeId: task.nodeId })
        } else if (task.type === 'message' && status === 'done') {
            await db.updateContact(task.leadId, { linkedinChatSentAt: now, sequenceNodeId: task.nodeId })
        } else if (task.type === 'check_acceptance' && status === 'done') {
            const connected = data?.connected === true
            await db.updateContact(task.leadId, {
                linkedinConnected: connected,
                linkedinConnectionCheckedAt: now,
                sequenceNodeId: task.nodeId,
            })
        }

        // Log activity
        const statusLabel = status === 'done' ? 'done' : 'error'
        const typeLabel: Record<string, string> = {
            visit: 'Profile visited',
            invite: 'Connection invite sent',
            message: 'LinkedIn message sent',
            check_acceptance: 'Acceptance checked',
        }
        await db.logActivity(
            task.productId,
            task.nodeId,
            task.leadId,
            statusLabel,
            `[Extension] ${typeLabel[task.type] || task.type} for ${task.contactName || task.leadId}`
        )

        // ── Advance the sequence state ─────────────────────────────────────
        if (status === 'done') {
            const { resolveNextNode, calcWaitUntil, getNode } = await import('@/lib/sequence-graph')

            const linkedinConnected = task.type === 'check_acceptance' ? (data?.connected === true) : undefined
            const customNodes = product.campaignSequence?.nodes
            const nextNodeId = resolveNextNode(task.nodeId, customNodes, linkedinConnected)

            if (!nextNodeId || nextNodeId === 'end') {
                await db.updateSequenceState(task.leadId, { status: 'complete', sequenceNodeId: 'end' })
            } else {
                const nextNode = getNode(nextNodeId, customNodes)
                if (nextNode) {
                    const waitUntil = calcWaitUntil(nextNodeId, customNodes)
                    await db.updateSequenceState(task.leadId, {
                        sequenceNodeId: nextNodeId,
                        sequenceWaitUntil: waitUntil,
                        sequenceEnteredAt: new Date().toISOString(),
                        status: 'active',
                    })

                    // If the next step is immediately due, create a job and trigger the worker
                    if (nextNode.waitBeforeDays === 0) {
                        const existingJobs = await db.getSequenceJobs()
                        const alreadyQueued = existingJobs.some(
                            j => j.leadId === task.leadId && j.nodeId === nextNodeId && (j.status === 'pending' || j.status === 'processing')
                        )
                        if (!alreadyQueued) {
                            await db.saveSequenceJob({
                                id: crypto.randomUUID(),
                                leadId: task.leadId,
                                productId: task.productId,
                                nodeId: nextNodeId,
                                scheduledAt: new Date().toISOString(),
                                status: 'pending',
                                attempts: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            })

                            // Fire-and-forget the worker
                            const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
                            const host = process.env.VERCEL_URL || 'localhost:3000'
                            const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
                            fetch(`${baseUrl}/api/sequence/worker`, { method: 'POST' }).catch(() => { })
                        }
                    }
                }
            }
        }

        return withCors(NextResponse.json({ success: true, taskId, status }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
