"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, Mail, Server, Copy, ShieldCheck, AlertCircle, RefreshCw, Send, Cloud, Info, Plane, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmailSettingsStep({ productId }: { productId: string }) {
    const [method, setMethod] = useState<"platform" | "ses" | "sendgrid" | "mailgun" | "smtp">("ses")

    // BYOAK = Bring Your Own API Key - users who provide their own email provider credentials
    // These users don't need email verification since they've already verified with their provider
    const isByoak = method !== 'platform'
    const [email, setEmail] = useState("")
    const [senderName, setSenderName] = useState("Product Support")
    const [testEmail, setTestEmail] = useState("")
    const [showDkimTip, setShowDkimTip] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified')

    // Provider Specific Configs
    const [smtpConfig, setSmtpConfig] = useState({ host: "", port: 587, username: "", password: "" })
    const [sesConfig, setSesConfig] = useState({ accessKeyId: "", secretAccessKey: "", region: "us-east-1" })
    const [sendgridConfig, setSendgridConfig] = useState({ apiKey: "" })
    const [mailgunConfig, setMailgunConfig] = useState({ apiKey: "", domain: "", region: "us" as 'us' | 'eu' })

    const [domain, setDomain] = useState("")
    const [dkimRecords, setDkimRecords] = useState<{ name: string, type: string, value: string }[]>([])
    const [isGeneratingDkim, setIsGeneratingDkim] = useState(false)
    const [isVerifyingDkim, setIsVerifyingDkim] = useState(false)
    const [domainAuthStatus, setDomainAuthStatus] = useState<'pending' | 'verified' | 'failed'>('pending')
    const [dkimInstructions, setDkimInstructions] = useState<string>("")
    const [isSaving, setIsSaving] = useState(false)
    const [isSendingTest, setIsSendingTest] = useState(false)

    // Load data
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/products/${productId}`)
                if (res.ok) {
                    const data = await res.json()

                    if (data.sendingMethod) setMethod(data.sendingMethod)
                    if (data.senderName) setSenderName(data.senderName)

                    if (data.emailVerification) {
                        setEmail(data.senderEmail || data.emailVerification.email || "" || data.ceoEmail || "")
                        setVerificationStatus(data.emailVerification.status)
                    } else {
                        setEmail(data.senderEmail || data.ceoEmail || "")
                    }

                    if (data.smtpConfig) setSmtpConfig(data.smtpConfig)
                    if (data.sesConfig) setSesConfig(data.sesConfig)
                    if (data.sendgridConfig) setSendgridConfig(data.sendgridConfig)
                    if (data.mailgunConfig) setMailgunConfig(data.mailgunConfig)

                    if (data.domainAuth) {
                        setDomain(data.domainAuth.domain || "")
                        setDkimRecords(data.domainAuth.dkimRecords || [])
                        setDomainAuthStatus(data.domainAuth.status || 'pending')
                        if (data.domainAuth.instructions) setDkimInstructions(data.domainAuth.instructions)
                    }
                }
            } catch (err) {
                console.error("Failed to load product data", err)
            }
        }
        load()
    }, [productId])

    const handleSaveSettings = async () => {
        setIsSaving(true)
        try {
            const body: any = {
                productId,
                sendingMethod: method,
                senderName,
                senderEmail: email,
            }

            if (method === 'smtp') body.smtpConfig = smtpConfig
            if (method === 'ses') body.sesConfig = sesConfig
            if (method === 'sendgrid') body.sendgridConfig = sendgridConfig
            if (method === 'mailgun') body.mailgunConfig = mailgunConfig

            const res = await fetch('/api/email/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                alert("Settings saved successfully!")
            } else {
                const err = await res.json()
                alert(err.error || "Failed to save settings")
            }
        } catch (error) {
            console.error('Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // ... handlers ...
    const handleSendVerification = async () => {
        setIsVerifying(true)
        try {
            const res = await fetch('/api/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, email }),
            })
            const data = await res.json()
            if (res.ok) {
                setVerificationStatus('pending')
            } else {
                alert(data.error || "Failed to send verification email")
            }
        } catch (error) {
            console.error('Failed to send verification:', error)
            alert("Connection error. Please try again.")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleGenerateDkim = async () => {
        setIsGeneratingDkim(true)
        try {
            const res = await fetch('/api/email/dkim/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, domain }),
            })
            const data = await res.json()
            if (res.ok) {
                setDkimRecords(data.dkimRecords)
                if (data.instructions) setDkimInstructions(data.instructions)
                setDomainAuthStatus('pending')
            } else {
                alert(data.error || "Failed to generate DKIM records")
            }
        } catch (error) {
            console.error('Failed to generate DKIM:', error)
        } finally {
            setIsGeneratingDkim(false)
        }
    }

    const handleVerifyDkim = async () => {
        setIsVerifyingDkim(true)
        try {
            const res = await fetch('/api/email/dkim/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            })
            const data = await res.json()
            if (res.ok) {
                setDomainAuthStatus(data.status)
                if (data.status === 'verified') {
                    alert("Domain verified successfully!")
                } else {
                    alert("Domain not yet verified. DNS records may take time to propagate.")
                }
            }
        } catch (error) {
            console.error('Failed to verify DKIM:', error)
        } finally {
            setIsVerifyingDkim(false)
        }
    }

    // Polling for status
    useEffect(() => {
        if (verificationStatus !== 'pending') return

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/email/verify?productId=${productId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.status === 'verified') {
                        setVerificationStatus('verified')
                        clearInterval(interval)
                    }
                }
            } catch (error) {
                console.error('Polling error:', error)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [verificationStatus, productId])

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Email Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Configure your email sending settings. Choose how you want to send emails.</p>
            </div>

            {/* Email Sending Method */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 text-center uppercase tracking-widest">Select Your Provider</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { id: 'ses', name: 'Amazon SES', icon: ShieldCheck, desc: 'AWS Infrastructure' },
                        { id: 'sendgrid', name: 'SendGrid', icon: Send, desc: 'Twilio SendGrid' },
                        { id: 'mailgun', name: 'Mailgun', icon: Plane, desc: 'Sinch Mailgun' },
                        { id: 'smtp', name: 'Custom SMTP', icon: Server, desc: 'Generic Server' },
                    ].map((provider) => (
                        <Card
                            key={provider.id}
                            className={cn(
                                "p-4 cursor-pointer border transition-all flex flex-col items-center justify-center gap-2 text-center rounded-xl hover:shadow-md",
                                method === provider.id ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 opacity-70 hover:opacity-100"
                            )}
                            onClick={() => {
                                setMethod(provider.id as any);
                                fetch(`/api/products/${productId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sendingMethod: provider.id })
                                });
                            }}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shadow-sm border",
                                method === provider.id ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"
                            )}>
                                <provider.icon className={cn("h-5 w-5", method === provider.id ? "text-slate-900" : "text-slate-400")} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[13px] text-slate-900">{provider.name}</h3>
                                <p className="text-[10px] text-slate-500">{provider.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Provider Configuration Form */}
            {method !== 'platform' && (
                <div className="border border-slate-200 rounded-xl p-8 space-y-6 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-slate-400" />
                            <h3 className="font-bold text-slate-900 uppercase tracking-tight">Configure {method.toUpperCase()}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {method === 'smtp' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">SMTP Host</label>
                                    <Input
                                        value={smtpConfig.host}
                                        onChange={(e) => {
                                            const newConfig = { ...smtpConfig, host: e.target.value };
                                            setSmtpConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ smtpConfig: newConfig })
                                            });
                                        }}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">SMTP Port</label>
                                    <Input
                                        type="number"
                                        value={smtpConfig.port}
                                        onChange={(e) => {
                                            const newConfig = { ...smtpConfig, port: parseInt(e.target.value) };
                                            setSmtpConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ smtpConfig: newConfig })
                                            });
                                        }}
                                        placeholder="587"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">Username</label>
                                    <Input
                                        value={smtpConfig.username}
                                        onChange={(e) => {
                                            const newConfig = { ...smtpConfig, username: e.target.value };
                                            setSmtpConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ smtpConfig: newConfig })
                                            });
                                        }}
                                        placeholder="user@domain.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">Password</label>
                                    <Input
                                        type="password"
                                        value={smtpConfig.password}
                                        onChange={(e) => {
                                            const newConfig = { ...smtpConfig, password: e.target.value };
                                            setSmtpConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ smtpConfig: newConfig })
                                            });
                                        }}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        )}

                        {method === 'sendgrid' && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-900 uppercase">SendGrid API Key</label>
                                <Input
                                    type="password"
                                    value={sendgridConfig.apiKey}
                                    onChange={(e) => {
                                        const newConfig = { apiKey: e.target.value };
                                        setSendgridConfig(newConfig);
                                        fetch(`/api/products/${productId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ sendgridConfig: newConfig })
                                        });
                                    }}
                                    placeholder="SG.xxxxxxxxxxxxxxxx"
                                />
                            </div>
                        )}

                        {method === 'mailgun' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">Mailgun API Key</label>
                                    <Input
                                        type="password"
                                        value={mailgunConfig.apiKey}
                                        onChange={(e) => {
                                            const newConfig = { ...mailgunConfig, apiKey: e.target.value };
                                            setMailgunConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ mailgunConfig: newConfig })
                                            });
                                        }}
                                        placeholder="key-xxxxxxxxxxxx"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">Mailgun Domain</label>
                                    <Input
                                        value={mailgunConfig.domain}
                                        onChange={(e) => {
                                            const newConfig = { ...mailgunConfig, domain: e.target.value };
                                            setMailgunConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ mailgunConfig: newConfig })
                                            });
                                        }}
                                        placeholder="mg.yourdomain.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">Region</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm"
                                        value={mailgunConfig.region}
                                        onChange={(e) => {
                                            const newConfig = { ...mailgunConfig, region: e.target.value as 'us' | 'eu' };
                                            setMailgunConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ mailgunConfig: newConfig })
                                            });
                                        }}
                                    >
                                        <option value="us">US (default)</option>
                                        <option value="eu">EU</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {method === 'ses' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">AWS Access Key ID</label>
                                    <Input
                                        value={sesConfig.accessKeyId}
                                        onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const newConfig = { ...sesConfig, accessKeyId: val };
                                            setSesConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sesConfig: newConfig })
                                            });
                                        }}
                                        placeholder="AKIA..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">AWS Secret Access Key</label>
                                    <Input
                                        type="password"
                                        value={sesConfig.secretAccessKey}
                                        onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const newConfig = { ...sesConfig, secretAccessKey: val };
                                            setSesConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sesConfig: newConfig })
                                            });
                                        }}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase">AWS Region</label>
                                    <Input
                                        value={sesConfig.region}
                                        onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const newConfig = { ...sesConfig, region: val };
                                            setSesConfig(newConfig);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sesConfig: newConfig })
                                            });
                                        }}
                                        placeholder="us-east-1"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-black text-white font-bold h-10 px-8"
                        >
                            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Provider Settings
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 1: Verify Email Address - Only shown for Platform (Resend) users */}
            {!isByoak && (
                <div className="border border-slate-200 rounded-xl p-8 space-y-6 bg-white shadow-sm">
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <h3 className="font-bold text-slate-900">Step 1: Verify Email Address</h3>
                        {verificationStatus === 'verified' && (
                            <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900">Email Address to Verify</label>
                            <div className="flex gap-2">
                                <Input
                                    value={email}
                                    onChange={(e) => {
                                        const newEmail = e.target.value;
                                        setEmail(newEmail);
                                        // Auto-save to product settings
                                        fetch(`/api/products/${productId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ senderEmail: newEmail })
                                        });
                                    }}
                                    placeholder="sender@yourdomain.com"
                                    disabled={verificationStatus !== 'unverified' || isVerifying}
                                    className="bg-white border-slate-200 h-10 max-w-md"
                                />
                                {verificationStatus === 'unverified' && (
                                    <Button
                                        onClick={handleSendVerification}
                                        disabled={isVerifying || !email}
                                        className="bg-slate-900 hover:bg-black text-white font-semibold h-10 px-6"
                                    >
                                        {isVerifying ? "Sending..." : "Send Verification"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {verificationStatus !== 'unverified' && (
                            <div className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg text-sm font-semibold border w-fit",
                                verificationStatus === 'verified' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                                {verificationStatus === 'verified' ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4 animate-spin" />}
                                {email}
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold ml-1 text-white",
                                    verificationStatus === 'verified' ? "bg-emerald-500" : "bg-amber-500"
                                )}>
                                    {verificationStatus === 'verified' ? "Verified" : "Pending"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Steps 2 & 3: Show immediately for BYOAK users, or after verification for Platform users */}
            {(isByoak || verificationStatus === 'verified') ? (
                <>
                    {/* Step 2: Domain Authentication (DKIM) - Hide for BYOAK */}
                    {!isByoak && (
                        <div className="border border-slate-200 rounded-xl p-8 space-y-6 bg-white shadow-sm relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">Step 2: Domain Authentication (DKIM)</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900">Your Domain</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={domain}
                                            onChange={(e) => {
                                                const newDomain = e.target.value;
                                                setDomain(newDomain);
                                                // Auto-save domain to product settings
                                                fetch(`/api/products/${productId}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        domainAuth: {
                                                            ... (domainAuthStatus ? { status: domainAuthStatus } : {}),
                                                            domain: newDomain,
                                                            dkimRecords: dkimRecords,
                                                            instructions: dkimInstructions
                                                        }
                                                    })
                                                });
                                            }}
                                            placeholder="yourdomain.com"
                                            className="bg-white border-slate-200 h-10 max-w-md"
                                            disabled={isGeneratingDkim}
                                        />
                                        <Button
                                            onClick={handleGenerateDkim}
                                            disabled={isGeneratingDkim || !domain}
                                            variant="outline"
                                            className="border-slate-900 text-slate-900 font-bold h-10 px-6"
                                        >
                                            {isGeneratingDkim ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                            {dkimRecords.length > 0 ? "Regenerate Records" : "Generate Records"}
                                        </Button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDkimTip(!showDkimTip)}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-slate-600 transition-colors"
                                >
                                    <HelpCircle className="h-4 w-4 text-slate-400" /> Why configure DKIM?
                                </button>

                                {showDkimTip && (
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-xs text-slate-600 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p>Verifying your domain allows the CRM to send emails from any address on your domain (e.g. sales@yourdomain.com, support@yourdomain.com) with high deliverability.</p>
                                    </div>
                                )}

                                {dkimRecords.length > 0 && (
                                    <>
                                        <div className={cn(
                                            "rounded-lg p-4 text-[13px] flex items-center gap-3",
                                            domainAuthStatus === 'verified' ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-amber-50 text-amber-800 border border-amber-200"
                                        )}>
                                            {domainAuthStatus === 'verified' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4" />}
                                            <span className="font-bold">
                                                {domainAuthStatus === 'verified' ? "Domain Authenticated!" : "Waiting for DNS propagation (can take up to 72 hours)"}
                                            </span>
                                        </div>

                                        {isByoak && dkimInstructions ? (
                                            <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl space-y-4 animate-in zoom-in-95 duration-300">
                                                <div className="flex items-center gap-3 text-primary">
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">1</div>
                                                    <p className="font-semibold">{dkimInstructions}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-primary">
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">2</div>
                                                    <p className="font-semibold text-sm">Once configuration is finished, click the click verify button below.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-4 font-bold uppercase tracking-wider w-20">Type</th>
                                                            <th className="p-4 font-bold uppercase tracking-wider">Name</th>
                                                            <th className="p-4 font-bold uppercase tracking-wider">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {dkimRecords.map((record, idx) => (
                                                            <tr key={idx}>
                                                                <td className="p-4">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
                                                                        record.type === 'TXT' ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-primary/10 text-primary border-primary/20"
                                                                    )}>
                                                                        {record.type}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 font-mono group relative">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="truncate max-w-[200px]" title={record.name}>{record.name}</span>
                                                                        <button onClick={() => navigator.clipboard.writeText(record.name)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Copy className="h-3 w-3 text-slate-400" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 font-mono group relative">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="truncate max-w-[300px]" title={record.value}>{record.value}</span>
                                                                        <button onClick={() => navigator.clipboard.writeText(record.value)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Copy className="h-3 w-3 text-slate-400" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4">
                                            <Button
                                                onClick={handleVerifyDkim}
                                                disabled={isVerifyingDkim}
                                                variant="outline"
                                                className="border-slate-200 text-slate-900 font-bold h-10 px-5 flex items-center gap-2"
                                            >
                                                <RefreshCw className={cn("h-4 w-4", isVerifyingDkim && "animate-spin")} />
                                                {isVerifyingDkim ? "Verifying..." : "Verify DNS Records"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3 (or 2 for BYOAK): Sender Information */}
                    <div className="border border-slate-200 rounded-xl p-8 space-y-6 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Plane className="h-5 w-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">
                                    {isByoak ? "Step 2: Sender Information" : "Step 3: Sender Information"}
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-900 uppercase">Sender Name</label>
                                <Input
                                    value={senderName}
                                    onChange={(e) => {
                                        setSenderName(e.target.value);
                                        fetch(`/api/products/${productId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ senderName: e.target.value })
                                        });
                                    }}
                                    className="bg-white border-slate-200 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-900 uppercase">Sender Email</label>
                                <Input
                                    value={email}
                                    readOnly={!isByoak}
                                    onChange={(e) => {
                                        if (isByoak) {
                                            setEmail(e.target.value);
                                            fetch(`/api/products/${productId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ senderEmail: e.target.value })
                                            });
                                        }
                                    }}
                                    className={cn(
                                        "h-11 border-slate-200",
                                        !isByoak ? "bg-slate-50 text-slate-500" : "bg-white text-slate-900"
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Optional: Send Test Email */}
                    <div className="border border-slate-200 rounded-xl p-8 space-y-6 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="font-bold text-slate-900">Optional: Send Test Email</h3>
                        <div className="flex gap-4">
                            <div className="space-y-2 flex-1">
                                <label className="text-[11px] font-bold text-slate-900 uppercase">Send Test To</label>
                                <Input
                                    placeholder="your-email@example.com"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="bg-white border-slate-200 h-11"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={async () => {
                                        if (!testEmail) return;
                                        setIsSendingTest(true);
                                        try {
                                            const res = await fetch('/api/email/test', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ productId, to: testEmail }),
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                alert("Test email sent successully!");
                                            } else {
                                                alert(`Error: ${data.error || "Failed to send test email"}`);
                                            }
                                        } catch (e) {
                                            alert("Network error sending test email");
                                        } finally {
                                            setIsSendingTest(false);
                                        }
                                    }}
                                    disabled={!testEmail || isSendingTest}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 font-bold flex items-center gap-2"
                                >
                                    {isSendingTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    {isSendingTest ? "Sending..." : "Send Test"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            ) : !isByoak ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-900 font-bold mb-1">Steps 2 & 3 are Locked</h3>
                    <p className="text-slate-500 text-sm">Please verify your email address in Step 1 to unlock domain authentication and sender information.</p>
                </div>
            ) : null}
        </div>
    )
}
