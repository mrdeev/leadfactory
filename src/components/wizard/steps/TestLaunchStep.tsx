"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Rocket, CheckCircle2, Loader2, Sparkles, Mail, Clock,
    RefreshCw, ChevronDown, ChevronUp, Users, Send, MessageSquare, Zap, Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignEmailStep {
    step: number
    subjectApproach: string
    keyMessages: string[]
    cta: string
    tone: string
    delayDays: number
    purpose: 'initial' | 'follow_up' | 'value_add' | 'breakup'
}

interface CampaignSequence {
    id: string
    createdAt: string
    emails: CampaignEmailStep[]
}

const PURPOSE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    initial: { label: 'Initial Outreach', color: 'bg-primary/10 text-primary border-primary/20', icon: Send },
    follow_up: { label: 'Follow-up', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: MessageSquare },
    value_add: { label: 'Value Add', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: Zap },
    breakup: { label: 'Break-up', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Mail },
}

function EmailStepCard({ step, isOpen, onToggle }: {
    step: CampaignEmailStep
    isOpen: boolean
    onToggle: () => void
}) {
    const config = PURPOSE_CONFIG[step.purpose] || PURPOSE_CONFIG.initial
    const Icon = config.icon

    return (
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {step.step}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border", config.color)}>
                            <Icon className="h-2.5 w-2.5 mr-1" />
                            {config.label}
                        </Badge>
                        {step.delayDays === 0 ? (
                            <span className="text-[11px] text-slate-400">Sent on launch</span>
                        ) : (
                            <span className="text-[11px] text-slate-400">
                                <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                                Day {step.delayDays}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-slate-700 truncate">{step.subjectApproach}</p>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
            </button>

            {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-4 bg-slate-50/30">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Approach</p>
                        <p className="text-sm text-slate-700 italic">"{step.subjectApproach}"</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Messages</p>
                        <ul className="space-y-1">
                            {step.keyMessages.map((msg, i) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-6">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Call to Action</p>
                            <p className="text-sm text-slate-700">{step.cta}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tone</p>
                            <p className="text-sm text-slate-700 capitalize">{step.tone}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface PreviewEmail {
    contact: { fullName: string; position: string; orgName: string }
    subject: string
    body: string
}

export function TestLaunchStep({ productId }: { productId: string }) {
    const [sequence, setSequence] = useState<CampaignSequence | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))
    const [contactCount, setContactCount] = useState<number | null>(null)
    const [preview, setPreview] = useState<PreviewEmail | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const [seqRes, contactsRes] = await Promise.all([
                    fetch(`/api/campaign/generate?productId=${productId}`),
                    fetch(`/api/contacts`)
                ])
                if (seqRes.ok) {
                    const data = await seqRes.json()
                    if (data.campaignSequence) setSequence(data.campaignSequence)
                }
                if (contactsRes.ok) {
                    const contacts = await contactsRes.json()
                    const forProduct = Array.isArray(contacts)
                        ? contacts.filter((c: any) => c.productId === productId)
                        : []
                    setContactCount(forProduct.length)
                }
            } catch (err) {
                console.error('Failed to load campaign data:', err)
            }
        }
        load()
    }, [productId])

    const loadPreview = async () => {
        setIsLoadingPreview(true)
        setPreview(null)
        try {
            const res = await fetch(`/api/campaign/preview?productId=${productId}`)
            if (res.ok) setPreview(await res.json())
        } catch { /* silent */ }
        finally { setIsLoadingPreview(false) }
    }

    const generateCampaign = async () => {
        setSequence(null)   // clear immediately so old content never flashes
        setIsGenerating(true)
        setError(null)
        try {
            const res = await fetch('/api/campaign/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, variationSeed: Date.now() }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Generation failed')
            }
            const data = await res.json()
            setSequence(data.campaignSequence)
            setOpenSteps(new Set([1]))
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const toggleStep = (step: number) => {
        setOpenSteps(prev => {
            const next = new Set(prev)
            if (next.has(step)) next.delete(step)
            else next.add(step)
            return next
        })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
                <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Rocket className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Launch Your AI Campaign</h2>
                <p className="text-slate-500 max-w-lg mx-auto text-sm">
                    Generate a personalized multi-email sequence. Each email is tailored using your prospects' LinkedIn activity and company data.
                </p>
            </div>

            {/* Setup summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: CheckCircle2, label: 'Pipeline Set', ok: true },
                    { icon: CheckCircle2, label: 'AI Strategy Ready', ok: true },
                    { icon: Users, label: contactCount !== null ? `${contactCount} Contacts` : 'Contacts', ok: contactCount !== null && contactCount > 0 },
                    { icon: CheckCircle2, label: 'Email Configured', ok: true },
                ].map((item, i) => (
                    <Card key={i} className="p-3 flex items-center gap-2 shadow-none border-slate-100">
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", item.ok ? "text-emerald-500" : "text-slate-300")} />
                        <p className="text-xs font-medium text-slate-700">{item.label}</p>
                    </Card>
                ))}
            </div>

            {/* Campaign sequence */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900">AI Campaign Sequence</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {sequence
                                ? `${sequence.emails.length} emails — personalized per contact using LinkedIn insights`
                                : 'Generate a multi-email campaign tailored to your audience'}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generateCampaign}
                        disabled={isGenerating}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {sequence ? 'Regenerate' : 'Generate Campaign'}
                    </Button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {isGenerating && (
                    <div className="py-12 flex flex-col items-center gap-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-700">Generating your campaign...</p>
                            <p className="text-xs text-slate-400 mt-1">AI is crafting a personalized email strategy</p>
                        </div>
                    </div>
                )}

                {!isGenerating && sequence && (
                    <div className="space-y-2">
                        {sequence.emails.map((step) => (
                            <EmailStepCard
                                key={step.step}
                                step={step}
                                isOpen={openSteps.has(step.step)}
                                onToggle={() => toggleStep(step.step)}
                            />
                        ))}
                        <div className="pt-2 px-1 flex items-center gap-2 text-xs text-slate-400">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Every email is uniquely personalized using each contact's LinkedIn posts and profile at send time</span>
                        </div>
                    </div>
                )}

                {!isGenerating && !sequence && (
                    <button
                        onClick={generateCampaign}
                        className="w-full py-12 flex flex-col items-center gap-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                        <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-700">Click to generate your AI campaign</p>
                            <p className="text-xs text-slate-400 mt-1">Creates a 3-email sequence tailored to your company and audience</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Sample email preview — shows actual AI output for a real contact */}
            {sequence && contactCount && contactCount > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Sample Email Preview</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                See exactly what Email 1 looks like for a real contact using their LinkedIn data
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadPreview}
                            disabled={isLoadingPreview}
                            className="border-slate-200 text-slate-700 text-xs h-8"
                        >
                            {isLoadingPreview
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                            {preview ? 'Regenerate Preview' : 'Generate Preview'}
                        </Button>
                    </div>

                    {isLoadingPreview && (
                        <div className="py-8 flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            <p className="text-xs text-slate-500">Generating email for a real contact...</p>
                        </div>
                    )}

                    {!isLoadingPreview && preview && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                                    {preview.contact.fullName?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{preview.contact.fullName}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {[preview.contact.position, preview.contact.orgName].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                        Email 1 Preview
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                                    <p className="text-sm font-medium text-slate-800">{preview.subject}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Body</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        {preview.body}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-slate-400 text-center px-4">
                Click <strong className="text-slate-600">"Finish & Launch"</strong> below to send Email 1 to all contacts now. Follow-up emails are sent from the Campaigns page when they become due.
            </p>
        </div>
    )
}
