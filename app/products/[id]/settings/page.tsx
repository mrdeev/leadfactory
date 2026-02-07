"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Globe,
  GitBranch,
  Mail,
  Link2,
  Database,
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  GripVertical,
  Pencil,
  Cloud,
  Server,
  Check,
  Copy,
  ChevronRight,
  Zap,
  ArrowRight,
  Info,
  Shield,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useProduct } from "@/components/product-context";
import { PRODUCT_COMPANY_SIZES, SALES_FUNNEL_TYPES, TIMEZONES } from "@/lib/constants";
import type { Product, ProductSettingsTab } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "email", label: "Email", icon: Mail },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "data-sources", label: "Data Sources", icon: Database },
] as const;

export default function ProductSettingsPage() {
  const params = useParams();
  const productId = params.id as string;
  const { refreshProducts, setSelectedProduct } = useProduct();
  const [activeTab, setActiveTab] = React.useState<ProductSettingsTab>("general");
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (data) {
      setProduct(data as Product);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        website_url: product.website_url,
        description: product.description,
        ceo_name: product.ceo_name,
        ceo_email: product.ceo_email,
        industry: product.industry,
        company_size: product.company_size,
        sales_funnel_type: product.sales_funnel_type,
        timezone: product.timezone,
        target_customers: product.target_customers,
        customer_pain_points: product.customer_pain_points,
        value_proposition: product.value_proposition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Changes saved");
    await refreshProducts();
  };

  const handleDelete = async () => {
    if (!product) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    toast.success("Product deleted");
    await refreshProducts();
    setSelectedProduct(null);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-lg font-medium">Product not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The product you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure your product, pipeline, and email settings
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Setup Wizard
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProductSettingsTab)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Basic information about your product or company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="https://example.com"
                      value={product.website_url}
                      onChange={(e) => setProduct({ ...product, website_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  placeholder="Brief description of your product"
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>CEO / Founder Name</Label>
                  <Input
                    value={product.ceo_name}
                    onChange={(e) => setProduct({ ...product, ceo_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CEO / Founder Email</Label>
                  <Input
                    type="email"
                    value={product.ceo_email}
                    onChange={(e) => setProduct({ ...product, ceo_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input
                    placeholder="e.g., SaaS, E-commerce"
                    value={product.industry}
                    onChange={(e) => setProduct({ ...product, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Size</Label>
                  <Select
                    value={product.company_size}
                    onValueChange={(v) => setProduct({ ...product, company_size: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_COMPANY_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sales Funnel Type</Label>
                  <Select
                    value={product.sales_funnel_type}
                    onValueChange={(v) => setProduct({ ...product, sales_funnel_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_FUNNEL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select
                    value={product.timezone}
                    onValueChange={(v) => setProduct({ ...product, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Target Customers</Label>
                <Textarea
                  rows={3}
                  placeholder="Describe your ideal customer profile"
                  value={product.target_customers}
                  onChange={(e) => setProduct({ ...product, target_customers: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Customer Pain Points</Label>
                <Textarea
                  rows={3}
                  placeholder="What problems do your customers face?"
                  value={product.customer_pain_points}
                  onChange={(e) => setProduct({ ...product, customer_pain_points: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Value Proposition</Label>
                <Textarea
                  rows={3}
                  placeholder="How does your product solve these problems?"
                  value={product.value_proposition}
                  onChange={(e) => setProduct({ ...product, value_proposition: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium">Delete this product</p>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, all data associated with this product will be permanently removed.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Product
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product and all associated contacts, searches, and data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Product
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "pipeline" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    <CardTitle>Sales Pipeline Stages</CardTitle>
                  </div>
                  <CardDescription>Define the stages contacts move through in your sales process</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add Stage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground">Pipeline Flow</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5">
                    <span className="text-sm font-medium">New Lead</span>
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5">
                    <span className="text-sm font-medium">Signup</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5">
                    <span className="text-sm font-medium">Trial</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex items-center gap-1.5 rounded-md border bg-emerald-500/10 px-3 py-1.5">
                    <span className="text-sm font-medium text-emerald-600">Paid</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-xs text-emerald-700">Won</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex items-center gap-1.5 rounded-md border bg-red-500/10 px-3 py-1.5">
                    <span className="text-sm font-medium text-red-600">Churned</span>
                    <Badge variant="secondary" className="bg-red-500/20 text-xs text-red-700">Lost</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { name: "New Lead", color: "bg-blue-500", probability: 10, default: true },
                  { name: "Signup", color: "bg-purple-500", probability: 25 },
                  { name: "Trial", color: "bg-purple-500", probability: 50 },
                  { name: "Paid", color: "bg-emerald-500", probability: 100, won: true },
                  { name: "Churned", color: "bg-red-500", probability: 0, lost: true },
                ].map((stage) => (
                  <div key={stage.name} className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className={cn("h-3 w-3 shrink-0 rounded-full", stage.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.name}</span>
                        {stage.default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                        {stage.won && <Badge className="bg-emerald-500/20 text-xs text-emerald-700">Won</Badge>}
                        {stage.lost && <Badge className="bg-red-500/20 text-xs text-red-700">Lost</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.name.toLowerCase()} • {stage.probability}% probability</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!stage.default && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <CardTitle>Automatic Stage Updates</CardTitle>
              </div>
              <CardDescription>Contacts automatically move through stages based on these actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">Behavior Triggers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Contact replies <ArrowRight className="inline h-3 w-3" /> Contacted
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Opens email / Clicks link <ArrowRight className="inline h-3 w-3" /> Engaged
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Books meeting <ArrowRight className="inline h-3 w-3" /> Meeting Scheduled
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Completes meeting <ArrowRight className="inline h-3 w-3" /> Qualified
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Webhook Triggers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Purchase completed <ArrowRight className="inline h-3 w-3" /> Won
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Subscription cancelled <ArrowRight className="inline h-3 w-3" /> Lost
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Form submitted <ArrowRight className="inline h-3 w-3" /> Qualified
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5" />
                      Custom webhook events <ArrowRight className="inline h-3 w-3" /> Configured stage
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Configure webhooks in the Integrations tab to enable external triggers.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "email" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Sending Method</CardTitle>
              <CardDescription>Choose how you want to send emails to your contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <button className="group relative flex flex-col items-center justify-center rounded-lg border-2 bg-card p-8 text-center transition-all hover:border-primary">
                  <Cloud className="mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold">Official Platform</h3>
                  <p className="mb-3 text-xs text-muted-foreground">Send emails via our platform</p>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700">
                    <Check className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                </button>
                <button className="group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-8 text-center transition-all hover:border-primary">
                  <Server className="mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="mb-1 font-semibold">SMTP (Your Account)</h3>
                  <p className="text-xs text-muted-foreground">Use your own email accounts</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Verification</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Verify your sending email address with AWS SES</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Email Address to Verify</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input placeholder="sender@yourdomain.com" className="flex-1" defaultValue="sender@yourdomain.com" />
                  <Button size="sm" className="shrink-0">Send Verification</Button>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/30">
                <Check className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">support@nordicaihost.com</span>
                <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50">Verified</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Domain Authentication (DKIM)</CardTitle>
              </div>
              <CardDescription>Improve email deliverability with DKIM authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">DNS records not yet detected</span>
                </div>
              </div>

              <div className="rounded-lg border bg-blue-50/50 p-3 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Info className="h-4 w-4 shrink-0" />
                  Most DNS providers automatically append your domain [<span className="font-mono">nordicaihost.com</span>]. If your provider requires the full name, add it manually.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 pr-4 text-left font-medium">Type</th>
                      <th className="pb-2 pr-4 text-left font-medium">Name</th>
                      <th className="pb-2 text-left font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">TXT</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs">_amazonses</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs">1isMsf1t4776313litcu1791bG4m5Re…</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {["v5pk1c1nda1t7aeczr7j72r5sf…", "g1nsg1ita1tttrftrgfkpmkatsir…", "r1t7y7j12r5tg1i1o1pr1rjftem…"].map((value, idx) => (
                      <tr key={idx}>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">CNAME</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 text-xs">{value.slice(0, 15)}…_domainkey</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 text-xs">{value}_dkim.amazo…</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" size="sm" className="gap-2">
                <Check className="h-3.5 w-3.5" />
                Verify DNS Records
              </Button>

              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">DKIM setup started</p>
                  <p className="text-xs text-muted-foreground">Please add the DNS records to your domain.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
              <CardDescription>Configure how your emails appear to recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sender Name</Label>
                  <Input placeholder="nordicaihost" defaultValue="nordicaihost" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sender Email</Label>
                  <Input placeholder="support@nordicaihost.com" defaultValue="support@nordicaihost.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reply-To Email</Label>
                <Input placeholder="support@nordicaihost.com" defaultValue="support@nordicaihost.com" />
              </div>
              <div className="flex justify-end">
                <Button size="sm">Save</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>Test your email configuration by sending a test message</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="your-email@example.com" className="flex-1" />
                <Button size="sm" className="gap-2 shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                  Send Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <CardTitle>Email Warmup</CardTitle>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50">Day 18</Badge>
              </div>
              <CardDescription>Gradually increase sending volume to build sender reputation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">nordicaihost.com</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50">
                      Warming Up
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[60%] bg-amber-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">Day 18 of 30 warmup</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">DKIM setup started</p>
                  <p className="text-xs text-muted-foreground">Please add the DNS records to your domain.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "LinkedIn", status: "not-connected", icon: "🔗" },
            { name: "Google Workspace", status: "not-connected", icon: "📧" },
            { name: "Slack", status: "not-connected", icon: "💬" },
            { name: "HubSpot", status: "not-connected", icon: "🎯" },
            { name: "Salesforce", status: "not-connected", icon: "☁️" },
            { name: "Apify", status: "not-connected", icon: "🤖" },
          ].map((integration) => (
            <Card key={integration.name}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 text-2xl">{integration.icon}</div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {integration.status === "connected" ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "data-sources" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Scraping</CardTitle>
              <CardDescription>Configure LinkedIn data sourcing and lead discovery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">LinkedIn Search Integration</p>
                    <p className="text-sm text-muted-foreground">
                      Use Apollo.io to find and scrape LinkedIn profiles
                    </p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <Button variant="outline" size="sm">
                  Configure Search Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Import</CardTitle>
              <CardDescription>Upload contacts from CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Database className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-2 font-medium">Drag and drop CSV file</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  or click to browse
                </p>
                <Button size="sm" variant="outline">
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Sources</CardTitle>
              <CardDescription>Active data pipelines and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Lead Search Pipeline</p>
                      <p className="text-xs text-muted-foreground">Apify + LinkedIn</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
