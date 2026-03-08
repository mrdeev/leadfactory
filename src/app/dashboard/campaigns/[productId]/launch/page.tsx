"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    X, ChevronRight, Star, Settings, MoreHorizontal, AlertCircle,
    Search, Mail, Eye, UserPlus, MessageCircle, Phone, Clock,
    Pencil, Loader2, CheckCircle2, Info, Send, ArrowUpDown, Filter, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CampaignTopBar } from "@/components/campaign/CampaignTopBar"

// ─── Email Purpose Map ─────────────────────────────────────────────────────
const EMAIL_PURPOSES: Record<string, string> = {
    email1: 'initial',
    email_yes: 'follow_up',
    email_no1: 'follow_up',
    email_no2: 'follow_up',
    email_no3: 'breakup',
    email_final: 'breakup',
}

function getEmailContent(nodeId: string, contact: any, campaignSequence: any) {
    // Check per-node generated email map first (all nodes)
    if (contact?.generatedEmails?.[nodeId]) {
        const { subject, body } = contact.generatedEmails[nodeId]
        return { subject: subject || 'Email', body, isTemplate: false }
    }
    // Backward compat: email1 stored as top-level fields
    if (nodeId === 'email1' && contact?.generatedEmail) {
        return { subject: contact.generatedSubject || 'Email', body: contact.generatedEmail, isTemplate: false }
    }
    // Fall back to campaign sequence template
    const purpose = EMAIL_PURPOSES[nodeId]
    const template = campaignSequence?.emails?.find((e: any) => e.purpose === purpose)
    if (template) {
        const body = [
            ...(template.keyMessages || []),
            '\n{{signature}}'
        ].join('\n\n')
        return { subject: template.subjectApproach, body, isTemplate: true }
    }
    return { subject: 'Follow-up email', body: 'AI-personalized automatically when this step is reached.\n\n{{signature}}', isTemplate: true }
}

// ─── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm', className }: { name: string; size?: 'sm' | 'md'; className?: string }) {
    const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']
    const color = COLORS[(name || '').charCodeAt(0) % COLORS.length]
    return (
        <div className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', color, size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs', className)}>
            {initials}
        </div>
    )
}



// ─── Contact Card (left sidebar) ───────────────────────────────────────────
function ContactCard({ contact, selected, onSelect }: { contact: any; selected: boolean; onSelect: () => void }) {
    const hasEmail = !!contact.email
    return (
        <div
            onClick={onSelect}
            className={cn(
                'px-3 py-3 cursor-pointer border-b border-slate-50 transition-colors',
                selected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-slate-50 border-l-2 border-l-transparent'
            )}
        >
            <div className="flex items-start gap-2.5">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="mt-0.5 rounded border-slate-300 h-3.5 w-3.5 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                />
                <Avatar name={contact.fullName || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 leading-tight truncate">{contact.fullName || '—'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                        {hasEmail ? (
                            <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        ) : (
                            <div className="relative flex-shrink-0">
                                <Mail className="h-3 w-3 text-slate-300" />
                                <X className="h-2 w-2 text-red-400 absolute -top-0.5 -right-0.5" />
                            </div>
                        )}
                        <p className={cn('text-[11px] truncate', hasEmail ? 'text-slate-500' : 'text-slate-400 italic')}>
                            {hasEmail ? contact.email : 'No email found'}
                        </p>
                    </div>
                    {contact.campaignStep > 0 && (
                        <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-2 w-2" />Launched
                        </span>
                    )}
                </div>
                <button className="h-5 w-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-500 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

// ─── Wait Badge ────────────────────────────────────────────────────────────
function WaitBadge({ days, label }: { days: number; label?: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-px h-3 bg-[#cbd5e1]" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] text-slate-500 font-medium bg-white border border-slate-200 shadow-sm whitespace-nowrap">
                <Clock className="h-3 w-3 text-slate-400" />
                {label || (days === 0 ? 'Send immediately' : `Wait ${days} day${days !== 1 ? 's' : ''}`)}
            </div>
            <div className="w-px h-3 bg-[#cbd5e1]" />
        </div>
    )
}

// ─── Connector ─────────────────────────────────────────────────────────────
function Connector() {
    return <div className="flex justify-center"><div className="w-px h-5 bg-[#cbd5e1]" /></div>
}

// ─── Rate Limit Badge ──────────────────────────────────────────────────────
function RateLimitBadge({ label, count = 0, limit }: { label: string; count?: number; limit: number }) {
    return (
        <div className="flex justify-center my-1.5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary">
                <Info className="h-3 w-3 text-primary/70 flex-shrink-0" />
                <span>{label}: <strong>{count}/{limit}</strong> in the last 24 hours</span>
                <button className="ml-1 text-primary/70 hover:text-primary">
                    <Pencil className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

// ─── Node Status ───────────────────────────────────────────────────────────
// Status detection logic based on sequence state
function getNodeStatus(node: any, contact: any, sequenceState: any): 'sent' | 'scheduled' | 'ready' | 'failed' | null {
    if (!contact || !contact.campaignStep || contact.campaignStep === 0) return null
    if (node.id === 'email1') return 'sent' // Opening email always sent when launched

    if (!sequenceState) return null

    // If the sequence failed at this node, show failed status
    if (sequenceState.status === 'failed' && sequenceState.sequenceNodeId === node.id) {
        return 'failed'
    }

    // If sequence is complete for this lead, all nodes in their finished path are 'sent'
    if (sequenceState.status === 'complete') return 'sent'

    // If this is the current node the worker is waiting to execute
    if (sequenceState.sequenceNodeId === node.id) {
        if (sequenceState.status === 'failed') return 'failed'
        const now = new Date()
        const wait = sequenceState.sequenceWaitUntil ? new Date(sequenceState.sequenceWaitUntil) : now
        return wait <= now ? 'ready' : 'scheduled'
    }

    // A node is 'sent' if it precedes the current node in the state
    const linearOrder = ['email1', 'visit', 'invite', 'condition']
    const currentIndex = linearOrder.indexOf(sequenceState.sequenceNodeId)
    const nodeIndex = linearOrder.indexOf(node.id)

    if (nodeIndex !== -1 && currentIndex !== -1) {
        if (nodeIndex < currentIndex) return 'sent'
    }

    // For branch nodes
    if (['chat_yes1', 'chat_yes2', 'email_yes', 'email_no1', 'email_no2', 'email_no3', 'email_final'].includes(node.id)) {
        if (sequenceState.sequenceNodeId === 'end') return 'sent'
    }

    return null
}

function NodeStatusBadge({ status }: { status: 'sent' | 'scheduled' | 'ready' | 'failed' }) {
    if (status === 'failed') {
        return (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-red-700">Failed</span>
            </div>
        )
    }
    if (status === 'sent') {
        return (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-emerald-700">Sent</span>
            </div>
        )
    }
    if (status === 'ready') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
                <div className="relative h-3 w-3 flex items-center justify-center flex-shrink-0">
                    <div className="absolute h-2.5 w-2.5 rounded-full bg-amber-400/40 animate-ping" />
                    <div className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
                </div>
                <span className="text-[10px] font-bold text-amber-700">Due Now</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full">
            <div className="relative h-3 w-3 flex items-center justify-center flex-shrink-0">
                <div className="absolute h-2.5 w-2.5 rounded-full bg-primary/40 animate-ping" />
                <div className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <span className="text-[10px] font-bold text-slate-500">Scheduled</span>
        </div>
    )
}

// ─── Expanded Email Node ───────────────────────────────────────────────────
function EmailNodeCard({ nodeId, contact, campaignSequence, onPersonalize, status }: {
    nodeId: string
    contact: any
    campaignSequence: any
    onPersonalize: (nodeId: string, subject: string, body: string, isTemplate: boolean) => void
    status: 'sent' | 'scheduled' | 'ready' | 'failed' | null
}) {
    const { subject, body, isTemplate } = getEmailContent(nodeId, contact, campaignSequence)
    const lines = body.split('\n').filter(Boolean)
    const preview = lines.slice(0, 4).join('\n')

    return (
        <div className="flex justify-center">
            <div className={cn(
                'w-[400px] rounded-xl border bg-white shadow-sm transition-all',
                status === 'sent'
                    ? 'border-emerald-200 border-l-[3px] border-l-emerald-400'
                    : status === 'ready'
                        ? 'border-amber-200 border-l-[3px] border-l-amber-400'
                        : status === 'scheduled'
                            ? 'border-slate-200 border-l-[3px] border-l-primary/40'
                            : 'border-slate-200 hover:border-slate-300'
            )}>
                {/* Header row */}
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            status === 'sent' ? 'bg-emerald-50' : 'bg-slate-100'
                        )}>
                            <Mail className={cn('h-4 w-4', status === 'sent' ? 'text-emerald-500' : 'text-slate-500')} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-slate-800 leading-tight">Email</p>
                            <p className="text-[10px] text-slate-400">
                                {isTemplate ? 'AI template — personalized at send time' : 'Send automatic email'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {status && <NodeStatusBadge status={status} />}
                    </div>
                </div>

                {/* Email content */}
                <div className="px-4 py-3">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">Subject</p>
                    <p className="text-[12px] text-slate-700 font-medium leading-snug mb-3 italic">
                        "{subject}"
                    </p>
                    {!isTemplate && (
                        <>
                            <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                                {preview}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">{'{{signature}}'}</p>
                        </>
                    )}
                    {isTemplate && (
                        <div className="space-y-1.5">
                            {lines.slice(0, 2).map((line: string, i: number) => (
                                <div key={i} className="text-[11.5px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 leading-relaxed">
                                    {line}
                                </div>
                            ))}
                            <p className="text-[10px] text-slate-400 mt-1">{'{{signature}}'}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end px-4 pb-3.5">
                    <button
                        onClick={() => onPersonalize(nodeId, subject, body, isTemplate)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/5"
                    >
                        <Pencil className="h-3 w-3" />
                        Personalize
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Compact Node (LinkedIn / Call) ───────────────────────────────────────
function CompactNodeCard({ type, label, sublabel, status, onPersonalize }: {
    type: string; label: string; sublabel?: string;
    status?: 'sent' | 'scheduled' | 'ready' | 'failed' | null
    onPersonalize?: () => void
}) {
    const ICONS: Record<string, any> = {
        linkedin_visit: Eye, linkedin_invite: UserPlus, linkedin_chat: MessageCircle, call: Phone
    }
    const Icon = ICONS[type] || Mail
    const isLinkedIn = type.startsWith('linkedin')
    return (
        <div className="flex justify-center">
            <div className={cn(
                'w-[280px] rounded-xl border bg-white transition-all',
                status === 'sent'
                    ? 'border-emerald-200 border-l-[3px] border-l-emerald-400'
                    : status === 'ready'
                        ? 'border-amber-200 border-l-[3px] border-l-amber-400'
                        : status === 'scheduled'
                            ? 'border-slate-200 border-l-[3px] border-l-primary/40'
                            : 'border-slate-200 hover:border-slate-300'
            )}>
                <div className="p-3 flex items-center gap-3">
                    <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        status === 'sent' ? 'bg-emerald-50' : isLinkedIn ? 'bg-[#0A66C2]/10' : 'bg-slate-100'
                    )}>
                        <Icon className={cn(
                            'h-[18px] w-[18px]',
                            status === 'sent' ? 'text-emerald-500' : isLinkedIn ? 'text-[#0A66C2]' : 'text-slate-500'
                        )} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">{label}</p>
                        {sublabel && <p className="text-[11px] text-slate-400 mt-[3px]">{sublabel}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {status && <NodeStatusBadge status={status} />}
                    </div>
                </div>
                {onPersonalize && (
                    <div className="flex justify-end px-3 pb-2.5 -mt-1">
                        <button onClick={onPersonalize} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5">
                            <Pencil className="h-3 w-3" />
                            Personalize
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Condition Node ────────────────────────────────────────────────────────
function ConditionNodeCard({ label }: { label: string }) {
    return (
        <div className="flex justify-center">
            <div className="w-[280px] rounded-xl border border-[#bfdbfe] bg-white">
                <div className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center flex-shrink-0">
                        <ArrowUpDown className="h-[18px] w-[18px] text-[#0A66C2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">{label}</p>
                        <div className="flex items-center gap-1 mt-[3px]">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#0A66C2">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <span className="text-[11px] text-slate-400">LinkedIn condition</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Personalize Modal ─────────────────────────────────────────────────────
function PersonalizeModal({ contact, nodeId, subject: initSubject, body: initBody, isTemplate, onSave, onClose }: {
    contact: any; nodeId: string; subject: string; body: string; isTemplate: boolean
    onSave: (nodeId: string, subject: string, body: string) => void
    onClose: () => void
}) {
    const [subject, setSubject] = useState(initSubject)
    const [body, setBody] = useState(initBody)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            if (nodeId === 'email1' && contact?.id) {
                await fetch('/api/contacts', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: contact.id, generatedSubject: subject, generatedEmail: body }),
                })
            }
            onSave(nodeId, subject, body)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Personalize email</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {contact ? `Editing for ${contact.fullName}` : 'Editing template'}
                            {isTemplate && nodeId !== 'email1' && ' — changes apply to this step\'s template'}
                        </p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subject line</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary text-slate-700"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email body</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={14}
                            className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:border-primary text-slate-700 leading-relaxed"
                        />
                    </div>
                    {isTemplate && nodeId !== 'email1' && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700">
                            This is the AI template. The final email will be personalized further for each contact at send time using their LinkedIn data.
                        </div>
                    )}
                </div>

                <div className="flex gap-2.5 p-5 border-t border-slate-100">
                    <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-sm h-10">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-sm gap-2">
                        {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><CheckCircle2 className="h-4 w-4" />Save changes</>}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Sequence Flow ─────────────────────────────────────────────────────────
function SequenceFlow({ selectedContact, product, sequenceStates, extensionStats, onPersonalize }: {
    selectedContact: any; product: any; sequenceStates: any[]; extensionStats: any;
    onPersonalize: (nodeId: string, subject: string, body: string, isTemplate: boolean) => void
}) {
    const seq = product?.campaignSequence
    const nodes = seq?.nodes || []

    const getLinearPath = (startId: string | undefined, stopTypes: string[] = ['condition', 'end'], stopIds: string[] = ['email_final']) => {
        let result: any[] = []
        if (!startId) return result
        let curr = nodes.find((n: any) => n.id === startId)
        while (curr && !stopTypes.includes(curr.type) && !stopIds.includes(curr.id)) {
            result.push(curr)
            const nextId = curr.nextNodeId
            if (!nextId) break
            curr = nodes.find((n: any) => n.id === nextId)
        }
        return result
    }

    const mainNodes = getLinearPath('email1')
    const conditionNode = nodes.find((n: any) => n.type === 'condition')
    const yesNodes = getLinearPath(conditionNode?.yesNodeId)
    const noNodes = getLinearPath(conditionNode?.noNodeId)
    const convergenceNodes = getLinearPath('email_final', ['end'], [])

    const sequenceState = sequenceStates.find(s => s.leadId === selectedContact?.id)
    const nodeStatus = (node: any) => getNodeStatus(node, selectedContact, sequenceState)

    const renderNode = (node: any) => {
        if (node.type === 'email') {
            return (
                <EmailNodeCard
                    key={node.id}
                    nodeId={node.id}
                    contact={selectedContact}
                    campaignSequence={product?.campaignSequence}
                    status={nodeStatus(node)}
                    onPersonalize={(id, s, b, t) => onPersonalize(id, s, b, t)}
                />
            )
        }
        if (node.type === 'condition') {
            return <ConditionNodeCard key={node.id} label={node.label} />
        }
        if (node.type === 'end') {
            return (
                <div key={node.id} className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-dashed border-slate-300 bg-white/80 text-[11px] text-slate-400 font-medium">
                    End of sequence
                </div>
            )
        }
        return (
            <CompactNodeCard
                key={node.id}
                type={node.type}
                label={node.label}
                sublabel={NODE_SUB_LABELS[node.id] || node.type.replace('_', ' ')}
                status={nodeStatus(node)}
                onPersonalize={node.canPersonalize ? () => {
                    onPersonalize(node.id, node.label, node.sublabel || '', false)
                } : undefined}
            />
        )
    }

    const NODE_SUB_LABELS: Record<string, string> = {
        visit: 'Visit profile on LinkedIn',
        invite: 'Send on LinkedIn',
        chat_yes1: 'Send on LinkedIn',
        chat_yes2: 'Send on LinkedIn',
    }

    // Default view if no dynamic nodes found
    if (nodes.length === 0) {
        return (
            <div className="min-h-full py-10 flex justify-center italic text-slate-400">
                Generating sequence preview...
            </div>
        )
    }

    return (
        <div className="min-h-full py-10 flex justify-center">
            <div className="flex flex-col items-center">

                {/* Sequence start */}
                <div className="flex justify-center">
                    <div className="px-6 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-500 tracking-wide shadow-sm">
                        Sequence start
                    </div>
                </div>

                {mainNodes.map((node) => (
                    <div key={node.id} className="flex flex-col items-center">
                        <WaitBadge days={node.waitBeforeDays} />
                        {node.id === "email1" && (
                            <RateLimitBadge
                                label="Emails sent"
                                count={extensionStats?.doneTodayCount || 0}
                                limit={100}
                            />
                        )}
                        {node.id === "visit" && (
                            <RateLimitBadge
                                label="Profile visits"
                                count={extensionStats?.visitsToday || 0}
                                limit={20}
                            />
                        )}
                        {node.id === "invite" && (
                            <RateLimitBadge
                                label="Connection requests"
                                count={extensionStats?.invitesToday || 0}
                                limit={20}
                            />
                        )}
                        {node.id.includes('chat') && (
                            <RateLimitBadge
                                label="LinkedIn messages"
                                count={extensionStats?.messagesToday || 0}
                                limit={20}
                            />
                        )}
                        {renderNode(node)}
                    </div>
                ))}

                {/* Condition and branching */}
                {conditionNode && (
                    <div className="flex flex-col items-center">
                        <WaitBadge days={conditionNode.waitBeforeDays} />
                        {renderNode(conditionNode)}

                        <div className="relative flex flex-col items-center">
                            {/* T-connector top */}
                            <div className="relative w-[860px] h-8 flex-shrink-0">
                                <div className="absolute left-1/2 top-0 w-px h-3 bg-[#cbd5e1] -translate-x-1/2" />
                                <div className="absolute left-[calc(25%+0.5px)] right-[calc(25%+0.5px)] top-3 h-px bg-[#cbd5e1]" />
                                <div className="absolute left-1/4 top-3 w-px h-5 bg-[#cbd5e1] -translate-x-1/2" />
                                <div className="absolute right-1/4 top-3 w-px h-5 bg-[#cbd5e1] translate-x-1/2" />
                            </div>

                            <div className="flex w-[860px]">
                                {/* YES column */}
                                <div className="flex-1 flex flex-col items-center border-r border-slate-200/70 pb-2">
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 mb-1">Yes</span>
                                    {yesNodes.map(node => (
                                        <div key={node.id} className="flex flex-col items-center w-full">
                                            <WaitBadge days={node.waitBeforeDays} />
                                            {renderNode(node)}
                                        </div>
                                    ))}
                                    <div className="w-px flex-1 min-h-[20px] bg-[#cbd5e1] mt-3" />
                                </div>
                                {/* NO column */}
                                <div className="flex-1 flex flex-col items-center pb-2">
                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 mb-1">No</span>
                                    {noNodes.map(node => (
                                        <div key={node.id} className="flex flex-col items-center w-full">
                                            <WaitBadge days={node.waitBeforeDays} />
                                            {renderNode(node)}
                                        </div>
                                    ))}
                                    <div className="w-px flex-1 min-h-[20px] bg-[#cbd5e1] mt-3" />
                                </div>
                            </div>

                            {/* T-connector bottom */}
                            <div className="relative w-[860px] h-8 flex-shrink-0">
                                <div className="absolute left-1/4 top-0 w-px h-3 bg-[#cbd5e1] -translate-x-1/2" />
                                <div className="absolute right-1/4 top-0 w-px h-3 bg-[#cbd5e1] translate-x-1/2" />
                                <div className="absolute left-[calc(25%+0.5px)] right-[calc(25%+0.5px)] top-3 h-px bg-[#cbd5e1]" />
                                <div className="absolute left-1/2 top-3 w-px h-5 bg-[#cbd5e1] -translate-x-1/2" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Convergence path */}
                {convergenceNodes.map((node) => (
                    <div key={node.id} className="flex flex-col items-center">
                        <WaitBadge days={node.waitBeforeDays} />
                        {renderNode(node)}
                    </div>
                ))}

                <div className="h-20" />
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CampaignLaunchPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params)
    const router = useRouter()

    const [product, setProduct] = useState<any>(null)
    const [contacts, setContacts] = useState<any[]>([])
    const [sequenceStates, setSequenceStates] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [tab, setTab] = useState<'to_launch' | 'launched'>('to_launch')
    const [search, setSearch] = useState('')
    const [launching, setLaunching] = useState(false)
    const [launchDone, setLaunchDone] = useState(false)
    const [generatingDrafts, setGeneratingDrafts] = useState(false)
    const [personalizeState, setPersonalizeState] = useState<{
        nodeId: string; subject: string; body: string; isTemplate: boolean
    } | null>(null)

    const [extensionStats, setExtensionStats] = useState<any>(null)

    useEffect(() => {
        let cancelled = false

        async function init() {
            try {
                const [prod, ctcts, states] = await Promise.all([
                    fetch(`/api/products/${productId}`).then(r => r.ok ? r.json() : null),
                    fetch(`/api/contacts?productId=${productId}`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/sequence/states?productId=${productId}`).then(r => r.ok ? r.json() : []),
                ])
                if (cancelled) return

                const list: any[] = Array.isArray(ctcts) ? ctcts : []
                setProduct(prod)
                setContacts(list)
                setSequenceStates(Array.isArray(states) ? states : [])
                if (list.length > 0) setSelectedId(list[0].id)

                // Fetch extension stats if we have a product and token
                if (prod && prod.extensionToken) {
                    fetch(`/api/extension/stats?productId=${productId}&token=${prod.extensionToken}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(stats => {
                            if (!cancelled && stats) setExtensionStats(stats)
                        })
                }

                // Auto-generate drafts for any un-launched contacts that don't have all emails yet
                const needsDraft = list.some(
                    c => (!c.campaignStep || c.campaignStep === 0) && !c.generatedEmails
                )
                if (!needsDraft) return

                setGeneratingDrafts(true)
                try {
                    const res = await fetch('/api/campaign/draft', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId }),
                    })
                    if (cancelled) return
                    if (res.ok) {
                        const data = await res.json()
                        if (Array.isArray(data.contacts)) {
                            setContacts(data.contacts)
                            if (data.contacts.length > 0) setSelectedId(data.contacts[0].id)
                        }
                    }
                } catch (err) {
                    console.error('Draft generation failed:', err)
                } finally {
                    if (!cancelled) setGeneratingDrafts(false)
                }
            } catch { }
        }

        init()
        return () => { cancelled = true }
    }, [productId])

    const toLaunch = contacts.filter(c => !c.campaignStep || c.campaignStep === 0)
    const launched = contacts.filter(c => c.campaignStep > 0)
    const tabContacts = (tab === 'to_launch' ? toLaunch : launched)
        .filter(c => !search || c.fullName?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))

    const selectedContact = contacts.find(c => c.id === selectedId) ?? tabContacts[0] ?? null

    const handleLaunch = async () => {
        setLaunching(true)
        try {
            await fetch('/api/campaign/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            })
            const updated = await fetch(`/api/contacts?productId=${productId}`).then(r => r.json())
            const updatedList = Array.isArray(updated) ? updated : []
            setContacts(updatedList)
            setLaunchDone(true)
            // Switch to launched tab and select first launched contact
            setTab('launched')
            const firstLaunched = updatedList.find((c: any) => c.campaignStep > 0)
            if (firstLaunched) setSelectedId(firstLaunched.id)
            setTimeout(() => setLaunchDone(false), 5000)
        } catch { } finally {
            setLaunching(false)
        }
    }

    const handlePersonalizeSave = (nodeId: string, subject: string, body: string) => {
        if (nodeId === 'email1' && selectedContact) {
            setContacts(prev => prev.map(c =>
                c.id === selectedContact.id
                    ? { ...c, generatedSubject: subject, generatedEmail: body }
                    : c
            ))
        }
        setPersonalizeState(null)
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-white z-50">
            {/* Personalize modal */}
            {personalizeState && (
                <PersonalizeModal
                    contact={selectedContact}
                    nodeId={personalizeState.nodeId}
                    subject={personalizeState.subject}
                    body={personalizeState.body}
                    isTemplate={personalizeState.isTemplate}
                    onSave={handlePersonalizeSave}
                    onClose={() => setPersonalizeState(null)}
                />
            )}

            <CampaignTopBar
                product={product}
                productId={productId}
                onClose={() => router.push('/dashboard/campaigns')}
                launchBadgeCount={toLaunch.length}
            />

            {/* Local Queue Processor (Experimental) */}
            <div className="absolute bottom-6 right-6 z-[60]">
                <Button
                    onClick={async () => {
                        const res = await fetch('/api/sequence/worker', { method: 'POST' });
                        if (res.ok) {
                            const data = await res.json();
                            alert(`Processed ${data.processedCount || 0} tasks!`);
                            // Refresh page data
                            router.refresh();
                        }
                    }}
                    className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-900/20 border-t border-slate-700/50 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95"
                >
                    <RefreshCw className="h-4 w-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Local Dev Only</p>
                        <p className="text-[13px] font-bold leading-none">Process Queue Now</p>
                    </div>
                </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ── Left sidebar ── */}
                <div className="w-[220px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setTab('to_launch')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'to_launch' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600')}>
                            To launch ({toLaunch.length})
                        </button>
                        <button onClick={() => setTab('launched')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'launched' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600')}>
                            Launched ({launched.length})
                        </button>
                    </div>

                    {/* Schedule warning */}
                    <div className="mx-2 mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg flex gap-1.5">
                        <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-orange-700 leading-relaxed">No activities are being sent right now — outside your sending schedule.</p>
                    </div>

                    {/* Search */}
                    <div className="px-2 pt-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Selection header */}
                    <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100 mt-1">
                        <input type="checkbox" className="rounded border-slate-300 h-3 w-3" />
                        <span className="text-[11px] text-slate-500">
                            {tabContacts.length} lead{tabContacts.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Contact list */}
                    <div className="flex-1 overflow-y-auto">
                        {tabContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Send className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {tab === 'to_launch' ? 'No leads to launch yet.' : 'No leads launched yet.'}
                                </p>
                            </div>
                        ) : (
                            tabContacts.map(contact => (
                                <ContactCard
                                    key={contact.id}
                                    contact={contact}
                                    selected={selectedId === contact.id}
                                    onSelect={() => setSelectedId(contact.id)}
                                />
                            ))
                        )}
                    </div>

                    {/* Launch button / success state */}
                    {launchDone ? (
                        <div className="p-3 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center gap-2 py-1">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute h-12 w-12 rounded-full bg-emerald-400/20 animate-ping" />
                                    <div className="relative h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-[12px] font-bold text-emerald-700">Campaign launched!</p>
                                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                                    {launched.length} lead{launched.length !== 1 ? 's' : ''} are now active
                                </p>
                            </div>
                        </div>
                    ) : tab === 'to_launch' && toLaunch.length > 0 ? (
                        <div className="p-2 border-t border-slate-100">
                            <Button
                                onClick={handleLaunch}
                                disabled={launching || generatingDrafts}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs gap-1.5 disabled:opacity-70"
                            >
                                {launching ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Launching...</>
                                ) : generatingDrafts ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Preparing...</>
                                ) : (
                                    <><Send className="h-3.5 w-3.5" />Launch {toLaunch.length} leads</>
                                )}
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* ── Right panel: sequence flow ── */}
                <div
                    className="flex-1 overflow-auto relative"
                    style={{
                        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                        backgroundColor: '#f9fafb',
                    }}
                >
                    {/* Draft generation banner */}
                    {generatingDrafts && (
                        <div className="sticky top-4 z-10 mx-auto w-fit flex items-center gap-2.5 px-4 py-2.5 bg-white border border-primary/20 rounded-xl shadow-sm">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
                            <p className="text-[12px] text-slate-600 font-medium">Generating personalized previews...</p>
                            <span className="text-[11px] text-slate-400 ml-1">This may take ~30-60s</span>
                        </div>
                    )}
                    {contacts.length === 0 && !product ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                                <p className="text-xs text-slate-400">Loading campaign...</p>
                            </div>
                        </div>
                    ) : (
                        <SequenceFlow
                            selectedContact={selectedContact}
                            product={product}
                            sequenceStates={sequenceStates}
                            extensionStats={extensionStats}
                            onPersonalize={(nodeId, subject, body, isTemplate) =>
                                setPersonalizeState({ nodeId, subject, body, isTemplate })
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
