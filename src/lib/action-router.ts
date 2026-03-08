// ActionRouter — dispatches each sequence node type to its handler.
// All handlers return { success, skipped?, reason?, linkedinConnected? }
// The worker calls ActionRouter.execute() and uses the result to advance state.
// LinkedIn actions use Airtop cloud browser. Chat uses Apify as fallback.

import OpenAI from 'openai'
import { sendEmail } from '@/lib/email'
import { getSystemInstructions } from '@/lib/knowledge-base'
import { db, type Product } from '@/lib/db'
import { getNode, resolveNextNode } from '@/lib/sequence-graph'
import {
    getUnipileProviderId,
    getUnipileProfile,
    sendUnipileInvite,
    sendUnipileMessage,
    checkUnipileConnection
} from '@/lib/unipile'
// ─── Shared helpers ────────────────────────────────────────────────────────

function parseIndustry(val: any): string {
    if (!val) return ''
    if (Array.isArray(val)) return val.join(', ')
    return String(val).replace(/^\[|\]$/g, '').replace(/'/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
}

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
})

async function generateEmail(product: Product, contact: any, purpose: string, nodeId: string): Promise<{ subject: string; body: string }> {
    const systemInstructions = getSystemInstructions()
    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || 'there'
    const industries = parseIndustry(contact.orgIndustry)
    const focusArr: string[] = Array.isArray(contact.professional_focus) ? contact.professional_focus : []
    const insightsArr: string[] = Array.isArray(contact.insights) ? contact.insights : []
    const safeInsights = insightsArr.filter((s: string) => !/^[A-Z][a-z]+ [A-Z][a-z]+ (is|has|was|are)\b/.test(s.trim()))
    const strategy = (product as any).strategy || {}

    const ruleMap: Record<string, string> = {
        initial: `EMAIL RULES: 3-4 sentences max. One observation about them or their company → curiosity question. No pitch. No links. Sign off as: ${product.senderName || product.name}`,
        follow_up: `EMAIL RULES: 3-5 sentences. Reference first email briefly. Use a LinkedIn insight. Soft ask. No links. Sign off as: ${product.senderName || product.name}`,
        value_add: `EMAIL RULES: 4-6 sentences. Share genuinely useful info. Tie to your work naturally. Soft question. Sign off as: ${product.senderName || product.name}`,
        breakup: `EMAIL RULES: 1-2 sentences. Acknowledge multiple attempts. Leave door open. Zero pressure. Sign off as: ${product.senderName || product.name}`,
    }
    const rules = ruleMap[purpose] || ruleMap.follow_up

    const prompt = `PRODUCT: ${product.name} — ${product.description}
Target: ${product.targetCustomers || strategy.targetAudience || ''}
Value: ${(product as any).valueProp || strategy.keyValueMessages || ''}

PROSPECT:
- Name: ${contact.fullName} (use: ${firstName})
- Title: ${contact.position || 'N/A'}
- Company: ${contact.orgName || 'N/A'}
- Industry: ${industries || 'N/A'}
- Company size: ${contact.orgSize ? `${contact.orgSize} employees` : 'N/A'}
${focusArr.length ? `\nTHEIR INTERESTS:\n${focusArr.map((f: string) => `- ${f}`).join('\n')}` : ''}
${safeInsights.length ? `\nLINKEDIN TOPICS:\n${safeInsights.slice(0, 3).map((s: string) => `- ${s}`).join('\n')}` : ''}

${rules}

Return ONLY valid JSON: {"subject":"...","body":"..."}`

    const baseInstruction = `You are an expert B2B cold email writer. Return ONLY valid JSON with "subject" and "body" fields. No markdown, no code fences.`
    const systemPrompt = systemInstructions ? `${baseInstruction}\n\n${systemInstructions}` : baseInstruction

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.75,
    })

    const raw = response.choices[0]?.message?.content || '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    try {
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
        return { subject: parsed.subject || `${product.name} — follow-up`, body: parsed.body || raw }
    } catch {
        return { subject: `${product.name} — follow-up for ${firstName}`, body: raw }
    }
}

// ─── ExecuteResult ─────────────────────────────────────────────────────────
export interface ExecuteResult {
    success: boolean
    skipped?: boolean
    reason?: string
    // For condition node — needed to resolve next branch
    linkedinConnected?: boolean
}

// ─── ActionRouter ──────────────────────────────────────────────────────────
export const ActionRouter = {
    async execute(nodeId: string, leadId: string, productId: string): Promise<ExecuteResult> {
        const product = await db.getProduct(productId)
        if (!product) return { success: false, reason: `Product not found: ${productId}` }

        const customNodes = product.campaignSequence?.nodes
        const node = getNode(nodeId, customNodes)
        if (!node) return { success: false, reason: `Unknown node: ${nodeId}` }

        const contact = await db.getContact(leadId)
        if (!contact) return { success: false, reason: `Contact not found: ${leadId}` }

        try {
            switch (node.type) {

                // ── EMAIL ──────────────────────────────────────────────
                case 'email': {
                    const purposeMap: Record<string, string> = {
                        email1: 'initial', email_yes: 'follow_up',
                        email_no1: 'follow_up', email_no2: 'value_add', email_no3: 'breakup',
                    }
                    const purpose = purposeMap[nodeId] || 'follow_up'

                    let subject: string
                    let body: string
                    const draft = contact.generatedEmails?.[nodeId]
                    if (draft?.subject && draft?.body) {
                        subject = draft.subject
                        body = draft.body
                    } else {
                        const result = await generateEmail(product, contact, purpose, nodeId)
                        subject = result.subject
                        body = result.body
                    }

                    const senderEmail = product.senderEmail || ''

                    await sendEmail({
                        to: contact.email,
                        from: `${product.senderName || product.name} <${senderEmail}>`,
                        subject, text: body,
                        provider: product.sendingMethod || 'platform',
                        sesConfig: product.sesConfig, sendgridConfig: product.sendgridConfig,
                        mailgunConfig: product.mailgunConfig,
                        smtpConfig: product.smtpConfig ? { host: product.smtpConfig.host, port: product.smtpConfig.port, user: product.smtpConfig.username, pass: product.smtpConfig.password || '' } : undefined,
                        replyTo: product.replyToEmail,
                    })

                    await db.updateContact(leadId, { generatedEmail: body, generatedSubject: subject, status: 'active', sequenceNodeId: nodeId })
                    await db.logMessage(productId, contact, senderEmail, subject, body, nodeId)
                    await db.logActivity(productId, nodeId, leadId, 'sent', `Email sent to ${contact.fullName}`)
                    return { success: true }
                }

                // ── LINKEDIN VISIT ─────────────────────────────────────
                case 'linkedin_visit': {
                    if (!contact.linkedinUrl) {
                        await db.logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')
                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }
                    }

                    if (!product.unipileAccountId) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', 'No Unipile account connected')
                        return { success: false, reason: 'No Unipile account connected' }
                    }

                    try {
                        const providerId = await getUnipileProviderId(contact.linkedinUrl, product.unipileAccountId)
                        await getUnipileProfile(providerId, product.unipileAccountId)
                        await db.updateContact(leadId, { linkedinVisitedAt: new Date().toISOString(), sequenceNodeId: nodeId })
                        await db.logActivity(productId, nodeId, leadId, 'done', `Visited ${contact.fullName}'s profile via Unipile API`)
                        return { success: true }
                    } catch (err: any) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', `[Unipile] ${err.message}`)
                        return { success: false, reason: err.message }
                    }
                }

                // ── LINKEDIN INVITE ────────────────────────────────────
                case 'linkedin_invite': {
                    if (!contact.linkedinUrl) {
                        await db.logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')
                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }
                    }

                    if (!product.unipileAccountId) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', 'No Unipile account connected')
                        return { success: false, reason: 'No Unipile account connected' }
                    }

                    // Generate personalized invite note
                    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || ''
                    const parts: string[] = []
                    if (firstName) parts.push(`Hi ${firstName},`)
                    if (contact.orgName) {
                        parts.push(`I came across your profile${contact.title ? ` — your work as ${contact.title}` : ''} at ${contact.orgName} caught my attention.`)
                    } else {
                        parts.push(`I came across your profile and would love to connect.`)
                    }
                    parts.push(`Looking forward to connecting!`)
                    const inviteNote = parts.join(' ')

                    try {
                        const providerId = await getUnipileProviderId(contact.linkedinUrl, product.unipileAccountId)
                        await sendUnipileInvite(providerId, product.unipileAccountId, inviteNote)
                        await db.updateContact(leadId, { linkedinInviteSentAt: new Date().toISOString(), sequenceNodeId: nodeId })
                        await db.logActivity(productId, nodeId, leadId, 'done', `Sent invite to ${contact.fullName} via Unipile API`)
                        return { success: true }
                    } catch (err: any) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', `[Unipile] ${err.message}`)
                        return { success: false, reason: err.message }
                    }
                }

                // ── CONDITION (check LinkedIn acceptance) ──────────────
                case 'condition': {
                    if (!contact.linkedinUrl) {
                        // If no URL, we assume not connected to safely proceed down the 'NO' branch
                        return { success: true, linkedinConnected: false, reason: 'No LinkedIn URL — defaulting to not connected' }
                    }

                    if (!product.unipileAccountId) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', 'No Unipile account connected')
                        return { success: true, linkedinConnected: false, reason: 'No Unipile account connected' }
                    }

                    try {
                        const providerId = await getUnipileProviderId(contact.linkedinUrl, product.unipileAccountId)
                        const connected = await checkUnipileConnection(providerId, product.unipileAccountId)
                        await db.updateContact(leadId, { linkedinConnected: connected, linkedinConnectionCheckedAt: new Date().toISOString() })
                        await db.logActivity(productId, nodeId, leadId, 'done', `Connection check for ${contact.fullName}: ${connected ? 'ACCEPTED (YES)' : 'PENDING (NO)'}`)
                        return { success: true, linkedinConnected: connected }
                    } catch (err: any) {
                        await db.logActivity(productId, nodeId, leadId, 'skipped', `[Unipile] Connection check failed: ${err.message}. Assuming pending.`)
                        return { success: true, linkedinConnected: false, reason: err.message }
                    }
                }

                // ── LINKEDIN CHAT ──────────────────────────────────────
                case 'linkedin_chat': {
                    if (!contact.linkedinUrl) {
                        await db.logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')
                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }
                    }

                    if (!product.unipileAccountId) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', 'No Unipile account connected')
                        return { success: false, reason: 'No Unipile account connected' }
                    }

                    const chatFirstName = contact.firstName || contact.fullName?.split(' ')[0] || 'there'
                    const chatMsg = nodeId === 'chat_yes1'
                        ? `Hi ${chatFirstName}, thanks for connecting! I noticed your work at ${contact.orgName || 'your company'} and wanted to reach out personally. Would love to hear more about what you're working on.`
                        : `Hi ${chatFirstName}, just following up on my previous message. Still keen to connect if the timing is right — no pressure at all.`

                    try {
                        const providerId = await getUnipileProviderId(contact.linkedinUrl, product.unipileAccountId)
                        await sendUnipileMessage(providerId, product.unipileAccountId, chatMsg)
                        await db.updateContact(leadId, { linkedinChatSentAt: new Date().toISOString(), sequenceNodeId: nodeId })
                        await db.logActivity(productId, nodeId, leadId, 'done', `Sent message to ${contact.fullName} via Unipile API`)
                        return { success: true }
                    } catch (err: any) {
                        await db.logActivity(productId, nodeId, leadId, 'failed', `[Unipile] ${err.message}`)
                        return { success: false, reason: err.message }
                    }
                }

                // ── END ────────────────────────────────────────────────
                case 'end': {
                    await db.updateContact(leadId, { campaignComplete: true, sequenceNodeId: 'end' })
                    await db.logActivity(productId, nodeId, leadId, 'complete', `Sequence complete for ${contact.fullName}`)
                    return { success: true }
                }

                default:
                    return { success: false, reason: `No handler for node type: ${node.type}` }
            }
        } catch (err: any) {
            console.error(`[action-router] execute ${nodeId} for ${leadId}:`, err.message)
            await db.logActivity(productId, nodeId, leadId, 'error', err.message)
            return { success: false, reason: err.message }
        }
    }
}
