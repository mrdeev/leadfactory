import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const maxDuration = 300  // 5 minutes for SSE connection
export const dynamic = 'force-dynamic'

// GET /api/extension/subscribe?token=xxx&productId=xxx
// Server-Sent Events endpoint — pushes new pending tasks to the Chrome extension
// in real time via Supabase Realtime, replacing the polling model.
export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const productId = url.searchParams.get('productId')

    if (!token || !productId) {
        return new Response('Missing token or productId', { status: 400 })
    }

    // Auth check
    const product = await db.getProduct(productId)
    if (!product) {
        return new Response('Product not found', { status: 404 })
    }
    if ((product as any).extensionToken !== token) {
        return new Response('Invalid token', { status: 401 })
    }

    // Update heartbeat
    await db.updateProduct(productId, {
        extensionConnected: true,
        extensionLastSeenAt: new Date().toISOString(),
    })

    // Set up SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        start(controller) {
            // Send initial keep-alive
            controller.enqueue(encoder.encode(`retry: 10000\n\n`))

            // Send all currently pending tasks as the initial batch
            db.getExtensionTasks(productId).then(allTasks => {
                const pending = allTasks
                    .filter((t: any) => t.status === 'pending')
                    .sort((a: any, b: any) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    )

                if (pending.length > 0) {
                    const payload = JSON.stringify({ type: 'initial', tasks: pending })
                    controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
                }
            })

            // Subscribe to Realtime changes on extension_tasks for this product
            const channel = supabaseAdmin
                .channel(`ext-tasks-${productId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'extension_tasks',
                        filter: `product_id=eq.${productId}`,
                    },
                    (payload) => {
                        const row = payload.new as any
                        if (row.status !== 'pending') return

                        const task = {
                            id: row.id,
                            type: row.type,
                            productId: row.product_id,
                            nodeId: row.node_id,
                            leadId: row.lead_id,
                            contactName: row.contact_name,
                            profileUrl: row.profile_url,
                            messageText: row.message_text,
                            noteText: row.note_text,
                            status: row.status,
                            createdAt: row.created_at,
                        }

                        try {
                            const data = JSON.stringify({ type: 'new_task', task })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        } catch {
                            // Stream closed — clean up
                            channel.unsubscribe()
                        }
                    }
                )
                .subscribe()

            // Heartbeat every 30s to keep connection alive
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`))

                    // Update extension last seen
                    db.updateProduct(productId, {
                        extensionConnected: true,
                        extensionLastSeenAt: new Date().toISOString(),
                    }).catch(() => { })
                } catch {
                    clearInterval(heartbeat)
                    channel.unsubscribe()
                }
            }, 30_000)

            // Clean up on close
            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeat)
                channel.unsubscribe()
                try { controller.close() } catch { }
            })
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': '*',
        },
    })
}
