import { NextRequest, NextResponse } from 'next/server'
import { db, SequenceJob } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/cron/sequence-runner
// Called hourly by Vercel Cron.
// Responsibilities:
//   1. Find all lead states where sequenceWaitUntil <= now (DB-native query)
//   2. Write one pending job per due lead into sequence_jobs table
//   3. Fire-and-forget a POST to /api/sequence/worker
//   4. Return immediately — NO sequence execution here
export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // DB-native query: only fetch active states that are due
    const { data: dueStates, error: statesErr } = await supabaseAdmin
        .from('sequence_states')
        .select('*')
        .eq('status', 'active')
        .lte('sequence_wait_until', now.toISOString())

    if (statesErr) {
        console.error('[cron] Failed to query due states:', statesErr.message)
        return NextResponse.json({ error: statesErr.message }, { status: 500 })
    }

    // Get active jobs to filter out leads with existing pending/processing jobs
    const { data: activeJobs } = await supabaseAdmin
        .from('sequence_jobs')
        .select('lead_id, node_id')
        .in('status', ['pending', 'processing'])

    const activeJobLeads = new Set(
        (activeJobs || []).map((j: any) => j.lead_id)
    )

    // Filter out leads that already have active jobs
    const due = (dueStates || []).filter(
        (s: any) => !activeJobLeads.has(s.lead_id)
    )

    // Purge old done/failed jobs (older than 30 days) to prevent table bloat
    await db.purgeOldJobs(30)

    // Enqueue one job per due lead
    let enqueued = 0
    for (const state of due) {
        const job: SequenceJob = {
            id: crypto.randomUUID(),
            leadId: state.lead_id,
            productId: state.product_id,
            nodeId: state.sequence_node_id,
            scheduledAt: state.sequence_wait_until,
            status: 'pending',
            attempts: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        }
        await db.saveSequenceJob(job)
        enqueued++
    }

    // Fire-and-forget the worker (do NOT await — cron must return immediately)
    if (enqueued > 0) {
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
        const host = process.env.VERCEL_URL || 'localhost:3000'
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

        fetch(`${baseUrl}/api/sequence/worker`, { method: 'POST' }).catch(() => { })
    }

    return NextResponse.json({ enqueued, checkedAt: now.toISOString() })
}
