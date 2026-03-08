import { supabaseAdmin } from './supabase-admin'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SMTPConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
}

export interface SendGridConfig {
    apiKey: string;
}

export interface MailgunConfig {
    apiKey: string;
    domain: string;
    region?: 'us' | 'eu';
}

export interface SESConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

export interface DomainAuth {
    domain: string;
    status: 'pending' | 'verified' | 'failed';
    dkimRecords: Array<{
        name: string;
        type: string;
        value: string;
    }>;
    instructions?: string;
    lastCheckedAt: string;
}

export interface CalendarConfig {
    googleTokens?: {
        access_token: string;
        refresh_token?: string;
        expiry_date: number;
        token_type: string;
        scope: string;
    };
    connected: boolean;
}

export interface EmailSettings {
    sendingMethod: 'platform' | 'ses' | 'sendgrid' | 'mailgun' | 'smtp';
    senderName: string;
    senderEmail: string;
    replyToEmail?: string;
    smtpConfig?: SMTPConfig;
    sendgridConfig?: SendGridConfig;
    mailgunConfig?: MailgunConfig;
    sesConfig?: SESConfig;
    emailVerification?: {
        email: string;
        status: 'unverified' | 'pending' | 'verified';
        verificationToken?: string;
        verificationExpires?: string;
        verifiedAt?: string;
    };
    domainAuth?: DomainAuth;
    calendarConfig?: CalendarConfig;
}

export interface CampaignEmailStep {
    step: number;
    subjectApproach: string;
    keyMessages: string[];
    cta: string;
    tone: string;
    delayDays: number;
    purpose: 'initial' | 'follow_up' | 'value_add' | 'breakup';
}

export type SequenceNodeType =
    | 'email'
    | 'linkedin_visit'
    | 'linkedin_invite'
    | 'condition'
    | 'linkedin_chat'
    | 'end'

export interface SequenceNode {
    id: string
    type: SequenceNodeType
    label: string
    waitBeforeDays: number
    nextNodeId?: string
    yesNodeId?: string
    noNodeId?: string
}

export interface CampaignSequence {
    id: string;
    createdAt: string;
    emails: CampaignEmailStep[];
    nodes?: SequenceNode[];
}

export interface Product extends EmailSettings {
    id: string;
    name: string;
    description: string;
    targetAudience: string;
    uniqueSellingPoints: string[];
    ceoName?: string;
    ceoEmail?: string;
    createdAt: string;
    pipelineTemplate?: string;
    funnelType?: string;
    timezone?: string;
    websiteUrl?: string;
    industry?: string;
    companySize?: string;
    targetCustomers?: string;
    painPoints?: string;
    valueProp?: string;
    saveManualStrategy?: boolean;
    campaignStatus?: 'active' | 'paused';
    approvalRequired?: boolean;
    strategy?: {
        targetAudience: string;
        keyValueMessages: string;
        outreachApproach: string;
        followUpStrategy: string;
        successMetrics: string;
    };
    campaignSequence?: CampaignSequence;
    linkedinCookie?: string;
    linkedinCookieA?: string;
    linkedinUserAgent?: string;
    linkedinUserId?: string;
    linkedinConnected?: boolean;
    linkedinAccountName?: string;
    extensionToken?: string;
    extensionConnected?: boolean;
    extensionLastSeenAt?: string;
    // Airtop cloud browser config
    airtopApiKey?: string;
    airtopProfileId?: string;
    airtopProxyCountry?: string;
    // Unipile integration
    unipileAccountId?: string;
    // User relation
    userId?: string;
}

export interface SequenceState {
    id: string;
    leadId: string;
    productId: string;
    sequenceNodeId: string;
    sequenceEnteredAt: string;
    sequenceWaitUntil: string;
    status: 'active' | 'paused' | 'complete' | 'failed';
    updatedAt: string;
}

export interface SequenceJob {
    id: string;
    leadId: string;
    productId: string;
    nodeId: string;
    scheduledAt: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    attempts: number;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserChannel {
    id: string;
    userId: string;
    provider: string; // LINKEDIN, MAIL, WHATSAPP, etc.
    unipileAccountId: string;
    name: string | null;
    status: string;
    createdAt: string;
}

export interface CallTask {
    id: string;
    leadId: string;
    productId: string;
    contactName: string;
    contactEmail: string;
    orgName?: string;
    notes: string;
    status: 'pending' | 'done' | 'skipped';
    createdAt: string;
    completedAt?: string;
}

// ─── Conversion helpers (camelCase ↔ snake_case) ───────────────────────────

function productToRow(p: Partial<Product>): Record<string, any> {
    const row: Record<string, any> = {}
    const map: Record<string, string> = {
        id: 'id', name: 'name', description: 'description', website: 'website',
        industry: 'industry', ceoName: 'ceo_name', ceoEmail: 'ceo_email',
        targetAudience: 'target_audience', targetCustomers: 'target_customers',
        painPoints: 'pain_points', valueProp: 'value_prop', companySize: 'company_size',
        timezone: 'timezone', pipelineTemplate: 'pipeline_template', funnelType: 'funnel_type',
        saveManualStrategy: 'save_manual_strategy', approvalRequired: 'approval_required',
        campaignStatus: 'campaign_status', sendingMethod: 'sending_method',
        senderName: 'sender_name', senderEmail: 'sender_email', replyToEmail: 'reply_to_email',
        smtpConfig: 'smtp_config', sendgridConfig: 'sendgrid_config',
        mailgunConfig: 'mailgun_config', sesConfig: 'ses_config',
        emailVerification: 'email_verification', domainAuth: 'domain_auth',
        calendarConfig: 'calendar_config', strategy: 'strategy',
        campaignSequence: 'campaign_sequence', linkedinCookie: 'linkedin_cookie',
        linkedinCookieA: 'linkedin_cookie_a', linkedinUserAgent: 'linkedin_user_agent',
        linkedinUserId: 'linkedin_user_id',
        linkedinConnected: 'linkedin_connected', linkedinAccountName: 'linkedin_account_name',
        extensionToken: 'extension_token', extensionConnected: 'extension_connected',
        extensionLastSeenAt: 'extension_last_seen_at',
        airtopApiKey: 'airtop_api_key', airtopProfileId: 'airtop_profile_id',
        airtopProxyCountry: 'airtop_proxy_country',
        unipileAccountId: 'unipile_account_id',
        userId: 'user_id',
        createdAt: 'created_at', websiteUrl: 'website',
    }
    for (const [key, val] of Object.entries(p)) {
        if (val === undefined) continue
        const col = map[key]
        if (col) row[col] = val
    }
    return row
}

function rowToProduct(row: any): Product {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        targetAudience: row.target_audience || '',
        uniqueSellingPoints: Array.isArray(row.unique_selling_points) ? row.unique_selling_points : [],
        ceoName: row.ceo_name,
        ceoEmail: row.ceo_email,
        createdAt: row.created_at,
        pipelineTemplate: row.pipeline_template,
        funnelType: row.funnel_type,
        timezone: row.timezone,
        websiteUrl: row.website_url,
        industry: row.industry,
        companySize: row.company_size,
        targetCustomers: row.target_customers,
        painPoints: row.pain_points,
        valueProp: row.value_prop,
        saveManualStrategy: row.save_manual_strategy,
        campaignStatus: row.campaign_status,
        approvalRequired: row.approval_required,
        strategy: row.strategy || undefined,
        campaignSequence: row.campaign_sequence || undefined,

        // Email Settings
        sendingMethod: row.sending_method || 'platform',
        senderName: row.sender_name || '',
        senderEmail: row.sender_email || '',
        replyToEmail: row.reply_to_email,
        smtpConfig: row.smtp_config,
        sendgridConfig: row.sendgrid_config,
        mailgunConfig: row.mailgun_config,
        sesConfig: row.ses_config,
        emailVerification: row.email_verification,
        domainAuth: row.domain_auth,
        calendarConfig: row.calendar_config,

        // Profile / Integration Settings
        linkedinCookie: row.linkedin_cookie,
        linkedinCookieA: row.linkedin_cookie_a,
        linkedinUserAgent: row.linkedin_user_agent,
        linkedinUserId: row.linkedin_user_id,
        linkedinConnected: row.linkedin_connected,
        linkedinAccountName: row.linkedin_account_name,
        extensionToken: row.extension_token,
        extensionConnected: row.extension_connected,
        extensionLastSeenAt: row.extension_last_seen_at,
        airtopApiKey: row.airtop_api_key,
        airtopProfileId: row.airtop_profile_id,
        airtopProxyCountry: row.airtop_proxy_country,
        unipileAccountId: row.unipile_account_id,
        userId: row.user_id,
    } as Product
}

function contactToRow(c: Record<string, any>): Record<string, any> {
    const row: Record<string, any> = {}
    const map: Record<string, string> = {
        id: 'id', productId: 'product_id', fullName: 'full_name', firstName: 'first_name',
        lastName: 'last_name', email: 'email', phone: 'phone', linkedinUrl: 'linkedin_url',
        position: 'position', seniority: 'seniority', city: 'city', state: 'state',
        country: 'country', functional: 'functional',
        orgName: 'org_name', orgDescription: 'org_description', orgCity: 'org_city',
        orgState: 'org_state', orgCountry: 'org_country', orgIndustry: 'org_industry',
        orgLinkedinUrl: 'org_linkedin_url', orgWebsite: 'org_website', orgSize: 'org_size',
        orgFoundedYear: 'org_founded_year',
        insights: 'insights', professional_focus: 'professional_focus',
        ppeIndex: 'ppe_index', ppeBatchIndex: 'ppe_batch_index',
        generatedEmail: 'generated_email', generatedSubject: 'generated_subject',
        generatedEmails: 'generated_emails', draftGeneratedAt: 'draft_generated_at',
        lastPersonalizedAt: 'last_personalized_at',
        status: 'status', campaignStep: 'campaign_step', campaignStepAt: 'campaign_step_at',
        nextEmailAt: 'next_email_at', launchedAt: 'launched_at',
        campaignComplete: 'campaign_complete', sequenceNodeId: 'sequence_node_id',
        linkedinVisitedAt: 'linkedin_visited_at', linkedinInviteSentAt: 'linkedin_invite_sent_at',
        linkedinChatSentAt: 'linkedin_chat_sent_at', linkedinConnected: 'linkedin_connected',
        linkedinConnectionCheckedAt: 'linkedin_connection_checked_at',
        unsubscribed: 'unsubscribed', unsubscribedAt: 'unsubscribed_at',
        savedAt: 'saved_at', createdAt: 'created_at', updatedAt: 'updated_at',
    }
    for (const [key, val] of Object.entries(c)) {
        if (val === undefined) continue
        const col = map[key]
        if (col) row[col] = val
    }
    return row
}

function rowToContact(row: any): any {
    return {
        id: row.id,
        productId: row.product_id,
        fullName: row.full_name,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        linkedinUrl: row.linkedin_url,
        position: row.position,
        seniority: row.seniority,
        city: row.city,
        state: row.state,
        country: row.country,
        functional: row.functional,
        orgName: row.org_name,
        orgDescription: row.org_description,
        orgCity: row.org_city,
        orgState: row.org_state,
        orgCountry: row.org_country,
        orgIndustry: row.org_industry,
        orgLinkedinUrl: row.org_linkedin_url,
        orgWebsite: row.org_website,
        orgSize: row.org_size,
        orgFoundedYear: row.org_founded_year,
        insights: row.insights,
        professional_focus: row.professional_focus,
        ppeIndex: row.ppe_index,
        ppeBatchIndex: row.ppe_batch_index,
        generatedEmail: row.generated_email,
        generatedSubject: row.generated_subject,
        generatedEmails: row.generated_emails,
        draftGeneratedAt: row.draft_generated_at,
        lastPersonalizedAt: row.last_personalized_at,
        status: row.status,
        campaignStep: row.campaign_step,
        campaignStepAt: row.campaign_step_at,
        nextEmailAt: row.next_email_at,
        launchedAt: row.launched_at,
        campaignComplete: row.campaign_complete,
        sequenceNodeId: row.sequence_node_id,
        linkedinVisitedAt: row.linkedin_visited_at,
        linkedinInviteSentAt: row.linkedin_invite_sent_at,
        linkedinChatSentAt: row.linkedin_chat_sent_at,
        linkedinConnected: row.linkedin_connected,
        linkedinConnectionCheckedAt: row.linkedin_connection_checked_at,
        unsubscribed: row.unsubscribed,
        unsubscribedAt: row.unsubscribed_at,
        savedAt: row.saved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

function rowToSeqState(row: any): SequenceState {
    return {
        id: row.id,
        leadId: row.lead_id,
        productId: row.product_id,
        sequenceNodeId: row.sequence_node_id,
        sequenceEnteredAt: row.sequence_entered_at,
        sequenceWaitUntil: row.sequence_wait_until,
        status: row.status,
        updatedAt: row.updated_at,
    }
}

function rowToSeqJob(row: any): SequenceJob {
    return {
        id: row.id,
        leadId: row.lead_id,
        productId: row.product_id,
        nodeId: row.node_id,
        scheduledAt: row.scheduled_at,
        status: row.status,
        attempts: row.attempts,
        error: row.error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

function rowToUserChannel(row: any): UserChannel {
    return {
        id: row.id,
        userId: row.user_id,
        provider: row.provider,
        unipileAccountId: row.unipile_account_id,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
    }
}

function rowToCallTask(row: any): CallTask {
    return {
        id: row.id,
        leadId: row.lead_id,
        productId: row.product_id,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        orgName: row.org_name,
        notes: row.notes,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at,
    }
}

// ─── Public API ────────────────────────────────────────────────────────────

export const db = {
    // ── Products ──────────────────────────────────────────────────────────
    getProducts: async (userId?: string): Promise<Product[]> => {
        let query = supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query
        if (error) { console.error('[db] getProducts:', error.message); return [] }
        return (data || []).map(rowToProduct)
    },

    getProduct: async (id: string): Promise<Product | undefined> => {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle()
        if (error || !data) return undefined
        return rowToProduct(data)
    },

    saveProduct: async (product: Product): Promise<void> => {
        const row = productToRow(product)
        const { error } = await supabaseAdmin
            .from('products')
            .upsert(row, { onConflict: 'id' })
        if (error) console.error('[db] saveProduct:', error.message)
    },

    updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
        const row = productToRow(updates)
        const { data, error } = await supabaseAdmin
            .from('products')
            .update(row)
            .eq('id', id)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] updateProduct:', error.message); return null }
        return data ? rowToProduct(data) : null
    },

    deleteProduct: async (id: string): Promise<Product | null> => {
        const { data, error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] deleteProduct:', error.message); return null }
        // Cascaded deletes handle related data via FK ON DELETE CASCADE
        return data ? rowToProduct(data) : null
    },

    isExtensionActive: (product: Product): boolean => {
        if (!product.extensionConnected || !product.extensionLastSeenAt) return false
        const lastSeen = new Date(product.extensionLastSeenAt).getTime()
        const now = Date.now()
        const diffMins = (now - lastSeen) / (1000 * 60)
        return diffMins < 10
    },

    // ── Contacts ──────────────────────────────────────────────────────────
    getContacts: async (productId?: string): Promise<any[]> => {
        let query = supabaseAdmin.from('contacts').select('*')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) { console.error('[db] getContacts:', error.message); return [] }
        return (data || []).map(rowToContact)
    },

    getContact: async (id: string): Promise<any | null> => {
        const { data, error } = await supabaseAdmin
            .from('contacts')
            .select('*')
            .eq('id', id)
            .maybeSingle()
        if (error || !data) return null
        return rowToContact(data)
    },

    saveContact: async (contact: any): Promise<void> => {
        const row = contactToRow(contact)
        const { error } = await supabaseAdmin
            .from('contacts')
            .upsert(row, { onConflict: 'id' })
        if (error) console.error('[db] saveContact:', error.message)
    },

    saveContacts: async (contacts: any[]): Promise<void> => {
        if (!contacts.length) return
        const rows = contacts.map(contactToRow)
        const { error } = await supabaseAdmin
            .from('contacts')
            .upsert(rows, { onConflict: 'id' })
        if (error) console.error('[db] saveContacts:', error.message)
    },

    updateContact: async (id: string, updates: Record<string, any>): Promise<any | null> => {
        const row = contactToRow(updates)
        row.updated_at = new Date().toISOString()
        const { data, error } = await supabaseAdmin
            .from('contacts')
            .update(row)
            .eq('id', id)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] updateContact:', error.message); return null }
        return data ? rowToContact(data) : null
    },

    // ── Messages ──────────────────────────────────────────────────────────
    getMessages: async (productId?: string): Promise<any[]> => {
        let query = supabaseAdmin.from('messages').select('*')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) { console.error('[db] getMessages:', error.message); return [] }
        return (data || []).map((row: any) => ({
            id: row.id,
            productId: row.product_id,
            contactId: row.contact_id,
            contactName: row.contact_name,
            email: row.email,
            from: row.from,
            subject: row.subject,
            body: row.body,
            snippet: row.snippet,
            status: row.status,
            channel: row.channel,
            direction: row.direction,
            sequenceNodeId: row.sequence_node_id,
            campaignStep: row.campaign_step,
            date: row.date,
            time: row.time,
            timestamp: row.created_at,
        }))
    },

    saveMessage: async (msg: any): Promise<void> => {
        const row: Record<string, any> = {
            id: msg.id,
            product_id: msg.productId,
            contact_id: msg.contactId || null,
            contact_name: msg.contactName,
            email: msg.email,
            from: msg.from,
            subject: msg.subject,
            body: msg.body,
            snippet: msg.snippet,
            status: msg.status || 'Sent',
            channel: msg.channel || 'Email',
            direction: msg.direction || 'outgoing',
            sequence_node_id: msg.sequenceNodeId,
            campaign_step: msg.campaignStep,
            date: msg.date,
            time: msg.time,
            created_at: msg.timestamp || new Date().toISOString(),
        }
        const { error } = await supabaseAdmin.from('messages').insert(row)
        if (error) console.error('[db] saveMessage:', error.message)
    },

    // ── Campaign Activity ─────────────────────────────────────────────────
    getActivity: async (productId?: string): Promise<any[]> => {
        let query = supabaseAdmin.from('campaign_activity').select('*')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) { console.error('[db] getActivity:', error.message); return [] }
        return (data || []).map((row: any) => ({
            productId: row.product_id,
            nodeId: row.node_id,
            leadId: row.lead_id,
            timestamp: row.created_at,
            status: row.status,
            details: row.details,
        }))
    },

    logActivity: async (productId: string, nodeId: string, leadId: string, status: string, details: string): Promise<void> => {
        const { error } = await supabaseAdmin.from('campaign_activity').insert({
            product_id: productId,
            node_id: nodeId,
            lead_id: leadId,
            status,
            details,
        })
        if (error) console.error('[db] logActivity:', error.message)
    },

    // ── Extension Tasks ───────────────────────────────────────────────────
    getExtensionTasks: async (productId?: string): Promise<any[]> => {
        let query = supabaseAdmin.from('extension_tasks').select('*')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query.order('created_at', { ascending: true })
        if (error) { console.error('[db] getExtensionTasks:', error.message); return [] }
        return (data || []).map((row: any) => ({
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
            resultData: row.result_data,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }))
    },

    createExtensionTask: async (task: any): Promise<any> => {
        const row = {
            id: task.id || crypto.randomUUID(),
            product_id: task.productId,
            lead_id: task.leadId,
            node_id: task.nodeId,
            type: task.type,
            contact_name: task.contactName,
            profile_url: task.profileUrl,
            message_text: task.messageText,
            note_text: task.noteText,
            status: task.status || 'pending',
        }
        const { data, error } = await supabaseAdmin
            .from('extension_tasks')
            .insert(row)
            .select()
            .single()
        if (error) { console.error('[db] createExtensionTask:', error.message); return null }
        return data
    },

    updateExtensionTask: async (taskId: string, updates: Record<string, any>): Promise<void> => {
        const row: Record<string, any> = {}
        if (updates.status !== undefined) row.status = updates.status
        if (updates.completedAt !== undefined) row.completed_at = updates.completedAt
        if (updates.resultData !== undefined) row.result_data = updates.resultData
        const { error } = await supabaseAdmin
            .from('extension_tasks')
            .update(row)
            .eq('id', taskId)
        if (error) console.error('[db] updateExtensionTask:', error.message)
    },

    deleteExtensionTask: async (taskId: string): Promise<void> => {
        const { error } = await supabaseAdmin
            .from('extension_tasks')
            .delete()
            .eq('id', taskId)
        if (error) console.error('[db] deleteExtensionTask:', error.message)
    },

    getPendingExtensionTask: async (leadId: string, nodeId: string): Promise<any | null> => {
        const { data, error } = await supabaseAdmin
            .from('extension_tasks')
            .select('*')
            .eq('lead_id', leadId)
            .eq('node_id', nodeId)
            .eq('status', 'pending')
            .maybeSingle()
        if (error || !data) return null
        return {
            id: data.id, type: data.type, productId: data.product_id,
            nodeId: data.node_id, leadId: data.lead_id,
            contactName: data.contact_name, profileUrl: data.profile_url,
            messageText: data.message_text, status: data.status,
            createdAt: data.created_at, updatedAt: data.updated_at,
        }
    },

    // ── Sequence States ───────────────────────────────────────────────────
    getSequenceStates: async (): Promise<SequenceState[]> => {
        const { data, error } = await supabaseAdmin.from('sequence_states').select('*')
        if (error) { console.error('[db] getSequenceStates:', error.message); return [] }
        return (data || []).map(rowToSeqState)
    },

    getSequenceState: async (leadId: string): Promise<SequenceState | undefined> => {
        const { data, error } = await supabaseAdmin
            .from('sequence_states')
            .select('*')
            .eq('lead_id', leadId)
            .maybeSingle()
        if (error || !data) return undefined
        return rowToSeqState(data)
    },

    saveSequenceState: async (state: SequenceState): Promise<void> => {
        const row = {
            id: state.id,
            lead_id: state.leadId,
            product_id: state.productId,
            sequence_node_id: state.sequenceNodeId,
            sequence_entered_at: state.sequenceEnteredAt,
            sequence_wait_until: state.sequenceWaitUntil,
            status: state.status,
        }
        const { error } = await supabaseAdmin
            .from('sequence_states')
            .upsert(row, { onConflict: 'lead_id' })
        if (error) console.error('[db] saveSequenceState:', error.message)
    },

    updateSequenceState: async (leadId: string, updates: Partial<SequenceState>): Promise<SequenceState | null> => {
        const row: Record<string, any> = {}
        if (updates.sequenceNodeId !== undefined) row.sequence_node_id = updates.sequenceNodeId
        if (updates.sequenceEnteredAt !== undefined) row.sequence_entered_at = updates.sequenceEnteredAt
        if (updates.sequenceWaitUntil !== undefined) row.sequence_wait_until = updates.sequenceWaitUntil
        if (updates.status !== undefined) row.status = updates.status
        const { data, error } = await supabaseAdmin
            .from('sequence_states')
            .update(row)
            .eq('lead_id', leadId)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] updateSequenceState:', error.message); return null }
        return data ? rowToSeqState(data) : null
    },

    // ── Sequence Jobs ─────────────────────────────────────────────────────
    getSequenceJobs: async (): Promise<SequenceJob[]> => {
        const { data, error } = await supabaseAdmin.from('sequence_jobs').select('*')
        if (error) { console.error('[db] getSequenceJobs:', error.message); return [] }
        return (data || []).map(rowToSeqJob)
    },

    saveSequenceJob: async (job: SequenceJob): Promise<void> => {
        const { error } = await supabaseAdmin.from('sequence_jobs').insert({
            id: job.id,
            lead_id: job.leadId,
            product_id: job.productId,
            node_id: job.nodeId,
            scheduled_at: job.scheduledAt,
            status: job.status,
            attempts: job.attempts,
            error: job.error,
        })
        if (error) console.error('[db] saveSequenceJob:', error.message)
    },

    updateSequenceJob: async (jobId: string, updates: Partial<SequenceJob>): Promise<SequenceJob | null> => {
        const row: Record<string, any> = {}
        if (updates.status !== undefined) row.status = updates.status
        if (updates.attempts !== undefined) row.attempts = updates.attempts
        if (updates.error !== undefined) row.error = updates.error
        const { data, error } = await supabaseAdmin
            .from('sequence_jobs')
            .update(row)
            .eq('id', jobId)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] updateSequenceJob:', error.message); return null }
        return data ? rowToSeqJob(data) : null
    },

    purgeOldJobs: async (daysOld: number = 30): Promise<void> => {
        const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()
        const { error } = await supabaseAdmin
            .from('sequence_jobs')
            .delete()
            .in('status', ['done', 'failed'])
            .lt('created_at', cutoff)
        if (error) console.error('[db] purgeOldJobs:', error.message)
    },

    // ── Call Tasks ────────────────────────────────────────────────────────
    getCallTasks: async (productId?: string): Promise<CallTask[]> => {
        let query = supabaseAdmin.from('call_tasks').select('*')
        if (productId) query = query.eq('product_id', productId)
        const { data, error } = await query
        if (error) { console.error('[db] getCallTasks:', error.message); return [] }
        return (data || []).map(rowToCallTask)
    },

    saveCallTask: async (task: CallTask): Promise<void> => {
        const { error } = await supabaseAdmin.from('call_tasks').insert({
            id: task.id,
            lead_id: task.leadId,
            product_id: task.productId,
            contact_name: task.contactName,
            contact_email: task.contactEmail,
            org_name: task.orgName,
            notes: task.notes,
            status: task.status,
        })
        if (error) console.error('[db] saveCallTask:', error.message)
    },

    updateCallTask: async (taskId: string, updates: Partial<CallTask>): Promise<CallTask | null> => {
        const row: Record<string, any> = {}
        if (updates.status !== undefined) row.status = updates.status
        if (updates.completedAt !== undefined) row.completed_at = updates.completedAt
        const { data, error } = await supabaseAdmin
            .from('call_tasks')
            .update(row)
            .eq('id', taskId)
            .select()
            .maybeSingle()
        if (error) { console.error('[db] updateCallTask:', error.message); return null }
        return data ? rowToCallTask(data) : null
    },

    // ── Utility: logMessage (used by action-router and several routes) ───
    logMessage: async (productId: string, contact: any, senderEmail: string, subject: string, body: string, nodeId: string): Promise<void> => {
        const msg = {
            id: crypto.randomUUID(),
            productId,
            contactId: contact.id,
            contactName: contact.fullName,
            email: contact.email,
            from: senderEmail,
            subject,
            body,
            snippet: body.substring(0, 150) + '...',
            status: 'Sent',
            channel: 'Email',
            direction: 'outgoing',
            sequenceNodeId: nodeId,
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
        }
        await db.saveMessage(msg)
    },

    // ── User Channels ────────────────────────────────────────────────────────
    getUserChannels: async (userId: string): Promise<UserChannel[]> => {
        const { data, error } = await supabaseAdmin
            .from('user_channels')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[db] getUserChannels:', error.message)
            return []
        }
        return data.map(rowToUserChannel)
    },

    upsertUserChannel: async (
        userId: string,
        provider: string,
        unipileAccountId: string,
        name?: string
    ): Promise<boolean> => {
        const { error } = await supabaseAdmin
            .from('user_channels')
            .upsert({
                user_id: userId,
                provider,
                unipile_account_id: unipileAccountId,
                name: name || null,
                status: 'IN_PROGRESS'
            }, {
                onConflict: 'unipile_account_id'
            })

        if (error) {
            console.error('[db] upsertUserChannel:', error.message)
            return false
        }
        return true
    }
}
