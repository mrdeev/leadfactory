"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    Mail, Eye, UserPlus, MessageCircle, X,
    ZoomIn, ZoomOut, Star, Settings, MoreHorizontal,
    AlertCircle, Clock, ChevronRight, Info, ArrowUpDown,
    Link2, ToggleLeft, MessageSquare, Loader2, CheckCircle2,
    ShieldCheck, Check, Save, Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { db, type SequenceNode } from "@/lib/db"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CampaignTopBar } from "@/components/campaign/CampaignTopBar"

// ─── Types ────────────────────────────────────────────────────────────────
type NodeType =
    | 'start'
    | 'email'
    | 'linkedin_visit'
    | 'linkedin_invite'
    | 'linkedin_chat'
    | 'condition'
    | 'end'

interface FlowNode {
    id: string
    type: NodeType
    label: string
    sublabel?: string
    isError?: boolean
}

interface BranchNode extends FlowNode {
    waitDays: number
}

// ─── Default Sequence Data ────────────────────────────────────────────────
const DEFAULT_FLOW_NODES: SequenceNode[] = [
    { id: 'email1', type: 'email', label: 'Email', waitBeforeDays: 0, nextNodeId: 'visit' },
    { id: 'visit', type: 'linkedin_visit', label: 'Visit profile', waitBeforeDays: 1, nextNodeId: 'invite' },
    { id: 'invite', type: 'linkedin_invite', label: 'Invitation', waitBeforeDays: 1, nextNodeId: 'condition' },
    { id: 'condition', type: 'condition', label: 'Accepted invite within 5 days', waitBeforeDays: 5, yesNodeId: 'chat_yes1', noNodeId: 'email_no1' },
    { id: 'chat_yes1', type: 'linkedin_chat', label: 'Chat message', waitBeforeDays: 1, nextNodeId: 'email_yes' },
    { id: 'email_yes', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'chat_yes2' },
    { id: 'chat_yes2', type: 'linkedin_chat', label: 'Chat message', waitBeforeDays: 3, nextNodeId: 'email_final' },
    { id: 'email_no1', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'email_no2' },
    { id: 'email_no2', type: 'email', label: 'Email', waitBeforeDays: 1, nextNodeId: 'email_no3' },
    { id: 'email_no3', type: 'email', label: 'Email', waitBeforeDays: 3, nextNodeId: 'email_final' },
    { id: 'email_final', type: 'email', label: 'Email', waitBeforeDays: 5, nextNodeId: 'end' },
    { id: 'end', type: 'end', label: 'End of sequence', waitBeforeDays: 0 },
]

// Map node IDs to their UI sublabels
const NODE_SUB_LABELS: Record<string, string> = {
    email1: 'Opening touch — AI generated',
    visit: 'Visit profile on LinkedIn',
    invite: 'Send on LinkedIn',
    chat_yes1: 'Send on LinkedIn',
    email_yes: 'LinkedIn follow-up — AI generated',
    chat_yes2: 'Send on LinkedIn',
    email_no1: 'Follow-up #1 — AI generated',
    email_no2: 'Value add — AI generated',
    email_no3: 'Break-up — AI generated',
    email_final: 'Final touch — AI generated',
}

// Maps each email node to the campaign sequence purpose
const EMAIL_PURPOSES: Record<string, string> = {
    email1: 'initial',
    email_yes: 'follow_up',
    email_no1: 'follow_up',
    email_no2: 'follow_up',
    email_no3: 'breakup',
    email_final: 'breakup',
}

// ─── Node Icon Map ─────────────────────────────────────────────────────────
const NODE_ICONS: Partial<Record<NodeType, any>> = {
    email: Mail,
    linkedin_visit: Eye,
    linkedin_invite: UserPlus,
    linkedin_chat: MessageCircle,
    end: CheckCircle2,
}

// ─── Node Style Config ─────────────────────────────────────────────────────
function getNodeStyle(type: NodeType, isSelected: boolean, isError?: boolean) {
    if (isSelected) {
        // All selected nodes get blue highlight
        return {
            wrapper: 'border-[1.5px] border-primary bg-primary/5 shadow-md shadow-primary/20',
            iconBg: type === 'email' ? 'bg-primary/20' :
                ['linkedin_visit', 'linkedin_invite', 'linkedin_chat'].includes(type) ? 'bg-[#0A66C2]/15' : 'bg-primary/20',
            iconColor: ['linkedin_visit', 'linkedin_invite', 'linkedin_chat'].includes(type) ? 'text-[#0A66C2]' :
                type === 'end' ? 'text-emerald-500' : 'text-primary',
            labelColor: 'text-slate-800',
        }
    }
    if (isError) {
        return {
            wrapper: 'border border-[#fca5a5] bg-white hover:border-red-300 hover:shadow-sm',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-400',
            labelColor: 'text-slate-800',
        }
    }
    if (['linkedin_visit', 'linkedin_invite', 'linkedin_chat'].includes(type)) {
        return {
            wrapper: 'border border-[#bfdbfe] bg-white hover:border-[#93c5fd] hover:shadow-sm',
            iconBg: 'bg-[#0A66C2]/10',
            iconColor: 'text-[#0A66C2]',
            labelColor: 'text-slate-800',
        }
    }
    return {
        wrapper: 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        labelColor: 'text-slate-800',
    }
}

// ─── Vertical Connector ────────────────────────────────────────────────────
function Connector({ height = 'h-5' }: { height?: string }) {
    return (
        <div className="flex justify-center">
            <div className={cn("w-px bg-[#cbd5e1]", height)} />
        </div>
    )
}

// ─── Wait Badge ────────────────────────────────────────────────────────────
function WaitBadge({ days, onUpdate }: { days: number; onUpdate?: (val: number) => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [val, setVal] = useState(days)

    if (isEditing) {
        return (
            <div className="flex flex-col items-center">
                <div className="w-px h-3 bg-[#cbd5e1]" />
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/40 bg-white shadow-sm ring-1 ring-primary/20">
                    <input
                        type="number"
                        autoFocus
                        className="w-8 bg-transparent text-[11px] text-center font-bold text-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={val}
                        onChange={(e) => setVal(parseInt(e.target.value) || 0)}
                        onBlur={() => {
                            setIsEditing(false)
                            if (val !== days) onUpdate?.(val)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setIsEditing(false)
                                if (val !== days) onUpdate?.(val)
                            }
                        }}
                    />
                    <span className="text-[10px] text-primary/70 font-bold uppercase pr-1">Days</span>
                </div>
                <div className="w-px h-3 bg-[#cbd5e1]" />
            </div>
        )
    }

    return (
        <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => { setVal(days); setIsEditing(true); }}
        >
            <div className="w-px h-3 bg-[#cbd5e1]" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] text-slate-500 font-medium bg-white border border-slate-200 shadow-sm group-hover:border-primary/40 group-hover:text-primary transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                <Clock className="h-3 w-3 text-slate-400 group-hover:text-primary" />
                {days === 0 ? 'Send immediately' : `Wait ${days} day${days !== 1 ? 's' : ''}`}
            </div>
            <div className="w-px h-3 bg-[#cbd5e1]" />
        </div>
    )
}

// ─── Flow Node Card ────────────────────────────────────────────────────────
function NodeCard({ node, isSelected, onClick, onDelete }: {
    node: FlowNode
    isSelected: boolean
    onClick: () => void
    onDelete?: () => void
}) {
    if (node.type === 'start') {
        return (
            <div className="flex justify-center">
                <div className="px-6 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-500 tracking-wide shadow-sm">
                    Sequence start
                </div>
            </div>
        )
    }

    const Icon = NODE_ICONS[node.type]
    const style = getNodeStyle(node.type, isSelected, node.isError)

    return (
        <div className="flex justify-center group/node relative">
            <button
                onClick={onClick}
                className={cn(
                    "w-[240px] rounded-xl text-left transition-all duration-150 relative",
                    style.wrapper
                )}
            >
                <div className="p-3 flex items-center gap-3">
                    {Icon && (
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", style.iconBg)}>
                            <Icon className={cn("h-[18px] w-[18px]", style.iconColor)} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-semibold leading-tight", style.labelColor)}>{node.label}</p>
                        {node.isError ? (
                            <div className="flex items-center gap-1 mt-[3px]">
                                <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                <p className="text-[11px] text-red-400 font-medium">Error on sender(s)</p>
                            </div>
                        ) : node.sublabel ? (
                            <p className="text-[11px] text-slate-400 mt-[3px]">{node.sublabel}</p>
                        ) : null}
                    </div>
                </div>
            </button>

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover/node:opacity-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm z-10"
                    title="Delete step"
                >
                    <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                </button>
            )}
        </div>
    )
}

// ─── Condition Node ────────────────────────────────────────────────────────
function ConditionNode({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
    const style = isSelected
        ? 'border-[1.5px] border-primary bg-primary/5 shadow-md shadow-primary/20'
        : 'border border-primary/20 bg-white hover:border-primary/40 hover:shadow-sm'

    return (
        <div className="flex justify-center">
            <button
                onClick={onClick}
                className={cn("w-[240px] rounded-xl text-left transition-all duration-150", style)}
            >
                <div className="p-3 flex items-center gap-3">
                    <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? 'bg-primary/20' : 'bg-[#0A66C2]/10'
                    )}>
                        <ArrowUpDown className={cn("h-[18px] w-[18px]", isSelected ? 'text-primary' : 'text-[#0A66C2]')} />
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">Accepted invite within 5 days</p>
                        <div className="flex items-center gap-1 mt-[3px]">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#0A66C2">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <span className="text-[11px] text-slate-400">LinkedIn condition</span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )
}

// ─── Branch Section ─────────────────────────────────────────────────────────
function BranchSection({ yesNodes, noNodes, selectedId, onSelect, onDeleteNode, onUpdateWait }: {
    yesNodes: SequenceNode[]
    noNodes: SequenceNode[]
    selectedId: string | null
    onSelect: (id: string) => void
    onDeleteNode?: (nodeId: string) => void
    onUpdateWait?: (nodeId: string, days: number) => void
}) {
    return (
        <div className="relative flex flex-col items-center">
            {/* Top T-connector */}
            <div className="relative w-[520px] h-8 flex-shrink-0">
                <div className="absolute left-1/2 top-0 w-px h-3 bg-[#cbd5e1] -translate-x-1/2" />
                <div className="absolute left-[calc(25%+0.5px)] right-[calc(25%+0.5px)] top-3 h-px bg-[#cbd5e1]" />
                <div className="absolute left-1/4 top-3 w-px h-5 bg-[#cbd5e1] -translate-x-1/2" />
                <div className="absolute right-1/4 top-3 w-px h-5 bg-[#cbd5e1] translate-x-1/2" />
            </div>

            {/* Branch columns */}
            <div className="flex w-[520px]">
                {/* YES branch */}
                <div className="flex-1 flex flex-col items-center border-r border-slate-200/70 pb-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                        Yes
                    </span>
                    {yesNodes.map((node) => (
                        <div key={node.id} className="flex flex-col items-center w-full">
                            <WaitBadge days={node.waitBeforeDays} onUpdate={(val) => onUpdateWait?.(node.id, val)} />
                            <NodeCard
                                node={node as any}
                                isSelected={selectedId === node.id}
                                onClick={() => onSelect(node.id)}
                                onDelete={() => onDeleteNode?.(node.id)}
                            />
                        </div>
                    ))}
                    <div className="w-px flex-1 min-h-[20px] bg-[#cbd5e1] mt-3" />
                </div>

                {/* NO branch */}
                <div className="flex-1 flex flex-col items-center pb-2">
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                        No
                    </span>
                    {noNodes.map((node) => (
                        <div key={node.id} className="flex flex-col items-center w-full">
                            <WaitBadge days={node.waitBeforeDays} onUpdate={(val) => onUpdateWait?.(node.id, val)} />
                            <NodeCard
                                node={node as any}
                                isSelected={selectedId === node.id}
                                onClick={() => onSelect(node.id)}
                                onDelete={() => onDeleteNode?.(node.id)}
                            />
                        </div>
                    ))}
                    <div className="w-px flex-1 min-h-[20px] bg-[#cbd5e1] mt-3" />
                </div>
            </div>

            {/* Bottom T-connector — merge */}
            <div className="relative w-[520px] h-8 flex-shrink-0">
                <div className="absolute left-1/4 top-0 w-px h-3 bg-[#cbd5e1] -translate-x-1/2" />
                <div className="absolute right-1/4 top-0 w-px h-3 bg-[#cbd5e1] translate-x-1/2" />
                <div className="absolute left-[calc(25%+0.5px)] right-[calc(25%+0.5px)] top-3 h-px bg-[#cbd5e1]" />
                <div className="absolute left-1/2 top-3 w-px h-5 bg-[#cbd5e1] -translate-x-1/2" />
            </div>
        </div>
    )
}

// ─── LinkedIn Connect Modal ─────────────────────────────────────────────────
function LinkedInConnectModal({ product, productId, onClose, onSuccess }: {
    product: any
    productId: string
    onClose: () => void
    onSuccess: (data: { extensionToken?: string, linkedinAccountName?: string, extensionConnected?: boolean }) => void
}) {
    const [mode, setMode] = useState<'extension' | 'cookie'>('extension')
    const [cookie, setCookie] = useState('')
    const [accountName, setAccountName] = useState(product?.linkedinAccountName || '')
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [extensionToken, setExtensionToken] = useState<string | null>(product?.extensionToken || null)
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false)

    useEffect(() => {
        // Look for the extension signal
        const checker = (event: MessageEvent) => {
            if (event.data?.type === 'LF_EXTENSION_READY') {
                setIsExtensionInstalled(true)
            }
        };
        window.addEventListener('message', checker);
        // Also ping it just in case it missed the load event
        window.postMessage({ type: 'LF_EXTENSION_CHECK' }, '*');

        return () => window.removeEventListener('message', checker);
    }, []);

    const handleOneClickConnect = () => {
        setIsConnecting(true);
        setError(null);

        // Request session from extension
        window.postMessage({ type: 'LF_REQUEST_LINKEDIN_SESSION' }, '*');

        // Set up one-time listener for the response
        const handler = async (event: MessageEvent) => {
            if (event.data?.type === 'LF_LINKEDIN_SESSION_RESPONSE') {
                window.removeEventListener('message', handler);
                if (event.data.success && event.data.cookie) {
                    try {
                        const res = await fetch('/api/linkedin/connect', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                productId,
                                liAtCookie: event.data.cookie,
                                accountName: event.data.accountName || 'LinkedIn Account'
                            }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'Connection failed')
                        onSuccess({
                            linkedinAccountName: event.data.accountName || 'LinkedIn Account',
                            extensionToken: extensionToken || undefined
                        })
                    } catch (err: any) {
                        setError(err.message)
                    } finally {
                        setIsConnecting(false)
                    }
                } else {
                    setError(event.data.error || 'Could not retrieve LinkedIn session. Are you logged in to LinkedIn?')
                    setIsConnecting(false)
                }
            }
        };
        window.addEventListener('message', handler);

        // Timeout if no response
        setTimeout(() => {
            window.removeEventListener('message', handler);
            if (isConnecting) {
                setIsConnecting(false);
                setError('Extension not responding. Please ensure it is installed and try again.');
            }
        }, 5000);
    }

    const handleConnectCookie = async () => {
        if (!cookie.trim()) { setError('Please paste your li_at cookie value'); return }
        setIsConnecting(true); setError(null)
        try {
            const res = await fetch('/api/linkedin/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, liAtCookie: cookie.trim(), accountName: accountName.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Connection failed')
            onSuccess({ linkedinAccountName: accountName.trim() || 'LinkedIn Account' })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleGenerateExtensionToken = async () => {
        setIsConnecting(true); setError(null)
        try {
            const res = await fetch('/api/linkedin/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, mode: 'extension' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate token')
            setExtensionToken(data.extensionToken)
            onSuccess({ extensionToken: data.extensionToken })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-[#0A66C2] flex items-center justify-center shadow-lg shadow-blue-200">
                            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </div>
                        <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Connect LinkedIn</h3>
                        <p className="text-sm text-slate-500 mt-1">Choose your preferred automation method</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 mx-6 mt-6 rounded-xl">
                    <button
                        onClick={() => setMode('extension')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            mode === 'extension' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Browser Extension
                    </button>
                    <button
                        onClick={() => setMode('cookie')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            mode === 'cookie' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Session Cookie
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {mode === 'extension' ? (
                        <div className="space-y-5">
                            {/* Step 1: Install */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="h-10 w-10 flex-shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                    <div className="text-xl">1</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[13px] font-bold text-slate-900">Download Extension</h4>
                                    <p className="text-[11px] text-slate-500">Required for automation</p>
                                </div>
                                {isExtensionInstalled ? (
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Installed
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/10">
                                        Get Extension
                                    </Button>
                                )}
                            </div>

                            {/* Step 2: Link */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="h-10 w-10 flex-shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                    <div className="text-xl">2</div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[13px] font-bold text-slate-900">Link LinkedIn Account</h4>
                                    <p className="text-[11px] text-slate-500">One-click secure connection</p>
                                </div>
                                <Button
                                    onClick={handleOneClickConnect}
                                    disabled={isConnecting || !isExtensionInstalled}
                                    className="h-10 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-bold text-[12px] shadow-md shadow-blue-100"
                                >
                                    {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        <div className="flex items-center gap-2">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                            Connect
                                        </div>
                                    )}
                                </Button>
                            </div>

                            <div className="divider mx-4" />

                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <ShieldCheck className="h-12 w-12 text-primary" />
                                </div>
                                <p className="text-[12px] text-primary font-bold mb-1">Advanced Setup (Manual)</p>
                                <p className="text-[11px] text-primary/80 mb-3 leading-relaxed">If one-click doesn't work, manually configure the extension using the values below.</p>

                                {extensionToken ? (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white/50 backdrop-blur-sm border border-primary/20 px-3 py-2 rounded-lg">
                                                <Label className="text-[9px] font-bold text-primary/70 uppercase block mb-0.5">Product ID</Label>
                                                <code className="text-xs font-mono text-primary">{productId}</code>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/70" onClick={() => {
                                                navigator.clipboard.writeText(productId);
                                                alert("Product ID copied!");
                                            }}>
                                                <Save className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white/50 backdrop-blur-sm border border-primary/20 px-3 py-2 rounded-lg">
                                                <Label className="text-[9px] font-bold text-primary/70 uppercase block mb-0.5">Extension Token</Label>
                                                <code className="text-xs font-mono text-primary">{extensionToken}</code>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/70" onClick={() => {
                                                navigator.clipboard.writeText(extensionToken);
                                                alert("Token copied!");
                                            }}>
                                                <Save className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleGenerateExtensionToken}
                                        disabled={isConnecting}
                                        className="w-full bg-white text-primary hover:bg-primary/5 border border-primary/30 h-10 rounded-xl font-bold text-[12px] transition-all"
                                    >
                                        {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                                        Generate Setup Token
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-[12px] text-amber-700 font-bold mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    How to find your li_at cookie:
                                </p>
                                <ol className="text-[11px] text-amber-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                                    <li>Log in to LinkedIn</li>
                                    <li>Open DevTools (F12) → Application → Cookies</li>
                                    <li>Copy the value of the <span className="font-mono bg-amber-100 px-1 rounded">li_at</span> cookie</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Account name</label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={e => setAccountName(e.target.value)}
                                        placeholder="e.g. John Smith"
                                        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0A66C2] focus:ring-4 focus:ring-blue-50 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">li_at cookie value *</label>
                                    <textarea
                                        value={cookie}
                                        onChange={e => setCookie(e.target.value)}
                                        placeholder="Paste cookie value..."
                                        rows={3}
                                        className="w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[#0A66C2] focus:ring-4 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleConnectCookie}
                                disabled={isConnecting || !cookie.trim()}
                                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white h-12 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                {isConnecting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Connect via Cookie'}
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-[12px] bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 text-center">
                    <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Node Config Panel (400px) ─────────────────────────────────────────────
function NodeConfigPanel({ nodeId, nodes, product, onClose, onConnectLinkedin }: {
    nodeId: string
    nodes: SequenceNode[]
    product: any
    onClose: () => void
    onConnectLinkedin: () => void
}) {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return null

    const sublabel = NODE_SUB_LABELS[nodeId]

    const isLinkedIn = ['linkedin_visit', 'linkedin_invite', 'linkedin_chat'].includes(node.type)
    const isEmail = node.type === 'email'
    const isCondition = node.type === 'condition'
    const Icon = NODE_ICONS[node.type]

    // Find the matching AI email template from the product's campaign sequence
    const emailPurpose = EMAIL_PURPOSES[nodeId]
    const emailStep = isEmail
        ? product?.campaignSequence?.emails?.find((e: any) => e.purpose === emailPurpose)
        : null

    return (
        <div className="w-[400px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            isLinkedIn ? 'bg-[#0A66C2]/10' : isEmail ? 'bg-slate-100' : 'bg-slate-100'
                        )}>
                            <Icon className={cn(
                                "h-4 w-4",
                                isLinkedIn ? 'text-[#0A66C2]' : 'text-slate-500'
                            )} />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-slate-900">{node.label}</p>
                        <p className="text-[11px] text-slate-400">{sublabel || node.type.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* LinkedIn node config */}
                {isLinkedIn && (
                    <>
                        {node.type === 'linkedin_visit' && (
                            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
                                <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-primary leading-relaxed">
                                    Visiting a LinkedIn profile before sending an invitation increases acceptance rates by up to 40%.
                                </p>
                            </div>
                        )}

                        {node.type === 'linkedin_invite' && (
                            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-amber-700 leading-relaxed">
                                    LinkedIn limits connection invitations. Ensure your account hasn't hit its weekly limit.
                                </p>
                            </div>
                        )}

                        {node.type === 'linkedin_chat' && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
                                <Info className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-emerald-700 leading-relaxed">
                                    This message is sent only after the connection is accepted. Keep it conversational.
                                </p>
                            </div>
                        )}

                        {/* LinkedIn account */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                {node.type === 'linkedin_visit'
                                    ? 'LinkedIn account used to visit profile'
                                    : node.type === 'linkedin_invite'
                                        ? 'LinkedIn account used to send invitation'
                                        : 'LinkedIn account used to send messages'}
                            </label>

                            {product?.extensionConnected ? (
                                /* Extension Connected */
                                <div className="w-full border border-emerald-200 bg-emerald-50 rounded-xl px-3.5 py-3 flex flex-col gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900 font-bold truncate">Chrome Extension</p>
                                            <p className="text-[11px] text-emerald-600 font-medium">Fully Connected & Active</p>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="pt-2 border-t border-emerald-200/50">
                                        <p className="text-[12px] text-emerald-800 leading-relaxed">
                                            The extension is actively polling for tasks. Keep a LinkedIn tab open to ensure automation runs smoothly.
                                        </p>
                                    </div>
                                </div>
                            ) : product?.linkedinConnected ? (
                                /* Legacy Cookie Connected */
                                <div className="space-y-3">
                                    <div className="w-full border border-primary/30 bg-primary/5 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-[10px] font-bold">
                                                {(product.linkedinAccountName || 'LI')
                                                    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-700 font-medium flex-1">
                                            {product.linkedinAccountName || 'LinkedIn Account'}
                                        </span>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    </div>
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                        <p className="text-[11px] text-primary font-semibold">Tip: Upgrade to Extension</p>
                                        <p className="text-[10px] text-primary/80 mt-0.5 leading-tight">
                                            For 10x more reliability, connect via our Chrome extension instead of cookies.
                                        </p>
                                        <Button onClick={onConnectLinkedin} variant="link" className="h-auto p-0 text-[10px] text-primary font-bold mt-1 underline">
                                            Connect Extension
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Not connected state */
                                <>
                                    <div className="w-full border border-dashed border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-slate-400 flex-1">No account connected</span>
                                    </div>

                                    {product?.extensionToken ? (
                                        <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Extension Token</Label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-[11px] font-mono bg-white border border-slate-200 py-1.5 rounded-lg text-[#0A66C2] px-2 truncate">
                                                    {product.extensionToken}
                                                </code>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                                    navigator.clipboard.writeText(product.extensionToken);
                                                    alert("Token copied!");
                                                }}>
                                                    <Save className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                                                Paste in extension settings to connect
                                            </p>
                                        </div>
                                    ) : (
                                        <Button onClick={onConnectLinkedin} className="w-full mt-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white h-11 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                                            <Rocket className="h-4 w-4 mr-2" />
                                            Connect LinkedIn
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Force specific sender toggle */}
                        <div className="flex items-center justify-between py-3 border-t border-slate-100">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Force a specific sender</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Override default LinkedIn account for this step</p>
                            </div>
                            <button className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors flex items-center px-0.5 cursor-pointer">
                                <div className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
                            </button>
                        </div>

                        {node.type === 'linkedin_invite' && (
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Invitation note (optional)
                                </label>
                                <textarea
                                    className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-slate-400 text-slate-700 placeholder-slate-300"
                                    rows={3}
                                    placeholder="Hi {{firstName}}, I came across your profile and thought it would be great to connect..."
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">Leave blank to send without a note</p>
                            </div>
                        )}

                        {node.type === 'linkedin_chat' && (
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Chat message *
                                </label>
                                <textarea
                                    className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-slate-400 text-slate-700 placeholder-slate-300"
                                    rows={4}
                                    placeholder="Hi {{firstName}}, thanks for connecting! I wanted to reach out because..."
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">Use {'{{firstName}}'}, {'{{companyName}}'} for personalization</p>
                            </div>
                        )}
                    </>
                )}

                {/* Email node config */}
                {isEmail && (
                    <>
                        {/* Only show sender error if not configured */}
                        {!product?.senderEmail && (
                            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[12px] font-semibold text-red-700">Email sender not configured</p>
                                    <p className="text-[11px] text-red-500 mt-0.5 leading-relaxed">
                                        Configure your email sender in Email Settings to enable this step.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Sender email *
                            </label>
                            <button className="w-full text-left border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 hover:border-slate-300 bg-white">
                                <div className="flex items-center gap-2.5">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-500">
                                        {product?.senderEmail || 'No sender configured'}
                                    </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                            </button>
                        </div>

                        {/* AI-generated email template */}
                        {emailStep ? (
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Email Template</p>

                                <div>
                                    <p className="text-[11px] text-slate-400 mb-1.5">Subject approach</p>
                                    <p className="text-[12px] text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed italic">
                                        "{emailStep.subjectApproach}"
                                    </p>
                                </div>

                                {emailStep.keyMessages?.length > 0 && (
                                    <div>
                                        <p className="text-[11px] text-slate-400 mb-1.5">Key messages</p>
                                        <div className="space-y-1.5">
                                            {emailStep.keyMessages.map((msg: string, i: number) => (
                                                <div key={i} className="text-[12px] text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed flex gap-2">
                                                    <span className="text-slate-300 font-bold flex-shrink-0">{i + 1}.</span>
                                                    {msg}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[11px] text-slate-400 mb-1.5">Tone</p>
                                        <p className="text-[12px] text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">{emailStep.tone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 mb-1.5">CTA</p>
                                        <p className="text-[12px] text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">{emailStep.cta}</p>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                                    Each email is personalized per contact at send time using their LinkedIn profile and company data.
                                </p>
                            </div>
                        ) : (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">About this step</p>
                                <p className="text-[12px] text-slate-500 leading-relaxed">
                                    Each email is AI-generated at send time using the contact's LinkedIn profile and company data. Content adapts to each individual prospect automatically.
                                </p>
                            </div>
                        )}

                        <Link href={`/dashboard/${product?.id}/setup`}>
                            <Button variant="outline" className="w-full border-slate-200 text-sm h-9 gap-2">
                                <Settings className="h-4 w-4" />
                                Configure Email Settings
                            </Button>
                        </Link>
                    </>
                )}


                {/* Condition node config */}
                {isCondition && (
                    <>
                        <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
                            <ArrowUpDown className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-[12px] text-primary leading-relaxed">
                                This step checks if the prospect accepted your LinkedIn invitation and routes them down the appropriate sequence branch.
                            </p>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Check window
                            </label>
                            <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
                                <span className="text-sm text-slate-700 font-semibold">5 days</span>
                                <span className="text-sm text-slate-400 flex-1">after sending invitation</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="h-5 w-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-white text-[9px] font-bold">✓</span>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-emerald-700">Yes — Accepted</p>
                                    <p className="text-[11px] text-emerald-600">Follow LinkedIn chat sequence</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                                <div className="h-5 w-5 rounded-full bg-red-400 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-white text-[9px] font-bold">✗</span>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-red-600">No — Not accepted</p>
                                    <p className="text-[11px] text-red-500">Continue with email follow-ups</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}



// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CampaignSequencePage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params)
    const router = useRouter()

    const [product, setProduct] = useState<any>(null)
    const [nodes, setNodes] = useState<SequenceNode[]>([])
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>('visit')
    const [showLinkedinModal, setShowLinkedinModal] = useState(false)

    useEffect(() => {
        fetch(`/api/products/${productId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                setProduct(data)
                if (data?.campaignSequence?.nodes?.length) {
                    setNodes(data.campaignSequence.nodes)
                } else {
                    setNodes(DEFAULT_FLOW_NODES)
                }
            })
            .catch(() => { })
    }, [productId])

    const saveNodes = async (updated: SequenceNode[]) => {
        setNodes(updated)
        try {
            await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignSequence: {
                        ...product?.campaignSequence,
                        nodes: updated
                    }
                })
            })
        } catch (e) {
            console.error('Failed to save sequence:', e)
        }
    }

    const updateWait = (nodeId: string, days: number) => {
        const updated = nodes.map(n => n.id === nodeId ? { ...n, waitBeforeDays: days } : n)
        saveNodes(updated)
    }

    const deleteNode = (nodeId: string) => {
        const nodeToDelete = nodes.find(n => n.id === nodeId)
        if (!nodeToDelete) return

        // Stitch parent and child
        const parent = nodes.find(n => n.nextNodeId === nodeId || n.yesNodeId === nodeId || n.noNodeId === nodeId)

        let updated = nodes.filter(n => n.id !== nodeId)

        if (parent) {
            updated = updated.map(n => {
                if (n.id === parent.id) {
                    if (n.nextNodeId === nodeId) return { ...n, nextNodeId: nodeToDelete.nextNodeId || 'end' }
                    if (n.yesNodeId === nodeId) return { ...n, yesNodeId: nodeToDelete.nextNodeId || 'end' }
                    if (n.noNodeId === nodeId) return { ...n, noNodeId: nodeToDelete.nextNodeId || 'end' }
                }
                return n
            })
        } else {
            // If deleting the first node, we'd need to update the campaign "entry point"
            // For now, this sequence always starts at "email1", so deleting it is not recommended 
            // unless we update getLinearPath. 
            // Let's just prevent deleting the entry node for now to stay safe.
            if (nodeId === 'email1') return
        }

        if (selectedNodeId === nodeId) setSelectedNodeId(null)
        saveNodes(updated)
    }

    const handleNodeSelect = (id: string) => {
        setSelectedNodeId(prev => prev === id ? null : id)
    }

    // Helper to get linear sequence from nodes state
    const getLinearPath = (startId: string | undefined, stopTypes: string[] = ['condition', 'end'], stopIds: string[] = ['email_final']) => {
        let result: SequenceNode[] = []
        if (!startId) return result
        let curr = nodes.find(n => n.id === startId)
        while (curr && !stopTypes.includes(curr.type) && !stopIds.includes(curr.id)) {
            result.push(curr)
            const nextId = curr.nextNodeId
            if (!nextId) break
            curr = nodes.find(n => n.id === nextId)
        }
        return result
    }

    const mainNodes = getLinearPath('email1')
    const conditionNode = nodes.find(n => n.type === 'condition')
    const yesNodes = getLinearPath(conditionNode?.yesNodeId)
    const noNodes = getLinearPath(conditionNode?.noNodeId)
    const convergenceNodes = getLinearPath('email_final', ['end'], [])

    const handleLinkedinSuccess = (data: { extensionToken?: string, linkedinAccountName?: string, extensionConnected?: boolean }) => {
        setProduct((prev: any) => ({
            ...prev,
            ...data,
            linkedinConnected: !!(data.linkedinAccountName || prev.linkedinConnected),
            linkedinAccountName: data.linkedinAccountName || prev.linkedinAccountName,
            extensionToken: data.extensionToken || prev.extensionToken,
            extensionConnected: data.extensionConnected !== undefined ? data.extensionConnected : prev.extensionConnected
        }))
        if (data.linkedinAccountName) setShowLinkedinModal(false)
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-white z-50">
            {/* LinkedIn connect modal */}
            {showLinkedinModal && (
                <LinkedInConnectModal
                    product={product}
                    productId={productId}
                    onClose={() => setShowLinkedinModal(false)}
                    onSuccess={handleLinkedinSuccess}
                />
            )}

            {/* Top bar */}
            <CampaignTopBar
                product={product}
                productId={productId}
                onClose={() => router.push('/dashboard/campaigns')}
                onConnectLinkedin={() => setShowLinkedinModal(true)}
            />

            {/* Info banner */}
            <div className="bg-[#1e293b] text-white px-5 py-2.5 flex items-center gap-3 flex-shrink-0">
                <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Info className="h-3 w-3 text-slate-300" />
                </div>
                <p className="text-[11.5px] text-slate-300 leading-tight flex-1">
                    This campaign was generated by AI and follows a specific logical structure. It combines email outreach with LinkedIn automation for a multi-channel approach. LinkedIn steps require your account to be connected.
                </p>
                {!product?.linkedinConnected && !product?.extensionConnected && (
                    <button onClick={() => setShowLinkedinModal(true)} className="flex-shrink-0 text-[11px] text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap">
                        Connect LinkedIn
                    </button>
                )}
                {product?.extensionConnected && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium flex-shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Extension Connected
                    </div>
                )}
                {product?.linkedinConnected && !product?.extensionConnected && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium flex-shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {product.linkedinAccountName || 'LinkedIn connected'}
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Canvas */}
                <div
                    className="flex-1 overflow-auto relative"
                    style={{
                        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                        backgroundColor: '#f9fafb',
                    }}
                >
                    {/* Sequence flow */}
                    <div className="min-h-full py-14 flex justify-center">
                        <div className="flex flex-col items-center">

                            {/* Start node */}
                            <NodeCard
                                node={{ id: 'start', type: 'start', label: 'Sequence start' }}
                                isSelected={false}
                                onClick={() => { }}
                            />

                            {/* Main nodes */}
                            {mainNodes.map((node) => (
                                <div key={node.id} className="flex flex-col items-center">
                                    <WaitBadge days={node.waitBeforeDays} onUpdate={(val) => updateWait(node.id, val)} />
                                    <NodeCard
                                        node={node as any}
                                        isSelected={selectedNodeId === node.id}
                                        onClick={() => handleNodeSelect(node.id)}
                                        onDelete={() => deleteNode(node.id)}
                                    />
                                </div>
                            ))}

                            {/* Condition node */}
                            {conditionNode && (
                                <div className="flex flex-col items-center">
                                    <WaitBadge days={conditionNode.waitBeforeDays} onUpdate={(val) => updateWait(conditionNode.id, val)} />
                                    <ConditionNode
                                        isSelected={selectedNodeId === conditionNode.id}
                                        onClick={() => handleNodeSelect(conditionNode.id)}
                                    />

                                    {/* Branching */}
                                    <BranchSection
                                        yesNodes={yesNodes as any}
                                        noNodes={noNodes as any}
                                        selectedId={selectedNodeId}
                                        onSelect={handleNodeSelect}
                                        onDeleteNode={deleteNode}
                                        onUpdateWait={updateWait}
                                    />
                                </div>
                            )}

                            {/* Convergence nodes */}
                            {convergenceNodes.map((node) => (
                                <div key={node.id} className="flex flex-col items-center">
                                    <WaitBadge days={node.waitBeforeDays} onUpdate={(val) => updateWait(node.id, val)} />
                                    <NodeCard
                                        node={node as any}
                                        isSelected={selectedNodeId === node.id}
                                        onClick={() => handleNodeSelect(node.id)}
                                        onDelete={() => deleteNode(node.id)}
                                    />
                                </div>
                            ))}

                            {/* End of sequence */}
                            <div className="flex flex-col items-center mt-1">
                                <Connector />
                                <div className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-dashed border-slate-300 bg-white/80 text-[11px] text-slate-400 font-medium">
                                    End of sequence
                                </div>
                            </div>

                            <div className="h-24" />
                        </div>
                    </div>

                    {/* Bottom-right floating controls */}
                    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-center gap-2">
                        {/* Zoom group */}
                        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <button className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                <ZoomIn className="h-3.5 w-3.5" />
                            </button>
                            <button className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                <ZoomOut className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        {/* Chat button */}
                        <button className="h-10 w-10 rounded-full bg-slate-900 hover:bg-black flex items-center justify-center shadow-lg transition-colors">
                            <MessageSquare className="h-4 w-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Config panel */}
                {/* Node Config Panel */}
                <NodeConfigPanel
                    nodeId={selectedNodeId || ''}
                    nodes={nodes}
                    product={product}
                    onClose={() => setSelectedNodeId(null)}
                    onConnectLinkedin={() => setShowLinkedinModal(true)}
                />
            </div>
        </div>
    )
}
