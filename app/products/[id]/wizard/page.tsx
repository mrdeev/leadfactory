"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  GitBranch,
  Sparkles,
  Users,
  Mail,
  Calendar,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Cloud,
  Server,
  Info,
  Shield,
  Copy,
  Loader2,
  Play,
  Zap,
  Database,
  AlertCircle,
  Send,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  { id: 1, label: "Pipeline Stages", icon: GitBranch, optional: false },
  { id: 2, label: "AI Sales Strategy", icon: Sparkles, optional: false },
  { id: 3, label: "Import Contacts", icon: Users, optional: false },
  { id: 4, label: "Email Settings", icon: Mail, optional: false },
  { id: 5, label: "Google Calendar", subtitle: "(Optional)", icon: Calendar, optional: true },
  { id: 6, label: "AI Auto-Reply", subtitle: "(Optional)", icon: Sparkles, optional: true },
  { id: 7, label: "LLM Tools", subtitle: "(Optional)", icon: Sparkles, optional: true },
  { id: 8, label: "Test & Launch", icon: Rocket, optional: false },
];

const PIPELINE_TEMPLATES = [
  {
    id: "saas",
    name: "SaaS",
    stages: ["New Lead", "Signup", "Trial", "Paid"],
    description: "New Lead → Signup → Trial → Paid",
  },
  {
    id: "service",
    name: "Service",
    stages: ["Lead", "Contacted", "Qualified", "Consult", "Booked"],
    description: "Lead → Contacted → Qualified → Consult → Booked",
    comingSoon: false,
  },
  {
    id: "b2b",
    name: "B2B Sales",
    stages: ["Lead", "Contacted", "Qualified", "Proposal", "Negotiation"],
    description: "Lead → Contacted → Qualified → Proposal → Negotiation",
    comingSoon: true,
  },
  {
    id: "leadgen",
    name: "Lead Gen",
    stages: ["Lead", "Contacted", "Qualified", "Converted"],
    description: "Lead → Contacted → Qualified → Converted",
    comingSoon: true,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    stages: ["Browse", "Cart", "Checkout", "Purchase"],
    description: "Browse → Cart → Checkout → Purchase",
    comingSoon: true,
  },
];

export default function ProductWizardPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [productName, setProductName] = React.useState("");

  const [wizardData, setWizardData] = React.useState({
    pipelineTemplate: "saas",
    customPipeline: ["New Lead", "Signup", "Trial", "Paid", "Churned"],
    aiStrategy: {
      targetAudience: "",
      keyMessages: "",
      outreachApproach: "",
      followupStrategy: "",
      successMetrics: "",
    },
    emailMethod: "official",
    emailVerified: false,
    senderName: "",
    senderEmail: "",
    replyToEmail: "",
    calendarConnected: false,
  });

  React.useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Product not found");
        router.push("/");
        return;
      }

      setProductName(data.name);

      if (data.wizard_completed) {
        router.push(`/products/${productId}/settings`);
        return;
      }

      if (data.wizard_data && Object.keys(data.wizard_data).length > 0) {
        setWizardData({ ...wizardData, ...data.wizard_data });
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  async function saveProgress() {
    try {
      const { error } = await supabase
        .from("products")
        .update({ wizard_data: wizardData })
        .eq("id", productId);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }

  async function completeWizard() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          wizard_completed: true,
          wizard_data: wizardData,
        })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Setup completed successfully!");
      router.push(`/products/${productId}/settings`);
    } catch (error) {
      console.error("Error completing wizard:", error);
      toast.error("Failed to complete setup");
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    saveProgress();
    if (currentStep === 8) {
      completeWizard();
    } else {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrevious() {
    saveProgress();
    setCurrentStep(Math.max(1, currentStep - 1));
    window.scrollTo(0, 0);
  }

  function handleSkip() {
    handleNext();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/products/${productId}/settings`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Product Settings
            </Button>
          </div>

          <div className="mb-8 flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Setup: {productName}</h1>
          </div>

          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      step.id < currentStep
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : step.id === currentStep
                        ? "border-emerald-500 bg-background text-emerald-500"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        step.id === currentStep ? "text-emerald-500" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {step.subtitle && (
                      <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                    )}
                  </div>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mb-8 h-0.5 flex-1",
                      step.id < currentStep ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {currentStep === 1 && (
          <PipelineStagesStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 2 && (
          <AIStrategyStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 3 && (
          <ImportContactsStep
            productId={productId}
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 4 && (
          <EmailSettingsStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 5 && (
          <GoogleCalendarStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 6 && (
          <AIAutoReplyStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 7 && (
          <LLMToolsStep
            wizardData={wizardData}
            setWizardData={setWizardData}
          />
        )}

        {currentStep === 8 && (
          <TestLaunchStep
            productId={productId}
            productName={productName}
            wizardData={wizardData}
            onComplete={completeWizard}
          />
        )}

        {currentStep !== 8 && (
          <div className="mt-12 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {currentStepData.optional && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip this step
              </Button>
            )}
            <Button onClick={handleNext} disabled={saving} className="gap-2">
              {currentStep === 8 ? (
                saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4" />
                  </>
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function PipelineStagesStep({ wizardData, setWizardData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Pipeline Stages</h2>
        <p className="mt-2 text-muted-foreground">
          Define your sales pipeline stages. This determines how leads progress through your sales process.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {wizardData.customPipeline.slice(0, -1).map((stage: string, idx: number) => (
              <React.Fragment key={idx}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5",
                    stage === "Paid" && "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30",
                    stage === "Churned" && "border-red-500/50 bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  <span className="text-sm font-medium">{stage}</span>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </React.Fragment>
            ))}
            <div className="flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-50 px-3 py-1.5 dark:bg-red-950/30">
              <span className="text-sm font-medium">Churned</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-medium">Select a pipeline template:</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {PIPELINE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                if (!template.comingSoon) {
                  setWizardData({
                    ...wizardData,
                    pipelineTemplate: template.id,
                    customPipeline: [...template.stages, "Churned"],
                  });
                }
              }}
              disabled={template.comingSoon}
              className={cn(
                "relative rounded-lg border-2 p-4 text-left transition-all",
                wizardData.pipelineTemplate === template.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50",
                template.comingSoon && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                </div>
                {template.comingSoon && (
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="mt-4">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AIStrategyStep({ wizardData, setWizardData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">AI Marketing Strategy</h2>
        <p className="mt-2 text-muted-foreground">
          Review how your AI sales assistant will engage with prospects
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Your AI Marketing Plan</CardTitle>
              <CardDescription className="text-sm">
                How your AI sales assistant will engage with prospects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950">
                  🎯
                </div>
                <h4 className="font-semibold">Target Audience</h4>
              </div>
              <Textarea
                rows={4}
                placeholder="Describe your ideal customer profile..."
                value={wizardData.aiStrategy.targetAudience}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    aiStrategy: { ...wizardData.aiStrategy, targetAudience: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                  💡
                </div>
                <h4 className="font-semibold">Key Value Messages</h4>
              </div>
              <Textarea
                rows={5}
                placeholder="What are the main benefits you offer?"
                value={wizardData.aiStrategy.keyMessages}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    aiStrategy: { ...wizardData.aiStrategy, keyMessages: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950">
                  📧
                </div>
                <h4 className="font-semibold">Outreach Approach</h4>
              </div>
              <Textarea
                rows={4}
                placeholder="How should the AI engage with prospects?"
                value={wizardData.aiStrategy.outreachApproach}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    aiStrategy: { ...wizardData.aiStrategy, outreachApproach: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950">
                  🔄
                </div>
                <h4 className="font-semibold">Follow-up Strategy</h4>
              </div>
              <Textarea
                rows={4}
                placeholder="Describe your follow-up approach..."
                value={wizardData.aiStrategy.followupStrategy}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    aiStrategy: { ...wizardData.aiStrategy, followupStrategy: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                  📊
                </div>
                <h4 className="font-semibold">Success Metrics</h4>
              </div>
              <Textarea
                rows={4}
                placeholder="What metrics will you track?"
                value={wizardData.aiStrategy.successMetrics}
                onChange={(e) =>
                  setWizardData({
                    ...wizardData,
                    aiStrategy: { ...wizardData.aiStrategy, successMetrics: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Regenerate Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ImportContactsStep({ productId, wizardData, setWizardData }: any) {
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Import Contacts</h2>
        <p className="mt-2 text-muted-foreground">
          Add contacts to start AI outreach. You need at least one contact to test the AI in the final step.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle className="text-base">Current Contacts</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in this product
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Contact
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                Manage Contacts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 pr-4 text-left font-medium">Name</th>
                      <th className="pb-2 pr-4 text-left font-medium">Email</th>
                      <th className="pb-2 pr-4 text-left font-medium">Company</th>
                      <th className="pb-2 pr-4 text-left font-medium">Stage</th>
                      <th className="pb-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contacts.slice(0, 3).map((contact) => (
                      <tr key={contact.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium">
                              {contact.first_name?.[0] || contact.email[0].toUpperCase()}
                            </div>
                            <span>
                              {contact.first_name} {contact.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">{contact.email}</td>
                        <td className="py-3 pr-4">{contact.company || "-"}</td>
                        <td className="py-3 pr-4">{contact.stage || "-"}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                <span>Ready to proceed to next step</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No contacts yet. Add contacts to continue.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download Template</CardTitle>
          <CardDescription>Get the CSV template with all supported columns</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV File</CardTitle>
          <CardDescription>
            Upload any CSV file - AI will automatically match columns to contact fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Recommended columns:</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                <strong>Required:</strong> email
              </li>
              <li>
                <strong>Basic info:</strong> first_name, last_name, company, job_title
              </li>
              <li>
                <strong>Optional:</strong> phone, country, city, linkedin_url, notes
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv" className="flex-1" />
          </div>

          <p className="text-xs text-muted-foreground">
            Available stages: New Lead, Signup, Trial, Paid, Churned
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailSettingsStep({ wizardData, setWizardData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Email Settings</h2>
        <p className="mt-2 text-muted-foreground">
          Configure your email sending settings. Choose how you want to send emails.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Sending Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setWizardData({ ...wizardData, emailMethod: "official" })}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-8 text-center transition-all",
                wizardData.emailMethod === "official"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Cloud className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-1 font-semibold">Official Platform</h3>
              <p className="mb-3 text-xs text-muted-foreground">Send emails via our platform</p>
              {wizardData.emailMethod === "official" && (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700">
                  <Check className="mr-1 h-3 w-3" />
                  Configured
                </Badge>
              )}
            </button>
            <button
              onClick={() => setWizardData({ ...wizardData, emailMethod: "smtp" })}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all",
                wizardData.emailMethod === "smtp"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
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
            <CardTitle className="text-base">Step 1: Verify Email Address</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>Email Address to Verify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="sender@yourdomain.com"
              value={wizardData.senderEmail}
              onChange={(e) => setWizardData({ ...wizardData, senderEmail: e.target.value })}
              className="flex-1"
            />
            <Button size="sm">Send Verification</Button>
          </div>

          {wizardData.emailVerified && (
            <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/30">
              <Check className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{wizardData.senderEmail}</span>
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800">
                Verified
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base">Step 2: Domain Authentication (DKIM)</CardTitle>
          </div>
          <CardDescription>Why configure DKIM?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>DKIM (DomainKeys Identified Mail)</strong> is an email authentication method
              that proves your emails are legitimately sent from your domain.
            </p>
            <p>
              <strong>Without DKIM:</strong> Your emails are likely to land in spam folders, get
              rejected by major providers (Gmail, Outlook), and your domain reputation may be damaged
              over time.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⏳ Waiting for DNS propagation (can take up to 72 hours)
            </p>
          </div>

          <div className="rounded-lg border bg-blue-50/50 p-3 dark:bg-blue-950/20">
            <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Most DNS providers automatically append your domain{" "}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">[nordicaihost.com]</code>
                . If your provider requires the full name, add it manually.
              </p>
            </div>
          </div>

          <div className="text-sm">
            <p className="mb-2 font-medium">Add these DNS records to your domain:</p>
            <div className="space-y-2">
              {[
                { type: "TXT", name: "_amazonses", value: "1isMsf1t4776313litcu..." },
                { type: "CNAME", name: "v5pk1c1nda...._domainkey", value: "v5pk1c1nda...dkim.amazo..." },
              ].map((record, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border bg-card p-3">
                  <Badge variant="secondary">{record.type}</Badge>
                  <code className="flex-1 text-xs">{record.name}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Check className="h-3.5 w-3.5" />
            Verify DNS Records
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 3: Sender Information</CardTitle>
          <CardDescription>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700">Saved</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sender Name</Label>
              <Input
                value={wizardData.senderName}
                onChange={(e) => setWizardData({ ...wizardData, senderName: e.target.value })}
                placeholder="Your name or company"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sender Email</Label>
              <Input
                value={wizardData.senderEmail}
                onChange={(e) => setWizardData({ ...wizardData, senderEmail: e.target.value })}
                placeholder="sender@yourdomain.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reply-To Email</Label>
            <Input
              value={wizardData.replyToEmail}
              onChange={(e) => setWizardData({ ...wizardData, replyToEmail: e.target.value })}
              placeholder="reply@yourdomain.com"
            />
          </div>
          <p className="text-xs text-muted-foreground">Changes are saved automatically</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional: Send Test Email</CardTitle>
          <CardDescription>Test your email configuration by sending a test message</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="your-email@example.com" className="flex-1" />
            <Button size="sm" className="gap-2">
              <Mail className="h-3.5 w-3.5" />
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleCalendarStep({ wizardData, setWizardData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Google Calendar Integration</h2>
        <p className="mt-2 text-muted-foreground">
          Connect your Google Calendar to enable automatic appointment booking. This step is optional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-base">Connect Google Calendar</CardTitle>
          </div>
          <CardDescription>
            Connect your Google Calendar to enable automatic appointment booking when leads are
            qualified. The AI will book consultations directly on your calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="gap-2">
            <Calendar className="h-4 w-4" />
            Connect Google Calendar
          </Button>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Once connected, the AI can automatically schedule meetings with qualified leads based on
                your calendar availability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AIAutoReplyStep({ wizardData, setWizardData }: any) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">AI Auto-Reply Email</h2>
        <p className="mt-2 text-muted-foreground">
          Enable AI-powered auto-replies by setting up email forwarding for your incoming messages. The AI can respond to customer questions automatically. This step is optional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
          <CardDescription>
            For better deliverability and to prevent spam, you need a professional address like{" "}
            <code className="rounded bg-muted px-1">incoming@yourcompany.com</code> instead of a personal account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Note: Replies are not in production yet</p>
                <p className="mt-1">
                  Don't set up these forwarders until production. You can use a test-inbox to verify your
                  setup. If you need advice, our email is {" "}
                  <a href="mailto:support@company.com" className="underline">
                    support@company.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                <span>Step 1: Set Up Email Forwarding</span>
                <ArrowRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Forward incoming emails to:</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded border bg-muted px-3 py-1.5">
                        a1a87ae11@forttask.com
                      </code>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Example: Email forwarding setup (Gmail, Outlook):</p>
                    <p className="mt-1 text-muted-foreground">
                      Go to email settings → Forwarding → Add forwarding address
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Click "Add a forwarding address" button:</p>
                    <p className="mt-1 text-muted-foreground">
                      The AI must receive your incoming emails to reply, but will only send out replies you've approved.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    4
                  </div>
                  <div>
                    <p className="font-medium">
                      From the forwarding address{" "}
                      <code className="rounded bg-muted px-1">a1a87ae11@forttask.com</code>:
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Go to the inbox settings → Email and replying tab → Copy verification link and click
                      "Confirm"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Google Verification:</p>
                    <p className="mt-1 text-muted-foreground">
                      After you add the forwarding address, Google will send a verification code. Check your
                      inbox and confirm.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    6
                  </div>
                  <div>
                    <p className="font-medium">Activate confirmation email:</p>
                    <p className="mt-1 text-muted-foreground">
                      The link should forward all your emails, where the AI can process and verify the setup.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    7
                  </div>
                  <div>
                    <p className="font-medium">Once the verification email is sent:</p>
                    <p className="mt-1 text-muted-foreground">
                      Go back and click the link to verify. Once verified, you can start testing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                    8
                  </div>
                  <div>
                    <p className="font-medium">Email Forwarding Setup Done</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Step 2: Configure Auto-Reply Settings</h4>
            <div className="space-y-2">
              <Label>Enable Auto-Reply</Label>
              <Select defaultValue="disabled">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              ✓ Auto-reply setup instructions reviewed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LLMToolsStep({ wizardData, setWizardData }: any) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Train AI with Real-Time Customer Data</h2>
        <p className="mt-2 text-muted-foreground">
          Connect your CRM or other external systems to feed the AI with live customer data. The more
          accurate and up-to-date your data, the better the AI can personalize responses and outreach.
          This step is optional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                <span className="font-semibold">How Data Sources Work</span>
                <ArrowRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <CardDescription className="text-sm">
                Learn how external APIs are used to check for new customer activity
              </CardDescription>

              <div className="mt-4 rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/20">
                <div className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div className="text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Better AI Results:</p>
                    <p className="mt-1">
                      The more accurate your customer data,{" "}
                      <strong>the better AI can personalize outreach and timing</strong>. Connect your CRM
                      or other systems to give AI real-time customer insights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <h4 className="font-semibold">How it Works</h4>
                <ol className="space-y-2 pl-5">
                  <li className="list-decimal">
                    <strong>Daily Check</strong> - System calls your API with customer email
                  </li>
                  <li className="list-decimal">
                    <strong>Get Latest Activity</strong> - Fetch recent customer behaviors from your systems
                  </li>
                  <li className="list-decimal">
                    <strong>AI Analysis</strong> - AI uses this data to craft personalized, timely outreach
                  </li>
                  <li className="list-decimal">
                    <strong>Smart Timing</strong> - AI contacts customers when they're most engaged
                  </li>
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Specification</CardTitle>
          <CardDescription>Send Request Parameters (POST):</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <pre className="text-xs">
              <code>{`{
  "email": "customer@example.com",
  "pageSize": 1,
  "pageSize": 10
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Required Response Format:</h4>
            <div className="rounded-lg bg-muted p-4">
              <pre className="text-xs">
                <code>{`{
  "success": true,
  "data": [
    { "updatedAt": "2024-01-15T10:00Z", ... },
    { "updatedAt": "2024-01-14T09:00Z", ... }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          <div className="rounded-lg border bg-blue-50/50 p-3 dark:bg-blue-950/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> Data must be sorted by{" "}
              <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">updatedAt</code> descending (newest
              first)
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Tips for Better Results</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Include timestamps:</strong> Add{" "}
                  <code className="rounded bg-muted px-1">updatedAt</code> so AI knows when activities
                  happened
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Recent first:</strong> Return newest activities first for best AI analysis
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Rich data:</strong> Include form submissions, email opens, purchases, support
                  tickets
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Empty results:</strong> Return empty Data array if no activity found
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Example Response</h4>
            <div className="rounded-lg bg-muted p-4">
              <pre className="text-xs">
                <code>{`{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "form_submitted",
      "updatedAt": "2024-01-15T10:00Z",
      "details": "Requested product demo"
    },
    {
      "id": 122,
      "type": "email_opened",
      "updatedAt": "2024-01-14T08:00Z",
      "details": "Opened: New Year Promo"
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Data Sources</CardTitle>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Data Source
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-medium">No data sources configured</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add an external API to check for new customer activity from your CRM or other systems
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TestLaunchStep({ productId, productName, wizardData, onComplete }: any) {
  const router = useRouter();
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [selectedContact, setSelectedContact] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [completing, setCompleting] = React.useState(false);

  React.useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  const hasContacts = contacts.length > 0;
  const pipelineConfigured = wizardData.customPipeline?.length > 0;
  const aiStrategyDefined = Object.values(wizardData.aiStrategy || {}).some((v) => v);
  const emailConfigured = wizardData.emailMethod && wizardData.senderEmail;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Test & Launch</h2>
        <p className="mt-2 text-muted-foreground">
          Test the AI with your contacts, then go to Campaigns page to start your sales automation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preparation Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                pipelineConfigured ? "bg-emerald-500" : "border-2 border-border"
              )}
            >
              {pipelineConfigured && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pipeline configured</span>
              {pipelineConfigured && (
                <span className="text-xs text-muted-foreground">
                  ({wizardData.customPipeline.length} stages)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                aiStrategyDefined ? "bg-emerald-500" : "border-2 border-border"
              )}
            >
              {aiStrategyDefined && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Strategy defined</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                emailConfigured ? "bg-emerald-500" : "border-2 border-border"
              )}
            >
              {emailConfigured && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email configured</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                hasContacts ? "bg-emerald-500" : "border-2 border-border"
              )}
            >
              {hasContacts && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contacts imported</span>
              {hasContacts && (
                <span className="text-xs text-muted-foreground">({contacts.length} contacts)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">LLM Tools configured</span>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-base">Preview AI Email</CardTitle>
          </div>
          <CardDescription>
            Pick a contact, see what email AI will write for them. No email will be sent yet — just a preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Pick a contact</Label>
              <div className="mt-2 flex gap-2">
                <Select
                  value={selectedContact}
                  onValueChange={setSelectedContact}
                  disabled={!hasContacts}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a contact to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name || contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="default" disabled={!selectedContact} className="gap-2">
                  <Play className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>

            {!hasContacts && (
              <p className="text-sm text-muted-foreground">
                Add contacts in step 3 to test the AI preview
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Rocket className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold">Setup Complete!</h3>
          <p className="mt-2 text-muted-foreground">
            Go to the Campaigns page to start your AI sales automation.
          </p>
          <Button
            size="lg"
            className="mt-6 gap-2"
            disabled={completing}
            onClick={async () => {
              setCompleting(true);
              await onComplete();
              router.push("/campaigns");
            }}
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Go to Sales Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-12 flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          size="lg"
          className="gap-2"
          disabled={completing}
          onClick={async () => {
            setCompleting(true);
            await onComplete();
            router.push("/campaigns");
          }}
        >
          {completing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Go to Campaigns
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
