"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Copy, ArrowRight, ExternalLink, Check, Mail, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function AiAutoReplyStep({ productId }: { productId: string }) {
    const params = useParams()

    const [enabled, setEnabled] = useState(false)
    const [forwardingAddress, setForwardingAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const generateAddress = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/ai/auto-reply/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            })
            const data = await res.json()
            if (res.ok) {
                setForwardingAddress(data.forwardingAddress)
            } else {
                setError(data.error || "Failed to generate address")
            }
        } catch (error) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const checkVerification = async () => {
        setVerifying(true)
        setError(null)
        try {
            const res = await fetch('/api/ai/auto-reply/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forwardingAddress })
            })
            const data = await res.json()
            if (res.ok && data.verified) {
                setVerified(true)
            } else {
                setError(data.message || "Verification failed. Did you set up the forward rule?")
            }
        } catch (error) {
            setError("Network error while verifying.")
        } finally {
            setVerifying(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">AI Auto-Reply Email</h2>
                <div className="space-y-4 mt-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Enable AI-powered auto-replies by setting up email forwarding for your incoming messages. This step is optional but highly recommended to ensure 24/7 customer engagement.
                    </p>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3">
                        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-primary leading-relaxed">
                            For better deliverability and to prevent emails from landing in spam, use a professional address like <span className="font-bold">yourname@customdomain.com</span> instead of a personal Gmail account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1: Set Up Email Forwarding */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm space-y-8">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Step 1: Set Up Email Forwarding</h3>
                    <p className="text-sm text-slate-500">Forward your incoming emails to our AI system so it can automatically respond to your customers.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p className="text-xs font-bold uppercase tracking-wider">Important Note</p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            <span className="font-bold">Note:</span> Gmail is shown as an example. We recommend using your company email (e.g., <span className="font-medium text-slate-900">you@yourcompany.com</span>) for better deliverability. Most email providers support forwarding - check your email settings or contact your IT admin.
                        </p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Forward emails to:</label>
                        {!forwardingAddress ? (
                            <Button
                                onClick={generateAddress}
                                disabled={loading}
                                className="w-full bg-slate-900 text-white hover:bg-black font-bold h-12 rounded-xl shadow-lg shadow-slate-200"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Forwarding Address
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Input value={forwardingAddress} readOnly className="font-mono bg-white border-slate-200 h-12 rounded-xl text-center text-slate-900 font-bold" />
                                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(forwardingAddress)} className="bg-white border-slate-200 hover:bg-slate-50 h-12 w-12 rounded-xl shrink-0 transition-all active:scale-95 shadow-sm">
                                    <Copy className="h-5 w-5 text-slate-600" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6">
                    <p className="text-sm font-bold text-slate-900 mb-8">Example: Gmail Forwarding Setup (similar steps apply to other email providers)</p>

                    <div className="space-y-12">
                        {/* Step 1 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">1</div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Open the Forwarding and POP/IMAP panel</p>
                                    <p className="text-sm text-slate-500">Go to Gmail Settings &gt; See all settings &gt; Forwarding and POP/IMAP tab</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">2</div>
                                <p className="text-sm font-bold text-slate-900 mt-1">Click "Add a forwarding address" button</p>
                            </div>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770414539946.png" alt="Gmail Forwarding Settings" className="w-full h-auto" />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">3</div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Enter the forwarding email address</p>
                                    <p className="text-sm text-slate-500">In the input box, enter: <span className="font-mono font-bold text-slate-900">{forwardingAddress || "aisdremail@hottask.com"}</span></p>
                                </div>
                            </div>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm grayscale-[0.2]">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770414884138.jpg" alt="Enter email dialog" className="w-full h-auto" />
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">4</div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Google Verification</p>
                                    <p className="text-sm text-slate-500">Google will ask you to confirm. Click "Proceed".</p>
                                </div>
                            </div>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770415828399.png" alt="Verify it's you" className="w-full h-auto" />
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">5</div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Receive confirmation email</p>
                                    <p className="text-sm text-slate-500">You will receive an email in your inbox from <span className="font-medium text-slate-900">aisupport@hottask.com</span> with the subject starting with "Gmail Forwarding Confirmation"</p>
                                </div>
                            </div>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm grayscale-[0.5]">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770415939770.png" alt="Find confirmation email" className="w-full h-auto" />
                            </div>
                        </div>

                        {/* Step 6 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">6</div>
                                <p className="text-sm font-bold text-slate-900 mt-1">Click the verification link</p>
                            </div>
                            <p className="text-sm text-slate-500 ml-11">Open the email and click the confirmation link to verify.</p>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770416516685.png" alt="Verify code content" className="w-full h-auto" />
                            </div>
                            <div className="ml-11 border-t border-slate-100 pt-6">
                                <Button
                                    variant={verified ? "ghost" : "outline"}
                                    size="lg"
                                    disabled={!forwardingAddress || verifying || verified}
                                    onClick={checkVerification}
                                    className={cn(
                                        "h-12 px-10 font-bold rounded-xl transition-all shadow-sm",
                                        verified ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" : "border-slate-200 text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {verified ? (
                                        <><Check className="mr-2 h-4 w-4" /> Verified</>
                                    ) : (
                                        "Verify Now"
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Step 7 */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-900 shrink-0 border border-slate-200">7</div>
                                <p className="text-sm font-bold text-slate-900 mt-1">Configure forwarding and Save</p>
                            </div>
                            <p className="text-sm text-slate-500 ml-11">Return to the Forwarding and POP/IMAP panel. Set Forwarding to <span className="font-medium text-slate-900">"Forward a copy of incoming mail to {forwardingAddress || "aisdremail@hottask.com"} and keep Gmail's copy in the Inbox"</span>. Click "Save Changes".</p>
                            <div className="ml-11 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <img src="/Users/noormacbook/.gemini/antigravity/brain/dcdcda77-66c1-4e6c-9ef9-72a2e51e7393/media__1770416628231.png" alt="Configure radio and save" className="w-full h-auto" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 ml-11">
                        <a
                            href="https://support.google.com/mail/answer/10957"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-slate-900 flex items-center gap-1.5 hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            gmail forwarding help guide <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Step 2: Configure Auto-Reply Settings */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Step 2: Configure Auto-Reply Settings</h3>
                    {enabled && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
                            <Check className="h-3 w-3" /> Saved
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all">
                    <div className="space-y-1">
                        <p className="font-bold text-slate-900 tracking-tight">Enable Auto-Reply</p>
                        <p className="text-xs text-slate-500">AI will automatically respond to incoming emails based on your company info</p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-emerald-500 scale-125" />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    )
}
