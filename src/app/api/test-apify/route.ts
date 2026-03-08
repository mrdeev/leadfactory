import { NextResponse } from 'next/server'
import { sendLinkedInInvite } from '@/lib/linkedin-automation'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const p = await db.getProduct('ai-rankrs-nyvuw')
        const cookie = p?.linkedinCookie
        if (!cookie) return NextResponse.json({ error: 'No cookie' })

        // The function signature is (linkedinUrl: string, liAtCookie: string, message?: string)
        const result = await sendLinkedInInvite(
            'https://www.linkedin.com/in/merwane-kehy/?originalSubdomain=fr',
            cookie,
            'Hi Merwane, testing Apify sequence fallback.'
        )
        return NextResponse.json({ result })
    } catch (err: any) {
        return NextResponse.json({ error: err.message })
    }
}
