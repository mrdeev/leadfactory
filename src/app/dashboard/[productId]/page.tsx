"use client";

import { use, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Rocket, Trash2, Zap, ArrowUpRight, Mail, Link as LinkIcon,
    Database, AlertTriangle, Globe, Loader2, Save, Target,
    MessageSquare, Send, Clock, BarChart, Check, ChevronRight,
    RefreshCw, ShieldCheck, Server, Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function ProductSettingsPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

    useEffect(() => {
        const checker = (event: MessageEvent) => {
            if (event.data?.type === 'LF_EXTENSION_READY') {
                setIsExtensionInstalled(true);
            }
        };
        window.addEventListener('message', checker);
        window.postMessage({ type: 'LF_EXTENSION_CHECK' }, '*');
        return () => window.removeEventListener('message', checker);
    }, []);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [emailMethod, setEmailMethod] = useState<string>("platform");
    const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
    const [domainAuthStatus, setDomainAuthStatus] = useState<string>("pending");
    const [smtpConfig, setSmtpConfig] = useState({ host: "", port: 587, username: "", password: "" });
    const [sesConfig, setSesConfig] = useState({ accessKeyId: "", secretAccessKey: "", region: "us-east-1" });
    const [sendgridConfig, setSendgridConfig] = useState({ apiKey: "" });
    const [mailgunConfig, setMailgunConfig] = useState({ apiKey: "", domain: "", region: "us" });
    const [formData, setFormData] = useState({
        name: "", websiteUrl: "", description: "", ceoName: "", ceoEmail: "",
        senderName: "", senderEmail: "", industry: "", companySize: "",
        funnelType: "", timezone: "", targetCustomers: "", painPoints: "",
        valueProp: "", pipelineTemplate: "saas"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, contactsRes] = await Promise.all([
                    fetch(`/api/products/${productId}`), fetch(`/api/contacts`)
                ]);
                if (productRes.ok) {
                    const data = await productRes.json();
                    setProduct(data);
                    setFormData({
                        name: data.name || "", websiteUrl: data.websiteUrl || "",
                        description: data.description || "", ceoName: data.ceoName || "",
                        ceoEmail: data.ceoEmail || "",
                        senderName: data.senderName || data.ceoName || "",
                        senderEmail: data.senderEmail || data.ceoEmail || "",
                        industry: data.industry || "", companySize: data.companySize || "11-50",
                        funnelType: data.funnelType || "service", timezone: data.timezone || "utc",
                        targetCustomers: data.targetCustomers || "", painPoints: data.painPoints || "",
                        valueProp: data.valueProp || "", pipelineTemplate: data.pipelineTemplate || "saas"
                    });
                    if (data.sendingMethod) setEmailMethod(data.sendingMethod);
                    if (data.emailVerification) setVerificationStatus(data.emailVerification.status);
                    if (data.domainAuth) setDomainAuthStatus(data.domainAuth.status || 'pending');
                    if (data.smtpConfig) setSmtpConfig(data.smtpConfig);
                    if (data.sesConfig) setSesConfig(data.sesConfig);
                    if (data.sendgridConfig) setSendgridConfig(data.sendgridConfig);
                    if (data.mailgunConfig) setMailgunConfig(data.mailgunConfig);
                }
                if (contactsRes.ok) {
                    const allContacts = await contactsRes.json();
                    setContacts(allContacts.filter((c: any) => c.productId === productId));
                }
            } catch (error) { console.error("Failed to fetch data:", error); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [productId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const body: any = { ...formData, sendingMethod: emailMethod, smtpConfig, sesConfig, sendgridConfig, mailgunConfig };
            const res = await fetch(`/api/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (res.ok) { const updated = await res.json(); setProduct(updated); alert("Settings saved successfully!"); }
            else { alert("Failed to save settings."); }
        } catch (error) { console.error("Save error:", error); alert("Error connecting to server."); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this company? All associated data will be permanently removed.")) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/campaigns");
            } else {
                alert("Failed to delete company.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error connecting to server.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendVerification = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch('/api/email/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, email: formData.senderEmail }) });
            if (res.ok) { setVerificationStatus('pending'); alert("Verification email sent!"); }
        } catch (error) { console.error('Verification error:', error); }
        finally { setIsVerifying(false); }
    };

    const handleRegenerateStrategy = async () => {
        setIsRegenerating(true);
        try {
            const res = await fetch('/api/ai/strategy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName: formData.name, productDescription: formData.description, pipelineTemplate: formData.pipelineTemplate }) });
            if (res.ok) {
                const strategy = await res.json();
                const updateRes = await fetch(`/api/products/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strategy }) });
                if (updateRes.ok) { const updatedProduct = await updateRes.json(); setProduct(updatedProduct); alert("Strategy regenerated!"); }
            }
        } catch (error) { console.error("Strategy error:", error); }
        finally { setIsRegenerating(false); }
    };

    const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

    const tabs = [
        { id: "general", label: "General", icon: <Zap className="h-4 w-4" /> },
        { id: "strategy", label: "AI Strategy", icon: <Target className="h-4 w-4" /> },
        { id: "pipeline", label: "Pipeline", icon: <ArrowUpRight className="h-4 w-4" /> },
        { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
        { id: "contacts", label: "Contacts", icon: <Users className="h-4 w-4" /> },
        { id: "integrations", label: "Integrations", icon: <LinkIcon className="h-4 w-4" /> },
    ];

    if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const PIPELINE_TEMPLATES = [
        { id: "saas", name: "SaaS", stages: ["New Lead", "Signup", "Trial", "Paid", "Churned"] },
        { id: "service", name: "Service", stages: ["Lead", "Contacted", "Qualified", "Consult", "Booked"] }
    ];
    const currentTemplate = PIPELINE_TEMPLATES.find(t => t.id === formData.pipelineTemplate) || PIPELINE_TEMPLATES[0];

    return (
        <div className="max-w-4xl space-y-8 pb-20 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-heading">{product?.name || "Company Settings"}</h1>
                    <p className="text-sm text-body mt-1">Configure your product, pipeline, and AI strategy</p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/dashboard/${productId}/setup`}>
                        <Button variant="outline"><Rocket className="mr-2 h-4 w-4" /> Setup Wizard</Button>
                    </Link>
                    <Button onClick={handleSave} disabled={isSaving} className="gradient-primary text-white hover:opacity-90 shadow-lg shadow-indigo-500/20">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 p-1 h-auto gap-1 border border-border w-fit justify-start rounded-xl overflow-x-auto max-w-full">
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}
                            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-none data-[state=active]:bg-card data-[state=active]:text-heading data-[state=active]:shadow-sm",
                                activeTab === tab.id ? "text-heading" : "text-body hover:text-heading"
                            )}>
                            {tab.icon} {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* GENERAL */}
                <TabsContent value="general" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-heading">Company Information</CardTitle>
                            <CardDescription>Basic information about your company</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Company Name *</Label><Input value={formData.name} onChange={e => handleChange("name", e.target.value)} /></div>
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Website URL</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" /><Input value={formData.websiteUrl} onChange={e => handleChange("websiteUrl", e.target.value)} placeholder="nordicairhost.com" className="pl-10" /></div></div>
                            </div>
                            <div className="space-y-2"><Label className="text-sm font-bold text-body">Description</Label><Textarea value={formData.description} onChange={e => handleChange("description", e.target.value)} placeholder="Describe your company..." className="min-h-[100px] resize-none" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">CEO / Founder Name</Label><Input value={formData.ceoName} onChange={e => handleChange("ceoName", e.target.value)} placeholder="John Smith" /></div>
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">CEO / Founder Email</Label><Input type="email" value={formData.ceoEmail} onChange={e => handleChange("ceoEmail", e.target.value)} placeholder="john@company.com" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Industry</Label><Input value={formData.industry} onChange={e => handleChange("industry", e.target.value)} placeholder="e.g., SaaS" /></div>
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Company Size</Label>
                                    <Select value={formData.companySize} onValueChange={v => handleChange("companySize", v)}>
                                        <SelectTrigger><SelectValue placeholder="Unknown" /></SelectTrigger>
                                        <SelectContent><SelectItem value="1-10">1-10</SelectItem><SelectItem value="11-50">11-50</SelectItem><SelectItem value="51-200">51-200</SelectItem><SelectItem value="201+">201+</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Sales Funnel Type</Label>
                                    <Select value={formData.funnelType} onValueChange={v => handleChange("funnelType", v)}>
                                        <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
                                        <SelectContent><SelectItem value="service">Service</SelectItem><SelectItem value="product">Product</SelectItem><SelectItem value="saas">SaaS</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label className="text-sm font-bold text-body">Timezone</Label>
                                    <Select value={formData.timezone} onValueChange={v => handleChange("timezone", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                                        <SelectContent><SelectItem value="utc">UTC</SelectItem><SelectItem value="est">EST</SelectItem><SelectItem value="pst">PST</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2"><Label className="text-sm font-bold text-body">Target Customers</Label><Textarea value={formData.targetCustomers} onChange={e => handleChange("targetCustomers", e.target.value)} placeholder="Who are your ideal customers?" className="min-h-[100px] resize-none" /></div>
                            <div className="space-y-2"><Label className="text-sm font-bold text-body">Customer Pain Points</Label><Textarea value={formData.painPoints} onChange={e => handleChange("painPoints", e.target.value)} placeholder="What problems do they face?" className="min-h-[100px] resize-none" /></div>
                            <div className="space-y-2"><Label className="text-sm font-bold text-body">Value Proposition</Label><Textarea value={formData.valueProp} onChange={e => handleChange("valueProp", e.target.value)} placeholder="Why should they choose you?" className="min-h-[100px] resize-none" /></div>
                            <div className="pt-8 space-y-4">
                                <div className="flex items-center gap-2 text-red-500 font-bold px-1 text-sm uppercase tracking-wider"><AlertTriangle className="h-4 w-4" /> Danger Zone</div>
                                <p className="text-xs text-subtle px-1 -mt-2">Irreversible and destructive actions</p>
                                <Card className="border-red-500/20 bg-red-500/5 rounded-2xl shadow-none">
                                    <CardContent className="p-8">
                                        <div className="flex items-center justify-between gap-6">
                                            <div><h4 className="font-bold text-heading">Delete this company</h4><p className="text-sm text-body mt-1 max-w-md">Once deleted, all data will be permanently removed.</p></div>
                                            <Button onClick={handleDelete} disabled={isSaving} variant="destructive" className="rounded-lg px-6 h-11 font-bold">
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                                Delete Company
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* STRATEGY */}
                <TabsContent value="strategy" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6 flex flex-row items-center justify-between">
                            <div><CardTitle className="text-xl font-bold text-heading">AI Marketing Strategy</CardTitle><CardDescription>How your AI assistant engages with prospects</CardDescription></div>
                            <Button variant="outline" onClick={handleRegenerateStrategy} disabled={isRegenerating}>
                                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                {product?.strategy ? "Regenerate Plan" : "Generate Plan"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            {product?.strategy ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <Section icon={<Target className="h-5 w-5 text-primary/70" />} title="Target Audience" content={product.strategy.targetAudience} />
                                    <Section icon={<MessageSquare className="h-5 w-5 text-violet-400" />} title="Key Value Messages" content={product.strategy.keyValueMessages} />
                                    <Section icon={<Send className="h-5 w-5 text-emerald-400" />} title="Outreach Approach" content={product.strategy.outreachApproach} />
                                    <Section icon={<Clock className="h-5 w-5 text-amber-400" />} title="Follow-up Strategy" content={product.strategy.followUpStrategy} />
                                    <Section icon={<BarChart className="h-5 w-5 text-cyan-400" />} title="Success Metrics" content={product.strategy.successMetrics} />
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="h-14 w-14 stat-indigo rounded-2xl flex items-center justify-center mx-auto"><Target className="h-7 w-7 text-primary/70" /></div>
                                    <p className="text-body">No strategy plan has been generated yet.</p>
                                    <Button onClick={handleRegenerateStrategy} disabled={isRegenerating} className="gradient-primary text-white shadow-lg shadow-indigo-500/20">
                                        {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate AI Strategy"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PIPELINE */}
                <TabsContent value="pipeline" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6"><CardTitle className="text-xl font-bold text-heading">Sales Pipeline</CardTitle><CardDescription>Define the stages your leads progress through</CardDescription></CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10">
                            <div className="p-6 bg-muted/30 border border-border rounded-xl">
                                <h4 className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-4">Current Pipeline Preview</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    {currentTemplate.stages.map((stage, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-medium whitespace-nowrap">{stage}</Badge>
                                            {idx < currentTemplate.stages.length - 1 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground/40" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-body">Pipeline Template</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {PIPELINE_TEMPLATES.map(template => (
                                        <div key={template.id} onClick={() => handleChange("pipelineTemplate", template.id)}
                                            className={cn("p-6 rounded-xl border-2 transition-all cursor-pointer",
                                                formData.pipelineTemplate === template.id ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20 hover:border-border"
                                            )}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="font-bold text-heading">{template.name}</h5>
                                                {formData.pipelineTemplate === template.id && <div className="h-5 w-5 gradient-primary rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {template.stages.slice(0, 3).map((s, i) => (
                                                    <span key={i} className="text-[11px] text-body flex items-center">{s} {i < 2 && <ChevronRight className="h-2.5 w-2.5 mx-0.5 opacity-30" />}</span>
                                                ))}
                                                <span className="text-[11px] text-subtle">...</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* EMAIL */}
                <TabsContent value="email" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6"><CardTitle className="text-xl font-bold text-heading">Email Settings</CardTitle><CardDescription>Configure how you send outreach emails</CardDescription></CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10">
                            <div className="space-y-4">
                                <Label className="text-[11px] font-bold text-subtle uppercase tracking-widest">Provider</Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { id: 'platform', name: 'Platform', icon: Rocket, desc: 'Resend (Auto)' },
                                        { id: 'ses', name: 'Amazon SES', icon: ShieldCheck, desc: 'AWS' },
                                        { id: 'sendgrid', name: 'SendGrid', icon: Send, desc: 'API' },
                                        { id: 'smtp', name: 'Custom SMTP', icon: Server, desc: 'Any Server' }
                                    ].map(provider => (
                                        <div key={provider.id} onClick={() => setEmailMethod(provider.id)}
                                            className={cn("p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center",
                                                emailMethod === provider.id ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30" : "border-border bg-muted/20 hover:border-border"
                                            )}>
                                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border",
                                                emailMethod === provider.id ? "bg-primary/20 border-primary/30" : "bg-muted/50 border-border"
                                            )}>
                                                <provider.icon className={cn("h-5 w-5", emailMethod === provider.id ? "text-primary" : "text-muted-foreground")} />
                                            </div>
                                            <span className={cn("text-[13px] font-bold", emailMethod === provider.id ? "text-heading" : "text-body")}>{provider.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {emailMethod === 'platform' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-[11px] font-bold text-subtle uppercase tracking-widest">Email Verification</Label>
                                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border-none capitalize",
                                            verificationStatus === 'verified' ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                                        )}>{verificationStatus}</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={formData.senderEmail} onChange={e => handleChange("senderEmail", e.target.value)} placeholder="sender@yourdomain.com" />
                                        {verificationStatus === 'unverified' && (
                                            <Button onClick={handleSendVerification} disabled={isVerifying} className="gradient-primary text-white px-6">
                                                {isVerifying ? "Sending..." : "Verify"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2"><Label className="text-sm font-bold text-body">Display Name</Label><Input value={formData.senderName} onChange={e => handleChange("senderName", e.target.value)} placeholder="Your Name or Company" /></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONTACTS */}
                <TabsContent value="contacts" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6"><CardTitle className="text-xl font-bold text-heading">Campaign Prospects</CardTitle><CardDescription>{contacts.length} total contacts</CardDescription></CardHeader>
                        <CardContent className="p-8 pt-0">
                            {contacts.length > 0 ? (
                                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-body border-b border-border"><tr><th className="p-4 font-bold">Name</th><th className="p-4 font-bold">Company</th><th className="p-4 font-bold text-right">Status</th></tr></thead>
                                        <tbody className="divide-y divide-border">
                                            {contacts.slice(0, 10).map(contact => (
                                                <tr key={contact.id} className="hover:bg-muted/30 transition-all">
                                                    <td className="p-4"><div className="font-bold text-heading">{contact.fullName}</div><div className="text-xs text-body">{contact.position}</div></td>
                                                    <td className="p-4 text-body">{contact.orgName}</td>
                                                    <td className="p-4 text-right">
                                                        <Badge variant="outline" className={cn("capitalize text-[10px]",
                                                            contact.status === 'ready' ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" : ""
                                                        )}>{contact.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {contacts.length > 10 && <div className="p-4 text-center border-t border-border"><Link href="/dashboard/contacts"><Button variant="link" className="text-primary text-xs font-bold uppercase">View All Contacts</Button></Link></div>}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4"><Users className="h-10 w-10 text-muted-foreground/30 mx-auto" /><p className="text-body">No contacts imported yet.</p>
                                    <Link href={`/dashboard/${productId}/setup`}><Button variant="outline">Import Contacts</Button></Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* INTEGRATIONS */}
                <TabsContent value="integrations" className="mt-0">
                    <Card className="shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6"><CardTitle className="text-xl font-bold text-heading">Third-party Integrations</CardTitle><CardDescription>Connect your CRM, Calendar, and other tools</CardDescription></CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    {
                                        name: "LinkedIn (Chrome Extension)",
                                        desc: "Automate outreach via your browser session",
                                        icon: Users,
                                        status: (() => {
                                            if (!product?.extensionConnected) return "Not Connected";
                                            // Check if active (seen in last 10 mins)
                                            const lastSeen = product.extensionLastSeenAt ? new Date(product.extensionLastSeenAt).getTime() : 0;
                                            const isActive = (Date.now() - lastSeen) / (1000 * 60) < 10;
                                            if (isActive) return "Active (Browser Mode)";
                                            if (product.linkedinConnected) return "Active (Cloud Mode)";
                                            return "Connected (Offline)";
                                        })(),
                                        iconColor: "text-primary/70",
                                        cardClass: "stat-indigo",
                                        isLinkedIn: true
                                    },
                                    { name: "Google Calendar", desc: "Sync availability and book meetings", icon: Globe, status: "Connected", iconColor: "text-primary/70", cardClass: "stat-indigo" },
                                    { name: "HubSpot CRM", desc: "Sync contacts and deals", icon: Database, status: "Available", iconColor: "text-amber-400", cardClass: "stat-amber" },
                                    { name: "Salesforce", desc: "Enterprise CRM integration", icon: ShieldCheck, status: "Available", iconColor: "text-primary/70", cardClass: "stat-indigo" },
                                    { name: "Slack", desc: "Real-time lead notifications", icon: MessageSquare, status: "Available", iconColor: "text-violet-400", cardClass: "stat-rose" },
                                    { name: "Zapier", desc: "Connect with 5000+ apps", icon: LinkIcon, status: "Available", iconColor: "text-amber-400", cardClass: "stat-amber" }
                                ].map(integration => (
                                    <div key={integration.name} className="p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/20 transition-all card-hover flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", integration.cardClass)}>
                                                <integration.icon className={cn("h-5 w-5", integration.iconColor)} />
                                            </div>
                                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border-none",
                                                integration.status === "Connected" || integration.status === "Legacy Connected" ? "bg-emerald-500/15 text-emerald-500" : ""
                                            )}>{integration.status}</Badge>
                                        </div>
                                        <h5 className="font-bold text-sm text-heading">{integration.name}</h5>
                                        <p className="text-xs text-body mt-1 flex-grow">{integration.desc}</p>

                                        {integration.isLinkedIn ? (
                                            <div className="mt-4 space-y-3">
                                                {isExtensionInstalled && !product?.extensionConnected && (
                                                    <Button
                                                        className="w-full h-10 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100"
                                                        disabled={isSaving}
                                                        onClick={() => {
                                                            setIsSaving(true);
                                                            window.postMessage({ type: 'LF_REQUEST_LINKEDIN_SESSION' }, '*');
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
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                setProduct({ ...product, extensionConnected: true, linkedinAccountName: data.linkedinAccountName });
                                                                                alert("LinkedIn connected successfully via Extension!");
                                                                            }
                                                                        } catch (e) { console.error(e); }
                                                                    } else {
                                                                        alert(event.data.error || "Could not connect to LinkedIn.");
                                                                    }
                                                                    setIsSaving(false);
                                                                }
                                                            };
                                                            window.addEventListener('message', handler);
                                                            setTimeout(() => {
                                                                window.removeEventListener('message', handler);
                                                                setIsSaving(false);
                                                            }, 5000);
                                                        }}
                                                    >
                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Now (Extension)"}
                                                    </Button>
                                                )}

                                                {product?.extensionToken ? (
                                                    <div className="p-3 bg-muted rounded-lg border border-border">
                                                        <Label className="text-[10px] uppercase text-subtle font-bold">Extension Token (Manual)</Label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <code className="text-[11px] font-mono bg-background px-2 py-1 rounded border border-border flex-grow overflow-hidden text-ellipsis">
                                                                {product.extensionToken}
                                                            </code>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                navigator.clipboard.writeText(product.extensionToken);
                                                                alert("Token copied to clipboard!");
                                                            }}>
                                                                <Save className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" className="w-full h-9 text-xs font-bold" onClick={async () => {
                                                        const res = await fetch(`/api/linkedin/connect`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ productId, mode: 'extension' })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setProduct({ ...product, extensionToken: data.extensionToken });
                                                        }
                                                    }}>
                                                        Generate Setup Token
                                                    </Button>
                                                )}
                                                {!product?.extensionConnected && (
                                                    <p className="text-[10px] text-subtle text-center italic">
                                                        {isExtensionInstalled ? "Extension detected! One-click connect available." : "Install our extension to connect automatically."}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Button variant="outline" className="w-full mt-4 h-9 text-xs font-bold">
                                                {integration.status === "Connected" ? "Manage" : "Connect"}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Section({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 shrink-0">{icon}</div>
            <div>
                <h4 className="font-bold text-sm text-heading">{title}</h4>
                <p className="text-sm text-body mt-1.5 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
