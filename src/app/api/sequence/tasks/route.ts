import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sequence/tasks?productId=xxx
// Returns call tasks for a product (or all tasks).
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId') || undefined
    const tasks = db.getCallTasks(productId)
    return NextResponse.json(tasks)
}

// PATCH /api/sequence/tasks
// Body: { taskId: string, status: 'done' | 'skipped' }
// Marks a call task as done or skipped.
export async function PATCH(req: NextRequest) {
    try {
        const { taskId, status, completedAt } = await req.json()
        if (!taskId || !status) {
            return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 })
        }
        const updated = db.updateCallTask(taskId, {
            status,
            completedAt: completedAt || new Date().toISOString(),
        })
        if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        return NextResponse.json({ success: true, task: updated })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
