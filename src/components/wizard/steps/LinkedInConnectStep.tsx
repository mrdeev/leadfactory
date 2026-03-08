"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Check, Linkedin, RefreshCw, ExternalLink, Chrome, ClipboardPaste } from "lucide-react"

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
}

export function LinkedInConnectStep({ productId }: { productId: string }) {
    const [status, setStatus] = useState<'loading' | 'disconnected' | 'saving' | 'connected'>('loading')
    const [error, setError] = useState<string | null>(null)
    const [connectionMethod, setConnectionMethod] = useState<string | null>(null)
    const [extensionCookie, setExtensionCookie] = useState<string | null>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // Check existing connection on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/linkedin/connect?productId=${productId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.linkedinConnected) {
                        setStatus('connected')
                        setConnectionMethod(data.unipileAccountId ? 'unipile' : 'cookie')
                        return
                    }
                }
            } catch { }
            setStatus('disconnected')
        }
        checkStatus()
    }, [productId])

    // Poll for extension-synced cookie when in disconnected state
    useEffect(() => {
        if (status !== 'disconnected') return

        const poll = async () => {
            try {
                const res = await fetch('/api/linkedin-sessions')
                if (res.ok) {
                    const sessions = await res.json()
                    // Find the most recent valid session
                    const valid = sessions.find((s: any) => s.is_valid)
                    if (valid) {
                        // Fetch the full session with cookie
                        const fullRes = await fetch(`/api/linkedin-sessions/${valid.user_id}`)
                        if (fullRes.ok) {
                            const full = await fullRes.json()
                            const liAt = full.li_at || full.cookie
                            if (liAt) {
                                setExtensionCookie(liAt)
                                if (pollRef.current) clearInterval(pollRef.current)
                            }
                        }
                    }
                }
            } catch { }
        }

        poll() // Check immediately
        pollRef.current = setInterval(poll, 3_000) // Then every 3s

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [status])

    const submitCookie = async (liAtValue: string) => {
        if (!liAtValue.trim()) {
            setError('No cookie value found')
            return
        }

        setStatus('saving')
        setError(null)

        try {
            const res = await fetch('/api/linkedin/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, liAtCookie: liAtValue.trim() }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to save LinkedIn session')
            }

            const data = await res.json()
            setConnectionMethod(data.unipileAccountId ? 'unipile' : 'cookie')
            setStatus('connected')
        } catch (err: any) {
            setError(err.message)
            setStatus('disconnected')
        }
    }

    const handleHostedAuth = async () => {
        setStatus('saving')
        setError(null)
        try {
            // Fetch the user ID to pass to the backend for the SaaS flow
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const redirectUrl = window.location.href;
            const res = await fetch('/api/linkedin/hosted-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, redirectUrl, userId }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to generate Hosted Auth link')
            }

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err: any) {
            setError(err.message)
            setStatus('disconnected')
        }
    }

    if (status === 'loading') {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Connect LinkedIn</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Connect your LinkedIn account to enable automated connection requests and messaging.
                </p>
            </div>

            {/* ── Connected state ──────────────────────────────────── */}
            {status === 'connected' && (
                <div className="border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-8 bg-white shadow-sm min-h-[350px]">
                    <div className="h-24 w-24 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-inner">
                        <Check className="h-12 w-12 text-emerald-600" />
                    </div>
                    <div className="max-w-md space-y-3">
                        <h3 className="text-xl font-bold text-slate-900">LinkedIn Connected!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your LinkedIn session is saved. The AI agent can now send personalized connection requests and messages on your behalf.
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {connectionMethod === 'unipile' ? 'ACTIVE: Unipile API Automation' : 'ACTIVE: LinkedIn Automation Enabled'}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => { setStatus('disconnected'); setExtensionCookie(null); setError(null) }}
                            className="text-slate-500 border-slate-200 hover:bg-slate-50 text-xs"
                        >
                            <RefreshCw className="h-3 w-3 mr-2" /> Reconnect
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Saving state ────────────────────────────────────── */}
            {status === 'saving' && (
                <div className="border border-primary/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 bg-primary/10 shadow-sm min-h-[350px]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Connecting to Unipile...</h3>
                        <p className="text-sm text-slate-500">Establishing a secure API connection. This takes a few seconds.</p>
                    </div>
                </div>
            )}

            {/* ── Extension mode ──────────────────────────────────── */}
            {status === 'disconnected' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="px-8 pt-8 pb-6 space-y-6">
                        {!extensionCookie ? (
                            <>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
                                        <Chrome className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="max-w-sm space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900">Connect via Extension</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Install the Lead Factory Chrome extension, then visit LinkedIn. We'll securely detect and connect your account automatically.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3 text-primary">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">Waiting for extension to sync session...</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100">
                                        <Check className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <div className="max-w-sm space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900">Account Detected!</h3>
                                        <p className="text-sm text-slate-500">
                                            Your LinkedIn session was securely captured. Click below to finalize the connection.
                                        </p>
                                    </div>
                                </div>

                                <br></br>

                                <div className="flex justify-center">
                                    <Button
                                        size="lg"
                                        onClick={() => submitCookie(extensionCookie)}
                                        className="bg-[#0A66C2] hover:bg-[#004182] text-white shadow-lg h-12 px-8 font-bold rounded-xl"
                                    >
                                        <Linkedin className="mr-2 h-5 w-5" /> Activate LinkedIn Automation
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* ── Hosted Auth Fallback ──────────────────────────────── */}
                        <div className="mt-8 flex flex-col items-center border-t border-slate-100 pt-6">
                            <p className="text-sm text-slate-500 mb-3">Install the extension for best reliability. Alternatively:</p>
                            <Button
                                variant="outline"
                                onClick={handleHostedAuth}
                                className="w-full max-w-sm border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" /> Connect via Unipile Window
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Error display ────────────────────────────────────── */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    )
}
