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
    RefreshCw, Filter, History, Eye, ShieldCheck, Plane, Server,
    Users, Copy, Info, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function ProductSettingsPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerifyingDkim, setIsVerifyingDkim] = useState(false);
    const [isGeneratingDkim, setIsGeneratingDkim] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);

    // Form state for Email Provider Specifics
    const [emailMethod, setEmailMethod] = useState<string>("platform");
    const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
    const [domainAuthStatus, setDomainAuthStatus] = useState<string>("pending");
    const [smtpConfig, setSmtpConfig] = useState({ host: "", port: 587, username: "", password: "" });
    const [sesConfig, setSesConfig] = useState({ accessKeyId: "", secretAccessKey: "", region: "us-east-1" });
    const [sendgridConfig, setSendgridConfig] = useState({ apiKey: "" });
    const [mailgunConfig, setMailgunConfig] = useState({ apiKey: "", domain: "", region: "us" });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        websiteUrl: "",
        description: "",
        ceoName: "",
        ceoEmail: "",
        senderName: "",
        senderEmail: "",
        industry: "",
        companySize: "",
        funnelType: "",
        timezone: "",
        targetCustomers: "",
        painPoints: "",
        valueProp: "",
        pipelineTemplate: "saas"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, contactsRes] = await Promise.all([
                    fetch(`/api/products/${productId}`),
                    fetch(`/api/contacts`)
                ]);

                if (productRes.ok) {
                    const data = await productRes.json();
                    setProduct(data);
                    setFormData({
                        name: data.name || "",
                        websiteUrl: data.websiteUrl || "",
                        description: data.description || "",
                        ceoName: data.ceoName || "",
                        ceoEmail: data.ceoEmail || "",
                        senderName: data.senderName || data.ceoName || "",
                        senderEmail: data.senderEmail || data.ceoEmail || "",
                        industry: data.industry || "",
                        companySize: data.companySize || "11-50",
                        funnelType: data.funnelType || "service",
                        timezone: data.timezone || "utc",
                        targetCustomers: data.targetCustomers || "",
                        painPoints: data.painPoints || "",
                        valueProp: data.valueProp || "",
                        pipelineTemplate: data.pipelineTemplate || "saas"
                    });

                    // Email states
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
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [productId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const body: any = {
                ...formData,
                sendingMethod: emailMethod,
                smtpConfig,
                sesConfig,
                sendgridConfig,
                mailgunConfig
            };

            const res = await fetch(`/api/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const updated = await res.json();
                setProduct(updated);
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings.");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Error connecting to server.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendVerification = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch('/api/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, email: formData.senderEmail }),
            });
            if (res.ok) {
                setVerificationStatus('pending');
                alert("Verification email sent!");
            }
        } catch (error) {
            console.error('Verification error:', error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRegenerateStrategy = async () => {
        setIsRegenerating(true);
        try {
            const res = await fetch('/api/ai/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: formData.name,
                    productDescription: formData.description,
                    pipelineTemplate: formData.pipelineTemplate
                })
            });

            if (res.ok) {
                const strategy = await res.json();
                const updateRes = await fetch(`/api/products/${productId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ strategy }),
                });

                if (updateRes.ok) {
                    const updatedProduct = await updateRes.json();
                    setProduct(updatedProduct);
                    alert("Strategy regenerated successfully!");
                }
            }
        } catch (error) {
            console.error("Strategy error:", error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const tabs = [
        { id: "general", label: "General", icon: <Zap className="h-4 w-4" /> },
        { id: "strategy", label: "AI Strategy", icon: <Target className="h-4 w-4" /> },
        { id: "pipeline", label: "Pipeline", icon: <ArrowUpRight className="h-4 w-4" /> },
        { id: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
        { id: "contacts", label: "Contacts", icon: <Users className="h-4 w-4" /> },
        { id: "integrations", label: "Integrations", icon: <LinkIcon className="h-4 w-4" /> },
    ];

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    const PIPELINE_TEMPLATES = [
        {
            id: "saas",
            name: "SaaS",
            stages: ["New Lead", "Signup", "Trial", "Paid", "Churned"]
        },
        {
            id: "service",
            name: "Service",
            stages: ["Lead", "Contacted", "Qualified", "Consult", "Booked"]
        }
    ];

    const currentTemplate = PIPELINE_TEMPLATES.find(t => t.id === formData.pipelineTemplate) || PIPELINE_TEMPLATES[0];

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{product?.name || "Company Settings"}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure your product, pipeline, and AI strategy
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/dashboard/${productId}/setup`}>
                        <Button variant="outline" className="border-slate-200">
                            <Rocket className="mr-2 h-4 w-4" />
                            Setup Wizard
                        </Button>
                    </Link>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-black text-white hover:bg-gray-800"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-slate-100/50 p-1 h-auto gap-2 border-none w-fit justify-start rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-none data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
                                activeTab === tab.id
                                    ? "text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="general" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-900">Company Information</CardTitle>
                            <CardDescription className="text-slate-500">
                                Basic information about your company
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="product-name" className="text-sm font-bold text-slate-700">Company Name *</Label>
                                    <Input
                                        id="product-name"
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="bg-slate-50 border-slate-200 h-11 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website-url" className="text-sm font-bold text-slate-700">Website URL</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="website-url"
                                            value={formData.websiteUrl}
                                            onChange={(e) => handleChange("websiteUrl", e.target.value)}
                                            placeholder="nordicairhost.com"
                                            className="bg-slate-50 border-slate-200 h-11 pl-10 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-bold text-slate-700">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="Describe your company..."
                                    className="bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="ceo-name" className="text-sm font-bold text-slate-700">CEO / Founder Name</Label>
                                    <Input
                                        id="ceo-name"
                                        value={formData.ceoName}
                                        onChange={(e) => handleChange("ceoName", e.target.value)}
                                        placeholder="John Smith"
                                        className="bg-slate-50 border-slate-200 h-11 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ceo-email" className="text-sm font-bold text-slate-700">CEO / Founder Email</Label>
                                    <Input
                                        id="ceo-email"
                                        type="email"
                                        value={formData.ceoEmail}
                                        onChange={(e) => handleChange("ceoEmail", e.target.value)}
                                        placeholder="john@company.com"
                                        className="bg-slate-50 border-slate-200 h-11 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="industry" className="text-sm font-bold text-slate-700">Industry</Label>
                                    <Input
                                        id="industry"
                                        value={formData.industry}
                                        onChange={(e) => handleChange("industry", e.target.value)}
                                        placeholder="e.g., SaaS, E-commerce"
                                        className="bg-slate-50 border-slate-200 h-11 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company-size" className="text-sm font-bold text-slate-700">Company Size</Label>
                                    <Select value={formData.companySize} onValueChange={(val) => handleChange("companySize", val)}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:bg-white">
                                            <SelectValue placeholder="Unknown" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-10">1-10 employees</SelectItem>
                                            <SelectItem value="11-50">11-50 employees</SelectItem>
                                            <SelectItem value="51-200">51-200 employees</SelectItem>
                                            <SelectItem value="201+">201+ employees</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="funnel-type" className="text-sm font-bold text-slate-700">Sales Funnel Type</Label>
                                    <Select value={formData.funnelType} onValueChange={(val) => handleChange("funnelType", val)}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:bg-white">
                                            <SelectValue placeholder="Service (Consult > Book > Close)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="service">Service (Consult &gt; Book &gt; Close)</SelectItem>
                                            <SelectItem value="product">Product (Learn &gt; Buy)</SelectItem>
                                            <SelectItem value="saas">SaaS (Trial &gt; Convert)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone" className="text-sm font-bold text-slate-700">Timezone</Label>
                                    <Select value={formData.timezone} onValueChange={(val) => handleChange("timezone", val)}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:bg-white">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                                            <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                                            <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="target-customers" className="text-sm font-bold text-slate-700">Target Customers</Label>
                                <Textarea
                                    id="target-customers"
                                    value={formData.targetCustomers}
                                    onChange={(e) => handleChange("targetCustomers", e.target.value)}
                                    placeholder="Who are your ideal customers?"
                                    className="bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pain-points" className="text-sm font-bold text-slate-700">Customer Pain Points</Label>
                                <Textarea
                                    id="pain-points"
                                    value={formData.painPoints}
                                    onChange={(e) => handleChange("painPoints", e.target.value)}
                                    placeholder="What problems do they face?"
                                    className="bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value-prop" className="text-sm font-bold text-slate-700">Value Proposition</Label>
                                <Textarea
                                    id="value-prop"
                                    value={formData.valueProp}
                                    onChange={(e) => handleChange("valueProp", e.target.value)}
                                    placeholder="Why should they choose you?"
                                    className="bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white resize-none"
                                />
                            </div>

                            <div className="pt-8 space-y-4">
                                <div className="flex items-center gap-2 text-red-500 font-bold px-1 text-sm uppercase tracking-wider">
                                    <AlertTriangle className="h-4 w-4" />
                                    Danger Zone
                                </div>
                                <p className="text-xs text-slate-400 px-1 -mt-2">Irreversible and destructive actions</p>

                                <Card className="border-red-100 bg-red-50/20 rounded-2xl shadow-none">
                                    <CardContent className="p-8">
                                        <div className="flex items-center justify-between gap-6">
                                            <div>
                                                <h4 className="font-bold text-slate-900">Delete this company</h4>
                                                <p className="text-sm text-slate-500 mt-1 max-w-md">
                                                    Once deleted, all data associated with this company will be permanently removed.
                                                </p>
                                            </div>
                                            <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-6 h-11 font-bold">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Company
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategy" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">AI Marketing Strategy</CardTitle>
                                <CardDescription className="text-slate-500">
                                    How your AI sales assistant engages with prospects
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                className="border-slate-200"
                                onClick={handleRegenerateStrategy}
                                disabled={isRegenerating}
                            >
                                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                {product?.strategy ? "Regenerate Plan" : "Generate Plan"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            {product?.strategy ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <Section
                                        icon={<Target className="h-5 w-5 text-blue-500" />}
                                        title="Target Audience"
                                        content={product.strategy.targetAudience}
                                    />
                                    <Section
                                        icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
                                        title="Key Value Messages"
                                        content={product.strategy.keyValueMessages}
                                    />
                                    <Section
                                        icon={<Send className="h-5 w-5 text-emerald-500" />}
                                        title="Outreach Approach"
                                        content={product.strategy.outreachApproach}
                                    />
                                    <Section
                                        icon={<Clock className="h-5 w-5 text-amber-500" />}
                                        title="Follow-up Strategy"
                                        content={product.strategy.followUpStrategy}
                                    />
                                    <Section
                                        icon={<BarChart className="h-5 w-5 text-indigo-500" />}
                                        title="Success Metrics"
                                        content={product.strategy.successMetrics}
                                    />
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <p className="text-slate-500">No strategy plan has been generated yet.</p>
                                    <Button onClick={handleRegenerateStrategy} disabled={isRegenerating} className="bg-black text-white">
                                        {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate AI Strategy"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-900">Sales Pipeline</CardTitle>
                            <CardDescription className="text-slate-500">
                                Define the stages your leads progress through
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10">
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Pipeline Preview</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    {currentTemplate.stages.map((stage, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <Badge variant="outline" className="bg-white px-4 py-1.5 rounded-lg border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                                {stage}
                                            </Badge>
                                            {idx < currentTemplate.stages.length - 1 && <ChevronRight className="h-3 w-3 mx-1 text-slate-300" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-700">Pipeline Template</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {PIPELINE_TEMPLATES.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() => handleChange("pipelineTemplate", template.id)}
                                            className={cn(
                                                "p-6 rounded-xl border-2 transition-all cursor-pointer",
                                                formData.pipelineTemplate === template.id
                                                    ? "border-slate-900 bg-slate-50/50"
                                                    : "border-slate-100 bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="font-bold text-slate-900">{template.name}</h5>
                                                {formData.pipelineTemplate === template.id && (
                                                    <div className="h-5 w-5 bg-slate-900 rounded-full flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {template.stages.slice(0, 3).map((s, i) => (
                                                    <span key={i} className="text-[11px] text-slate-500 flex items-center">
                                                        {s}
                                                        {i < 2 && <ChevronRight className="h-2.5 w-2.5 mx-0.5 opacity-30" />}
                                                    </span>
                                                ))}
                                                <span className="text-[11px] text-slate-400">...</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-900">Email Settings</CardTitle>
                            <CardDescription className="text-slate-500">
                                Configure how you send outreach emails
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10">
                            {/* Provider Selection */}
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[11px]">Provider</Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { id: 'platform', name: 'Platform', icon: Rocket, desc: 'Resend (Auto)' },
                                        { id: 'ses', name: 'Amazon SES', icon: ShieldCheck, desc: 'AWS' },
                                        { id: 'sendgrid', name: 'SendGrid', icon: Send, desc: 'API' },
                                        { id: 'smtp', name: 'Custom SMTP', icon: Server, desc: 'Any Server' }
                                    ].map((provider) => (
                                        <div
                                            key={provider.id}
                                            onClick={() => setEmailMethod(provider.id)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center",
                                                emailMethod === provider.id
                                                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                    : "border-slate-100 bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center border",
                                                emailMethod === provider.id ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"
                                            )}>
                                                <provider.icon className={cn("h-5 w-5", emailMethod === provider.id ? "text-slate-900" : "text-slate-400")} />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-900">{provider.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Verification Step - Only for Platform */}
                            {emailMethod === 'platform' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[11px]">Email Verification</Label>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] px-2 py-0 border-none capitalize",
                                            verificationStatus === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                        )}>
                                            {verificationStatus}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.senderEmail}
                                            onChange={(e) => handleChange("senderEmail", e.target.value)}
                                            placeholder="sender@yourdomain.com"
                                            className="bg-slate-50 border-slate-200 h-11"
                                        />
                                        {verificationStatus === 'unverified' && (
                                            <Button onClick={handleSendVerification} disabled={isVerifying} className="bg-black text-white px-6">
                                                {isVerifying ? "Sending..." : "Verify"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sender Name */}
                            <div className="space-y-2">
                                <Label htmlFor="sender-name" className="text-sm font-bold text-slate-700">Display Name</Label>
                                <Input
                                    id="sender-name"
                                    value={formData.senderName}
                                    onChange={(e) => handleChange("senderName", e.target.value)}
                                    placeholder="Your Name or Company"
                                    className="bg-slate-50 border-slate-200 h-11"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-900">Campaign Prospects</CardTitle>
                            <CardDescription className="text-slate-500">
                                {contacts.length} total contacts found for this company
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="space-y-4">
                                {contacts.length > 0 ? (
                                    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="p-4 font-bold">Name</th>
                                                    <th className="p-4 font-bold">Company</th>
                                                    <th className="p-4 font-bold text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {contacts.slice(0, 10).map((contact) => (
                                                    <tr key={contact.id} className="hover:bg-slate-50 transition-all group">
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-900">{contact.fullName}</div>
                                                            <div className="text-xs text-slate-500">{contact.position}</div>
                                                        </td>
                                                        <td className="p-4 text-slate-600">{contact.orgName}</td>
                                                        <td className="p-4 text-right">
                                                            <Badge variant="outline" className={cn(
                                                                "capitalize text-[10px]",
                                                                contact.status === 'ready' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                                            )}>
                                                                {contact.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {contacts.length > 10 && (
                                            <div className="p-4 text-center border-t border-slate-50">
                                                <Link href="/dashboard/contacts">
                                                    <Button variant="link" className="text-blue-600 text-xs font-bold uppercase">View All Contacts</Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <Users className="h-10 w-10 text-slate-200 mx-auto" />
                                        <p className="text-slate-500">No contacts imported for this company yet.</p>
                                        <Link href={`/dashboard/${productId}/setup`}>
                                            <Button variant="outline" className="border-slate-200">Import Contacts</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="integrations" className="mt-0">
                    <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-900">Third-party Integrations</CardTitle>
                            <CardDescription className="text-slate-500">
                                Connect your CRM, Calendar, and other sales tools
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { name: "Google Calendar", desc: "Sync availability and book meetings", icon: Globe, status: "Connected", color: "text-blue-500" },
                                    { name: "HubSpot CRM", desc: "Sync contacts and deals", icon: Database, status: "Available", color: "text-orange-500" },
                                    { name: "Salesforce", desc: "Enterprise CRM integration", icon: ShieldCheck, status: "Available", color: "text-blue-600" },
                                    { name: "Slack", desc: "Get real-time lead notifications", icon: MessageSquare, status: "Available", color: "text-purple-500" },
                                    { name: "Zapier", desc: "Connect with 5000+ apps", icon: LinkIcon, status: "Available", color: "text-orange-600" }
                                ].map((integration) => (
                                    <div key={integration.name} className="p-6 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-slate-50", integration.color)}>
                                                <integration.icon className="h-5 w-5" />
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] px-2 py-0 border-none",
                                                integration.status === "Connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                                {integration.status}
                                            </Badge>
                                        </div>
                                        <h5 className="font-bold text-sm text-slate-900">{integration.name}</h5>
                                        <p className="text-xs text-slate-500 mt-1">{integration.desc}</p>
                                        <Button variant="outline" className="w-full mt-4 h-9 text-xs font-bold border-slate-200">
                                            {integration.status === "Connected" ? "Manage" : "Connect"}
                                        </Button>
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
                <h4 className="font-bold text-sm text-slate-900">{title}</h4>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
