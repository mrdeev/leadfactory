#!/usr/bin/env node
/**
 * migrate-json-to-supabase.mjs
 * One-shot migration: reads local JSON data files and upserts into Supabase.
 *
 * Usage:
 *   node scripts/migrate-json-to-supabase.mjs
 *
 * Uses the same @supabase/supabase-js client as the app for RLS compat.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or
 * SUPABASE_SERVICE_ROLE_KEY) in .env.local.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA = resolve(ROOT, 'src/data')

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
    const envPath = resolve(ROOT, '.env.local')
    if (!existsSync(envPath)) {
        console.error('❌ .env.local not found at', envPath)
        process.exit(1)
    }
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim()
        if (!process.env[key]) process.env[key] = val
    }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Read JSON safely ─────────────────────────────────────────────────────────
function readJson(filename) {
    const path = resolve(DATA, filename)
    if (!existsSync(path)) return null
    const raw = readFileSync(path, 'utf-8').trim()
    if (!raw || raw === '[]' || raw === '{}') return []
    return JSON.parse(raw)
}

// ── UUID validation ──────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(val) {
    return typeof val === 'string' && UUID_RE.test(val)
}

// ── Mapping functions ────────────────────────────────────────────────────────

function mapProduct(p) {
    return {
        id: p.id,
        name: p.name || '',
        description: p.description || '',
        website: p.website || p.websiteUrl || null,
        industry: p.industry || null,
        ceo_name: p.ceoName || null,
        ceo_email: p.ceoEmail || null,
        target_audience: p.targetAudience || null,
        target_customers: p.targetCustomers || null,
        pain_points: p.painPoints || null,
        value_prop: p.valueProp || null,
        company_size: p.companySize || null,
        timezone: p.timezone || null,
        pipeline_template: p.pipelineTemplate || null,
        funnel_type: p.funnelType || null,
        save_manual_strategy: p.saveManualStrategy ?? null,
        approval_required: p.approvalRequired ?? null,
        campaign_status: p.campaignStatus || null,
        sending_method: p.sendingMethod || 'platform',
        sender_name: p.senderName || '',
        sender_email: p.senderEmail || '',
        reply_to_email: p.replyToEmail || null,
        smtp_config: p.smtpConfig || null,
        sendgrid_config: p.sendgridConfig || null,
        mailgun_config: p.mailgunConfig || null,
        ses_config: p.sesConfig || null,
        email_verification: p.emailVerification || null,
        domain_auth: p.domainAuth || null,
        calendar_config: p.calendarConfig || null,
        strategy: p.strategy || null,
        campaign_sequence: p.campaignSequence || null,
        linkedin_cookie: p.linkedinCookie || null,
        linkedin_connected: p.linkedinConnected ?? null,
        linkedin_account_name: p.linkedinAccountName || null,
        extension_token: p.extensionToken || null,
        extension_connected: p.extensionConnected ?? null,
        extension_last_seen_at: p.extensionLastSeenAt || null,
        airtop_api_key: p.airtopApiKey || null,
        airtop_profile_id: p.airtopProfileId || null,
        created_at: p.createdAt || new Date().toISOString(),
    }
}

function mapContact(c) {
    return {
        id: c.id,
        product_id: c.productId || null,
        full_name: c.fullName || null,
        first_name: c.firstName || null,
        last_name: c.lastName || null,
        email: c.email || null,
        phone: c.phone || null,
        linkedin_url: c.linkedinUrl || null,
        position: c.position || null,
        seniority: c.seniority || null,
        city: c.city || null,
        state: c.state || null,
        country: c.country || null,
        functional: c.functional || null,
        org_name: c.orgName || null,
        org_description: c.orgDescription || null,
        org_city: c.orgCity || null,
        org_state: c.orgState || null,
        org_country: c.orgCountry || null,
        org_industry: c.orgIndustry || null,
        org_linkedin_url: c.orgLinkedinUrl || null,
        org_website: c.orgWebsite || null,
        org_size: c.orgSize || null,
        org_founded_year: c.orgFoundedYear || null,
        insights: c.insights || null,
        professional_focus: c.professional_focus || null,
        ppe_index: c.ppeIndex ?? null,
        ppe_batch_index: c.ppeBatchIndex ?? null,
        generated_email: c.generatedEmail || null,
        generated_subject: c.generatedSubject || null,
        generated_emails: c.generatedEmails || null,
        draft_generated_at: c.draftGeneratedAt || null,
        last_personalized_at: c.lastPersonalizedAt || null,
        status: c.status || null,
        campaign_step: c.campaignStep ?? null,
        campaign_step_at: c.campaignStepAt || null,
        next_email_at: c.nextEmailAt || null,
        launched_at: c.launchedAt || null,
        campaign_complete: c.campaignComplete ?? null,
        sequence_node_id: c.sequenceNodeId || null,
        linkedin_visited_at: c.linkedinVisitedAt || null,
        linkedin_invite_sent_at: c.linkedinInviteSentAt || null,
        linkedin_chat_sent_at: c.linkedinChatSentAt || null,
        linkedin_connected: c.linkedinConnected ?? null,
        linkedin_connection_checked_at: c.linkedinConnectionCheckedAt || null,
        unsubscribed: c.unsubscribed ?? null,
        unsubscribed_at: c.unsubscribedAt || null,
        saved_at: c.savedAt || null,
        created_at: c.createdAt || c.savedAt || new Date().toISOString(),
        updated_at: c.updatedAt || null,
    }
}

function mapMessage(m) {
    return {
        id: m.id,
        product_id: m.productId || null,
        contact_id: m.contactId || null,
        contact_name: m.contactName || null,
        email: m.email || null,
        from: m.from || null,
        subject: m.subject || null,
        body: m.body || null,
        snippet: m.snippet || null,
        status: m.status || 'Sent',
        channel: m.channel || 'Email',
        direction: m.direction || 'outgoing',
        sequence_node_id: m.sequenceNodeId || null,
        campaign_step: m.campaignStep ?? null,
        date: m.date || null,
        time: m.time || null,
        created_at: m.timestamp || m.createdAt || new Date().toISOString(),
    }
}

function mapActivity(a) {
    return {
        product_id: a.productId,
        node_id: a.nodeId || null,
        lead_id: a.leadId || null,
        status: a.status || null,
        details: a.details || null,
        created_at: a.timestamp || a.createdAt || new Date().toISOString(),
    }
}

function mapExtensionTask(t) {
    return {
        id: t.id,
        product_id: t.productId || null,
        lead_id: t.leadId || null,
        node_id: t.nodeId || null,
        type: t.type || null,
        contact_name: t.contactName || null,
        profile_url: t.profileUrl || null,
        message_text: t.messageText || null,
        note_text: t.noteText || null,
        status: t.status || 'pending',
        result_data: t.resultData || null,
        completed_at: t.completedAt || null,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || null,
    }
}

function mapSequenceState(s) {
    return {
        id: s.id,
        lead_id: s.leadId,
        product_id: s.productId,
        sequence_node_id: s.sequenceNodeId,
        sequence_entered_at: s.sequenceEnteredAt,
        sequence_wait_until: s.sequenceWaitUntil,
        status: s.status,
        updated_at: s.updatedAt || null,
    }
}

function mapSequenceJob(j) {
    return {
        id: j.id,
        lead_id: j.leadId,
        product_id: j.productId,
        node_id: j.nodeId,
        scheduled_at: j.scheduledAt,
        status: j.status,
        attempts: j.attempts ?? 0,
        error: j.error || null,
        created_at: j.createdAt || new Date().toISOString(),
        updated_at: j.updatedAt || null,
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🚀 Starting JSON → Supabase migration')
    console.log(`   URL: ${SUPABASE_URL}`)
    console.log(`   Auth: ${isServiceRole ? 'Service Role Key ✅' : 'Anon Key (may hit RLS)'}`)
    console.log()

    const migrations = [
        {
            name: 'products',
            file: 'db.json',
            table: 'products',
            extract: (data) => data.products || data,
            map: mapProduct,
            idField: 'id',
            idType: 'text', // products use text IDs like "topsalesagent"
        },
        {
            name: 'contacts',
            file: 'contacts.json',
            table: 'contacts',
            extract: (data) => data,
            map: mapContact,
            idField: 'id',
            idType: 'uuid',
        },
        {
            name: 'messages',
            file: 'messages.json',
            table: 'messages',
            extract: (data) => data,
            map: mapMessage,
            idField: 'id',
            idType: 'uuid',
        },
        {
            name: 'campaign_activity',
            file: 'campaign_activity.json',
            table: 'campaign_activity',
            extract: (data) => data,
            map: mapActivity,
            idField: null, // auto-generated
            idType: null,
        },
        {
            name: 'extension_tasks',
            file: 'extension_tasks.json',
            table: 'extension_tasks',
            extract: (data) => data,
            map: mapExtensionTask,
            idField: 'id',
            idType: 'uuid',
        },
        {
            name: 'sequence_states',
            file: 'sequence_states.json',
            table: 'sequence_states',
            extract: (data) => data,
            map: mapSequenceState,
            idField: 'id',
            idType: 'uuid',
        },
        {
            name: 'sequence_jobs',
            file: 'sequence_jobs.json',
            table: 'sequence_jobs',
            extract: (data) => data,
            map: mapSequenceJob,
            idField: 'id',
            idType: 'uuid',
        },
    ]

    let allOk = true

    for (const m of migrations) {
        const raw = readJson(m.file)
        if (raw === null) {
            console.log(`⏭️  ${m.name}: file not found, skipping`)
            continue
        }

        let records = m.extract(raw)
        if (!records || !records.length) {
            console.log(`⏭️  ${m.name}: 0 records, skipping`)
            continue
        }

        // Filter out records with invalid UUIDs where UUID is expected
        if (m.idType === 'uuid') {
            const before = records.length
            records = records.filter(r => {
                const id = r.id || r[m.idField]
                return id && isUUID(id)
            })
            const skipped = before - records.length
            if (skipped > 0) {
                console.log(`⚠️  ${m.name}: skipped ${skipped} records with non-UUID ids`)
            }
        }

        if (!records.length) {
            console.log(`⏭️  ${m.name}: 0 valid records after filtering, skipping`)
            continue
        }

        const rows = records.map(m.map)
        console.log(`📦 ${m.name}: ${rows.length} records → ${m.table}`)

        // Row-by-row upsert to skip FK violations gracefully
        let ok = 0, skipped = 0
        for (const row of rows) {
            let result
            if (m.idField) {
                result = await supabase
                    .from(m.table)
                    .upsert(row, { onConflict: m.idField })
            } else {
                result = await supabase
                    .from(m.table)
                    .insert(row)
            }
            if (result.error) {
                skipped++
                // Only log non-duplicate errors on first occurrence
                if (skipped <= 3) {
                    console.log(`   ⚠️  Skip: ${result.error.message}`)
                }
            } else {
                ok++
            }
        }
        if (skipped > 3) {
            console.log(`   ... and ${skipped - 3} more skipped`)
        }
        console.log(`   → ${ok} ✅ inserted, ${skipped} ⚠️ skipped`)
        if (skipped > 0) allOk = false
    }

    console.log()
    if (allOk) {
        console.log('✅ Migration complete — all tables populated successfully!')
    } else {
        console.log('⚠️  Migration completed — some rows skipped (FK violations or duplicates)')
        console.log('💡 This is normal for test data with invalid references.')
    }
}

main().catch(err => {
    console.error('💥 Migration failed:', err)
    process.exit(1)
})
