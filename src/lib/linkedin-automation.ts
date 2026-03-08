// LinkedIn automation layer — two modes:
// 1. EXTENSION MODE (preferred): creates tasks in Supabase (extension_tasks table)
//    for the Chrome extension to execute using the user's real browser session.
// 2. APIFY FALLBACK: original server-side actors using the li_at cookie.
//
// The action-router selects the mode based on product.extensionConnected.

import { ApifyClient } from 'apify-client'
import { db } from '@/lib/db'

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

// ─── Extension task helpers ───────────────────────────────────────────────────

export interface ExtensionTaskPayload {
    type: 'visit' | 'invite' | 'message' | 'check_acceptance'
    productId: string
    nodeId: string
    leadId: string
    contactName?: string
    profileUrl: string
    messageText?: string
    noteText?: string
}

// Creates a pending task for the Chrome extension to pick up and execute.
// Returns a task-like result so the action-router can continue.
export async function createExtensionTask(payload: ExtensionTaskPayload): Promise<LinkedInResult> {
    const task = await db.createExtensionTask(payload)
    console.log(`[linkedin-extension] Queued ${payload.type} task for ${payload.contactName || payload.leadId}`)
    return { success: true, extensionTask: true, taskId: task?.id }
}

export async function getPendingExtensionTask(leadId: string, nodeId: string): Promise<any | null> {
    return db.getPendingExtensionTask(leadId, nodeId)
}

export async function deleteExtensionTask(taskId: string) {
    await db.deleteExtensionTask(taskId)
}

export interface LinkedInResult {
    success: boolean
    skipped?: boolean
    reason?: string
    data?: any
    extensionTask?: boolean
    taskId?: string
}

// ─── Visit a LinkedIn profile ──────────────────────────────────────────────
// Visiting a profile is a side-effect of scraping it with a session cookie.
// Actor: apify/linkedin-profile-scraper (free, widely available)
export async function visitLinkedInProfile(
    profileUrl: string,
    liAtCookie: string
): Promise<LinkedInResult> {
    if (!profileUrl || !liAtCookie) {
        return { success: false, skipped: true, reason: 'Missing profileUrl or li_at cookie' }
    }
    try {
        const run = await apify.actor('apify/linkedin-profile-scraper').call({
            startUrls: [{ url: profileUrl }],
            // Pass the session cookie so the visit registers on LinkedIn
            sessionCookies: [{ name: 'li_at', value: liAtCookie, domain: '.linkedin.com', path: '/' }],
        }, { waitSecs: 120 })

        const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit: 1 })
        return { success: true, data: items[0] ?? null }
    } catch (err: any) {
        console.error('[linkedin] visitProfile error:', err.message)
        return { success: false, skipped: true, reason: err.message }
    }
}

// ─── Send a connection invitation ─────────────────────────────────────────
// Uses a marketplace actor that accepts a session cookie + profile URL.
export async function sendLinkedInInvite(
    profileUrl: string,
    liAtCookie: string,
    noteText?: string
): Promise<LinkedInResult> {
    if (!profileUrl || !liAtCookie) {
        return { success: false, skipped: true, reason: 'Missing profileUrl or li_at cookie' }
    }
    try {
        // Using curious_coder/linkedin-inviter as it is standard, but adding better error checks
        const run = await apify.actor('curious_coder/linkedin-inviter').call({
            profileUrls: [profileUrl],
            message: noteText || '',
            sessionCookies: [{ name: 'li_at', value: liAtCookie, domain: '.linkedin.com', path: '/' }],
        }, { waitSecs: 180 })

        const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit: 1 })
        const result = items[0] as any

        if (!result) {
            return { success: false, skipped: true, reason: 'No result from LinkedIn inviter actor' }
        }

        const sent = result.status === 'sent' || result.success === true || result.status === 'already_sent'
        return {
            success: sent,
            data: result,
            skipped: !sent,
            reason: sent ? undefined : (result.error || result.message || 'Invite not sent')
        }
    } catch (err: any) {
        console.error('[linkedin] sendInvite error:', err.message)
        let reason = err.message
        if (reason.includes('Actor with this name was not found')) {
            reason = 'Apify Actor "curious_coder/linkedin-inviter" not found or access denied.'
        }
        return { success: false, skipped: true, reason }
    }
}

// ─── Check if a connection request was accepted ────────────────────────────
// Scrapes the user's sent-invitations page and looks for the profile URL.
// Returns { connected: true } if the invite is no longer in "pending" state.
export async function checkLinkedInAcceptance(
    profileUrl: string,
    liAtCookie: string
): Promise<{ connected: boolean; skipped?: boolean; reason?: string }> {
    if (!profileUrl || !liAtCookie) {
        return { connected: false, skipped: true, reason: 'Missing profileUrl or li_at cookie' }
    }
    try {
        // Scrape the invitation manager "sent" page
        const run = await apify.actor('apify/web-scraper').call({
            startUrls: [{ url: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/' }],
            sessionCookies: [{ name: 'li_at', value: liAtCookie, domain: '.linkedin.com', path: '/' }],
            pageFunction: `async function pageFunction(context) {
                const { $, request } = context;
                const cards = [];
                $('.invitation-card').each((i, el) => {
                    cards.push({
                        name: $(el).find('.invitation-card__title').text().trim(),
                        url: $(el).find('a.invitation-card__picture-link').attr('href') || '',
                    });
                });
                return cards;
            }`,
            maxPagesPerCrawl: 1,
        }, { waitSecs: 90 })

        const { items } = await apify.dataset(run.defaultDatasetId).listItems()
        // Flatten all results
        const pending: string[] = (items as any[]).flatMap((page: any) =>
            Array.isArray(page) ? page.map((c: any) => c.url) : []
        )

        // Normalise URLs for comparison
        const norm = (u: string) => u.toLowerCase().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '').split('?')[0]
        const profileNorm = norm(profileUrl)
        const isStillPending = pending.some(u => norm(u) === profileNorm)

        // If NOT in pending list → either accepted or profile doesn't exist
        return { connected: !isStillPending }
    } catch (err: any) {
        console.error('[linkedin] checkAcceptance error:', err.message)
        return { connected: false, skipped: true, reason: err.message }
    }
}

// ─── Send a LinkedIn chat message ─────────────────────────────────────────
export async function sendLinkedInMessage(
    profileUrl: string,
    liAtCookie: string,
    messageText: string
): Promise<LinkedInResult> {
    if (!profileUrl || !liAtCookie || !messageText) {
        return { success: false, skipped: true, reason: 'Missing profileUrl, li_at cookie, or messageText' }
    }
    try {
        const run = await apify.actor('curious_coder/linkedin-message-sender').call({
            profileUrls: [profileUrl],
            message: messageText,
            sessionCookies: [{ name: 'li_at', value: liAtCookie, domain: '.linkedin.com', path: '/' }],
        }, { waitSecs: 120 })

        const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit: 1 })
        const result = items[0] as any
        const sent = result?.status === 'sent' || result?.success === true
        return { success: sent, data: result, skipped: !sent, reason: sent ? undefined : (result?.error || 'Message not sent') }
    } catch (err: any) {
        console.error('[linkedin] sendMessage error:', err.message)
        return { success: false, skipped: true, reason: err.message }
    }
}

// ─── Verify a li_at cookie is still valid ─────────────────────────────────
export async function verifyLinkedInCookie(liAtCookie: string): Promise<boolean> {
    if (!liAtCookie) return false
    try {
        const run = await apify.actor('apify/web-scraper').call({
            startUrls: [{ url: 'https://www.linkedin.com/feed/' }],
            sessionCookies: [{ name: 'li_at', value: liAtCookie, domain: '.linkedin.com', path: '/' }],
            pageFunction: `async function pageFunction(context) {
                return { loggedIn: !context.request.loadedUrl.includes('/login') }
            }`,
            maxPagesPerCrawl: 1,
        }, { waitSecs: 60 })

        const { items } = await apify.dataset(run.defaultDatasetId).listItems({ limit: 1 })
        return (items[0] as any)?.loggedIn === true
    } catch {
        return false
    }
}
