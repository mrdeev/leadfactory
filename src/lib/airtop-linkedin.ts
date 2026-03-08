// Airtop cloud browser LinkedIn automation — direct REST API integration.
// Uses Airtop's AI-driven interactions (natural language element targeting)
// so it's resilient to LinkedIn UI changes.
//
// Uses platform-wide AIRTOP_API_KEY from env. Each product has its own
// saved profile name (e.g. "linkedin-{productId}") for session persistence.
//
// Each function: create session with profile → open window → interact → terminate.

import type { LinkedInResult } from '@/lib/linkedin-automation'

const AIRTOP_BASE = 'https://api.airtop.ai/api/v1'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getApiKey(): string {
    const key = process.env.AIRTOP_API_KEY
    if (!key) throw new Error('AIRTOP_API_KEY env var is not set')
    return key
}

async function airtopFetch(path: string, options: RequestInit = {}) {
    const apiKey = getApiKey()
    const res = await fetch(`${AIRTOP_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...options.headers,
        },
    })
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Airtop ${options.method || 'GET'} ${path} failed (${res.status}): ${body}`)
    }
    return res.json()
}

/** Send a single CDP command over WebSocket and return the result. */
async function sendCDPCommand(
    cdpWsUrl: string,
    method: string,
    params: Record<string, unknown> = {},
): Promise<unknown> {
    // Dynamic import — ws may or may not be available (Node ≥18 has global WebSocket too)
    const WS = require('ws')
    return new Promise((resolve, reject) => {
        const ws = new (WS.default || WS)(cdpWsUrl, {
            headers: { Authorization: `Bearer ${getApiKey()}` },
        })
        const id = Math.floor(Math.random() * 1e6)
        const timeout = setTimeout(() => {
            ws.close()
            reject(new Error(`CDP timeout for ${method}`))
        }, 15_000)

        ws.on('open', () => {
            ws.send(JSON.stringify({ id, method, params }))
        })
        ws.on('message', (raw: Buffer | string) => {
            const msg = JSON.parse(raw.toString())
            if (msg.id === id) {
                clearTimeout(timeout)
                ws.close()
                if (msg.error)
                    reject(new Error(`CDP ${method}: ${JSON.stringify(msg.error)}`))
                else resolve(msg.result)
            }
        })
        ws.on('error', (err: Error) => {
            clearTimeout(timeout)
            reject(err)
        })
    })
}

/** Create a new cloud browser session with a saved LinkedIn profile.
 *  If liAtCookie is provided, the cookie is injected via CDP
 *  (Storage.setCookies) BEFORE any LinkedIn page is opened. */
async function createSession(profileName: string, liAtCookie?: string, proxyCountry?: string): Promise<string> {

    // Determine proxy configuration
    let proxyConfig: boolean | { url?: string; country?: string } = true;
    if (process.env.AIRTOP_PROXY_URL) {
        proxyConfig = { url: process.env.AIRTOP_PROXY_URL };
    } else if (proxyCountry || process.env.AIRTOP_PROXY_COUNTRY) {
        proxyConfig = { country: proxyCountry || process.env.AIRTOP_PROXY_COUNTRY };
    }

    const data = await airtopFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({
            configuration: {
                persistProfile: true,
                profileName,
                proxy: proxyConfig, // Use configured proxy to bypass LinkedIn IP blocks
            },
        }),
    })
    const sessionId = data.data?.id || data.id
    const cdpWsUrl: string | undefined = data.data?.cdpWsUrl || data.cdpWsUrl
    if (!sessionId) throw new Error('Airtop session creation returned no ID')

    // Wait until the session is ready before doing anything
    await waitForSessionReady(sessionId)

    // Inject the li_at cookie via CDP BEFORE opening any LinkedIn page.
    // This ensures the very first navigation is already authenticated.
    if (liAtCookie && cdpWsUrl) {
        try {
            // First, clear any existing stale cookies that might cause a redirect loop
            await sendCDPCommand(cdpWsUrl, 'Network.clearBrowserCookies')
                .catch(() => { /* ignore */ })

            await sendCDPCommand(cdpWsUrl, 'Storage.setCookies', {
                cookies: [{
                    name: 'li_at',
                    value: liAtCookie,
                    domain: '.linkedin.com',
                    path: '/',
                    secure: true,
                }],
            })
            console.log('[airtop] Cookie injected via CDP for profile', profileName)
            // Wait for Chrome to fully register the cookie before any navigation
            await humanDelay(3000, 4000)
        } catch (err: any) {
            console.warn('[airtop] CDP cookie injection failed:', err.message)
            // Continue anyway — profile might already be authenticated
        }
    } else if (liAtCookie && !cdpWsUrl) {
        console.warn('[airtop] No CDP WebSocket URL — cannot inject cookie')
    }

    return sessionId
}

/** Poll until the session transitions out of 'initializing' state. */
async function waitForSessionReady(sessionId: string, maxMs = 60_000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < maxMs) {
        try {
            const info = await airtopFetch(`/sessions/${sessionId}`)
            const status = (info.data?.status || info.status || '').toLowerCase()
            if (['active', 'ready', 'running'].includes(status)) return
            console.log(`[airtop] Session ${sessionId} status: ${status}, waiting...`)
        } catch { }
        await sleep(2000)
    }
    throw new Error('Airtop session did not become ready in time')
}

/** Open a new browser window/tab with the given URL. */
async function openWindow(sessionId: string, url: string): Promise<string> {
    const data = await airtopFetch(`/sessions/${sessionId}/windows`, {
        method: 'POST',
        body: JSON.stringify({ url }),
    })
    const windowId = data.data?.windowId || data.windowId || data.data?.id || data.id
    if (!windowId) throw new Error('Airtop window creation returned no ID')
    return windowId
}

/** Click an element described in natural language. */
async function clickElement(sessionId: string, windowId: string, description: string): Promise<void> {
    await airtopFetch(`/sessions/${sessionId}/windows/${windowId}/click`, {
        method: 'POST',
        body: JSON.stringify({ elementDescription: description }),
    })
}

/** Type text into a focused input or an element described in natural language. */
async function typeText(sessionId: string, windowId: string, text: string, elementDescription?: string): Promise<void> {
    await airtopFetch(`/sessions/${sessionId}/windows/${windowId}/type`, {
        method: 'POST',
        body: JSON.stringify({
            text,
            ...(elementDescription ? { elementDescription } : {}),
        }),
    })
}

/** Prompt the AI to extract information from the current page. */
async function queryPage(sessionId: string, windowId: string, prompt: string): Promise<string> {
    const data = await airtopFetch(`/sessions/${sessionId}/windows/${windowId}/page-query`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    })
    return data.data?.modelResponse || data.modelResponse || ''
}

/** Terminate a browser session (fire-and-forget safe). */
async function terminateSession(sessionId: string): Promise<void> {
    await airtopFetch(`/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => { })
}

/** Wait for a specified duration (human-like pacing). */
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/** Random delay between min and max ms. */
function humanDelay(minMs = 2000, maxMs = 5000) {
    return sleep(minMs + Math.random() * (maxMs - minMs))
}

// ─── Login verification ───────────────────────────────────────────────────────



// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Visit a LinkedIn profile page (registers as a profile view).
 */
export async function airtopVisitProfile(
    profileUrl: string,
    profileName: string,
    liAtCookie?: string,
    proxyCountry?: string
): Promise<LinkedInResult> {
    if (!profileUrl) return { success: false, skipped: true, reason: 'No profile URL' }

    let sessionId: string | null = null
    try {
        sessionId = await createSession(profileName, liAtCookie, proxyCountry)

        // Open the profile page in a new window
        await openWindow(sessionId, profileUrl)
        await humanDelay(3000, 6000)
        return { success: true }
    } catch (err: any) {
        console.error('[airtop] visitProfile error:', err.message)
        return { success: false, skipped: false, reason: `Airtop: ${err.message}` }
    } finally {
        if (sessionId) await terminateSession(sessionId)
    }
}

/**
 * Send a LinkedIn connection invitation, optionally with a personalised note.
 *
 * ── FALSE-POSITIVE SAFEGUARDS ──────────────────────────────────────
 *  1. Login is verified BEFORE any action (verifyLinkedInLogin)
 *  2. Profile page load is verified — error/login/redirect → fail
 *  3. Only "Connect" button state allows the invite attempt
 *  4. After clicking Send, we run TWO verification passes
 *  5. The ONLY way to return success:true (non-skipped) is if the
 *     button definitively changed from "Connect" → "Pending"
 *  6. Weekly invite limits are explicitly detected
 *  7. Any ambiguity whatsoever → success: false
 */
export async function airtopSendInvite(
    profileUrl: string,
    profileName: string,
    noteText?: string,
    liAtCookie?: string,
    proxyCountry?: string
): Promise<LinkedInResult> {
    if (!profileUrl) return { success: false, skipped: true, reason: 'No profile URL' }
    if (!liAtCookie) return { success: false, skipped: false, reason: 'No LinkedIn cookie provided' }

    let sessionId: string | null = null
    try {
        sessionId = await createSession(profileName, liAtCookie, proxyCountry)

        // ── STEP 1: Wait for auth to settle by visiting the feed first ──────
        let windowId = await openWindow(sessionId, 'https://www.linkedin.com/feed')
        // Give LinkedIn plenty of time to resolve redirects and establish session
        await humanDelay(8000, 10000)

        // Open the target profile in a new window/tab
        windowId = await openWindow(sessionId, profileUrl)
        await humanDelay(4000, 6000)

        // ── STEP 2: Verify the profile page actually loaded ──────
        const statusQuery = await queryPage(sessionId, windowId,
            'Look at this page carefully. Answer with EXACTLY one of these:\n'
            + '- "CONNECT" if this is a LinkedIn profile page and the primary action button says Connect\n'
            + '- "PENDING" if the primary action button says Pending\n'
            + '- "MESSAGE" if the primary action button says Message\n'
            + '- "FOLLOW" if the primary action button says Follow\n'
            + '- "LOGIN" if you see a login form, authwall, or "Join LinkedIn" prompt\n'
            + '- "LIMIT" if you see a rate limit, HTTP 429, or restricted page error\n'
            + '- "ERROR" if this page shows any other error, redirect loop, or is NOT a LinkedIn profile\n'
            + 'Answer with ONLY one word.'
        )
        const status = statusQuery.trim().toUpperCase()

        if (status.includes('LOGIN')) {
            return { success: false, skipped: false, reason: 'LinkedIn is not logged in (cookie expired or invalid)' }
        }
        if (status.includes('LIMIT')) {
            return { success: false, skipped: false, reason: 'LinkedIn rate limit hit (HTTP 429 or restriction)' }
        }
        // Anything that isn't clearly a profile → fail
        if (status.includes('ERROR') || status.includes('REDIRECT') || status.includes('UNABLE') || status.includes('NOT')) {
            console.error('[airtop] Profile page load failed. Raw Airtop response:', statusQuery)
            try {
                // Take a screenshot to see what's wrong
                const screenshotQuery = await queryPage(sessionId, windowId, `Take a screenshot of the entire page to see the error.`)
                console.error('[airtop] Screenshot Query Result:', screenshotQuery)
                // Dump some HTML
                const htmlQuery = await queryPage(sessionId, windowId, `Extract and return all the text visible on the page.`)
                console.error('[airtop] Page Text:', htmlQuery)
            } catch (e) {
                console.error('[airtop] Could not capture debug info:', e)
            }
            return { success: false, skipped: false, reason: `Profile page did not load properly: ${statusQuery.substring(0, 150)}` }
        }
        if (status.includes('PENDING')) {
            return { success: true, skipped: true, reason: 'Invite already pending' }
        }
        if (status.includes('MESSAGE')) {
            return { success: true, skipped: true, reason: 'Already connected' }
        }
        if (!status.includes('CONNECT')) {
            // FOLLOW or anything else unexpected → fail, never skip to success
            return { success: false, skipped: false, reason: `Cannot send invite — unexpected button state: ${statusQuery.substring(0, 150)}` }
        }

        // ── STEP 3: Click Connect ─────────────────────────────────
        await clickElement(sessionId, windowId, 'The Connect button on the profile')
        await humanDelay(1500, 3000)

        // Check what appeared after clicking
        const afterClickState = await queryPage(sessionId, windowId,
            'What happened after clicking? Answer with EXACTLY one of:\n'
            + '- "SEND_DIALOG" if a dialog/modal appeared with a Send button (and possibly Add a note)\n'
            + '- "DROPDOWN" if a dropdown menu appeared with a Connect option\n'
            + '- "LIMIT" if you see a weekly invitation limit warning or error\n'
            + '- "NOTHING" if nothing changed\n'
            + '- "ERROR" if there is an error message\n'
            + 'Answer with ONLY one word or short phrase.'
        )
        const afterClick = afterClickState.trim().toUpperCase()

        // Detect weekly invite limit
        if (afterClick.includes('LIMIT')) {
            return { success: false, skipped: false, reason: 'LinkedIn weekly invite limit reached — cannot send more invitations this week' }
        }
        if (afterClick.includes('ERROR')) {
            return { success: false, skipped: false, reason: `Error after clicking Connect: ${afterClickState.substring(0, 150)}` }
        }

        if (afterClick.includes('DROPDOWN')) {
            await clickElement(sessionId, windowId, 'The Connect option in the dropdown menu')
            await humanDelay(1500, 2500)
        }

        if (afterClick.includes('NOTHING')) {
            // Connect button didn't respond — profile may have changed
            return { success: false, skipped: false, reason: 'Connect button did not respond to click' }
        }

        // ── STEP 4: Add note (optional) ──────────────────────────
        if (noteText) {
            const noteCheck = await queryPage(sessionId, windowId,
                'Is there an "Add a note" button visible in the current dialog? Answer ONLY "yes" or "no".'
            )
            if (noteCheck.trim().toLowerCase().startsWith('yes')) {
                await clickElement(sessionId, windowId, 'The "Add a note" button')
                await humanDelay(1000, 2000)
                await typeText(sessionId, windowId, noteText, 'The text area or input field for the invitation note')
                await humanDelay(500, 1000)
            }
        }

        // ── STEP 5: Click Send ────────────────────────────────────
        await clickElement(sessionId, windowId, 'The "Send" button to send the connection invitation')
        await humanDelay(3000, 5000)

        // ── STEP 6: VERIFY — double-check the button changed ─────
        // First verification pass
        const verify1 = await queryPage(sessionId, windowId,
            'Look at the profile page. What is the primary action button NOW? Answer with EXACTLY one word: Pending, Message, Connect, Follow, or Error.'
        )
        const v1 = verify1.trim().toUpperCase()

        // Detect post-send errors (e.g. invite limit hit during send)
        if (v1.includes('ERROR') || v1.includes('LIMIT') || v1.includes('UNABLE')) {
            return { success: false, skipped: false, reason: `Error after send: ${verify1.substring(0, 150)}` }
        }

        // If Connect button is still there → invite definitely failed
        if (v1.includes('CONNECT') && !v1.includes('PENDING')) {
            return { success: false, skipped: false, reason: 'Invite NOT sent — Connect button still visible after clicking Send' }
        }

        // If Pending → invite succeeded. Do a second check 2s later for certainty.
        if (v1.includes('PENDING')) {
            await sleep(2000)
            const verify2 = await queryPage(sessionId, windowId,
                'What is the primary action button for this profile? Answer with one word: Pending, Message, Connect, or Other.'
            )
            const v2 = verify2.trim().toUpperCase()
            if (v2.includes('PENDING')) {
                return { success: true, reason: 'Invite verified ✓ — button confirmed as Pending (double-checked)' }
            }
            if (v2.includes('MESSAGE')) {
                return { success: true, skipped: true, reason: 'Already connected (Message button)' }
            }
            // Second check disagreed — don't trust it
            console.warn('[airtop] sendInvite: first check said Pending but second check said:', verify2)
            return { success: false, skipped: false, reason: `Verification inconsistent: first=Pending, second=${verify2.substring(0, 80)}` }
        }

        if (v1.includes('MESSAGE')) {
            return { success: true, skipped: true, reason: 'Already connected (Message button)' }
        }

        // Anything else → ambiguous → fail safe. NEVER return success on ambiguity.
        console.warn('[airtop] sendInvite: ambiguous final state:', verify1)
        return { success: false, skipped: false, reason: `Invite not confirmed — ambiguous state: ${verify1.substring(0, 150)}` }
    } catch (err: any) {
        console.error('[airtop] sendInvite error:', err.message)
        return { success: false, skipped: false, reason: `Airtop: ${err.message}` }
    } finally {
        if (sessionId) await terminateSession(sessionId)
    }
}

/**
 * Check whether a previously sent connection invite has been accepted.
 */
export async function airtopCheckAcceptance(
    profileUrl: string,
    profileName: string,
    liAtCookie?: string,
    proxyCountry?: string
): Promise<{ connected: boolean; skipped?: boolean; reason?: string }> {
    if (!profileUrl) return { connected: false, skipped: true, reason: 'No profile URL' }

    let sessionId: string | null = null
    try {
        sessionId = await createSession(profileName, liAtCookie, proxyCountry)

        const windowId = await openWindow(sessionId, profileUrl)
        await humanDelay(3000, 5000)

        const result = await queryPage(sessionId, windowId,
            'On this LinkedIn profile page, what is the primary action button? If it says "Message" the person is connected. If it says "Pending" the invite is still pending. If it says "Connect" or "Follow", they are not connected. Answer with exactly one word: Connected, Pending, or NotConnected.'
        )
        const answer = result.trim().toLowerCase()

        if (answer.includes('connected') && !answer.includes('not')) {
            return { connected: true }
        }
        return { connected: false }
    } catch (err: any) {
        console.error('[airtop] checkAcceptance error:', err.message)
        return { connected: false, skipped: true, reason: `Airtop: ${err.message}` }
    } finally {
        if (sessionId) await terminateSession(sessionId)
    }
}

/**
 * Send a LinkedIn direct message (chat) to a connected contact.
 */
export async function airtopSendMessage(
    profileUrl: string,
    profileName: string,
    messageText: string,
    liAtCookie?: string,
    proxyCountry?: string
): Promise<LinkedInResult> {
    if (!profileUrl || !messageText) return { success: false, skipped: true, reason: 'Missing profile URL or message' }

    let sessionId: string | null = null
    try {
        sessionId = await createSession(profileName, liAtCookie, proxyCountry)
        // Verify login state on the profile directly
        const feedCheck = await openWindow(sessionId, 'https://www.linkedin.com/feed/')
        await sleep(5000)
        const response = await queryPage(sessionId, feedCheck, 'Am I logged in to LinkedIn? Do I see a feed? Answer exactly LOGGED_IN or NOT_LOGGED_IN or ERROR.')
        if (!response.toUpperCase().includes('LOGGED_IN')) {
            return { success: false, skipped: false, reason: 'LinkedIn is not logged in (cookie expired or invalid)' }
        }
        const windowId = await openWindow(sessionId, profileUrl)
        await humanDelay(3000, 5000)

        // Click the Message button on the profile
        await clickElement(sessionId, windowId, 'The "Message" button on the profile')
        await humanDelay(2000, 3000)

        // Type the message
        await typeText(sessionId, windowId, messageText, 'The message input box or text area in the messaging overlay')
        await humanDelay(500, 1500)

        // Send the message
        await clickElement(sessionId, windowId, 'The "Send" button to send the chat message')
        await humanDelay(2000, 3000)

        // Verify the message was sent — check if the message appears in the chat
        const verify = await queryPage(sessionId, windowId,
            'Look at the messaging overlay/chat. Did the message get sent successfully? '
            + 'Is it now visible in the conversation thread? '
            + 'Answer EXACTLY: "SENT" if the message appears in the thread, '
            + '"FAILED" if there is an error, or "UNCLEAR" if you cannot determine.'
        )
        const v = verify.trim().toUpperCase()

        if (v.includes('SENT') && !v.includes('FAILED') && !v.includes('NOT')) {
            return { success: true, reason: 'Message sent and verified in chat thread' }
        }
        if (v.includes('FAILED') || v.includes('ERROR')) {
            return { success: false, skipped: false, reason: `Message send failed: ${verify.substring(0, 150)}` }
        }

        // Ambiguous — fail safe
        console.warn('[airtop] sendMessage: ambiguous state:', verify)
        return { success: false, skipped: false, reason: `Message not confirmed: ${verify.substring(0, 150)}` }
    } catch (err: any) {
        console.error('[airtop] sendMessage error:', err.message)
        return { success: false, skipped: false, reason: `Airtop: ${err.message}` }
    } finally {
        if (sessionId) await terminateSession(sessionId)
    }
}
