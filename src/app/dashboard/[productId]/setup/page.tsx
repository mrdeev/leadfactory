"use client"

import { useState } from "react"
import { WizardStepper } from "@/components/wizard/WizardStepper"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react"

// Import Steps
import { PipelineStep } from "@/components/wizard/steps/PipelineStep"
import { AiStrategyStep } from "@/components/wizard/steps/AiStrategyStep"
import { ImportContactsStep } from "@/components/wizard/steps/ImportContactsStep"
import { EmailSettingsStep } from "@/components/wizard/steps/EmailSettingsStep"
import { GoogleCalendarStep } from "@/components/wizard/steps/GoogleCalendarStep"
import { AiAutoReplyStep } from "@/components/wizard/steps/AiAutoReplyStep"
import { LinkedInConnectStep } from "@/components/wizard/steps/LinkedInConnectStep"
import { useRouter } from "next/navigation"

const STEPS = [
    { id: 1, label: "Pipeline Stages" },
    { id: 2, label: "AI Sales Strategy" },
    { id: 3, label: "Import Contacts" },
    { id: 4, label: "Email Settings" },
    { id: 5, label: "Google Calendar" },
    { id: 6, label: "AI Auto-Reply" },
    { id: 7, label: "Connect LinkedIn" },
]

import { use, useEffect } from "react";

export default function SetupWizardPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params);
    const [currentStep, setCurrentStep] = useState(1)
    const [product, setProduct] = useState<any>(null)
    const [isValidating, setIsValidating] = useState(true)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const verifyProduct = async () => {
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (res.ok) {
                    setProduct(await res.json());
                } else {
                    setValidationError(res.status === 404 ? 'Product not found' : 'Failed to load product');
                }
            } catch (err) {
                setValidationError('Connection error. Please try again.');
            } finally {
                setIsValidating(false);
            }
        };
        verifyProduct();
    }, [productId]);

    const handleNext = async () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1)
        } else {
            // Generate AI campaign sequence then navigate directly to the sequence page
            setIsGenerating(true)
            try {
                await fetch('/api/campaign/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId }),
                })
            } catch (err) {
                console.error('Failed to generate campaign sequence:', err)
            } finally {
                setIsGenerating(false)
            }
            router.push(`/dashboard/campaigns/${productId}`)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        } else {
            router.back()
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <PipelineStep productId={productId} />
            case 2: return <AiStrategyStep productId={productId} />
            case 3: return <ImportContactsStep productId={productId} />
            case 4: return <EmailSettingsStep productId={productId} />
            case 5: return <GoogleCalendarStep productId={productId} />
            case 6: return <AiAutoReplyStep productId={productId} />
            case 7: return <LinkedInConnectStep productId={productId} />
            default: return null
        }
    }

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                    <p className="text-slate-500 font-medium">Verifying company context...</p>
                </div>
            </div>
        )
    }

    if (validationError || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">{validationError || 'Access Denied'}</h2>
                        <p className="text-slate-500">The setup wizard must be connected to an existing company to function.</p>
                    </div>
                    <Button onClick={() => router.push('/dashboard')} className="w-full bg-black hover:bg-slate-800 text-white h-12 rounded-xl font-semibold">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            <WizardStepper steps={STEPS} currentStep={currentStep} />

            <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex flex-col items-center text-center">
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => router.push(`/dashboard/${productId}`)}
                        className="text-slate-500 hover:text-slate-900 no-underline flex items-center gap-1 mb-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to Company Settings
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Campaign</h1>
                    </div>
                    <p className="mt-2 text-slate-500 text-sm">Choose a product to configure your Campaign/sales automation.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm min-h-[500px]">
                    {renderStep()}
                </div>

                <div className="flex justify-between mt-10">
                    <Button variant="ghost" onClick={handleBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
                        <ChevronLeft className="h-4 w-4" /> {currentStep === 1 ? "Cancel" : "Previous Step"}
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={isGenerating}
                        className="bg-[#111111] hover:bg-black text-white px-10 h-14 rounded-xl font-bold text-lg min-w-[200px] shadow-xl shadow-slate-200 transform transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                        {currentStep === STEPS.length ? (
                            isGenerating ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating AI Sequence...</>
                            ) : (
                                <>Continue to Campaigns <ChevronRight className="ml-2 h-5 w-5" /></>
                            )
                        ) : (
                            <>Next Step <ChevronRight className="ml-2 h-5 w-5" /></>
                        )}
                    </Button>
                </div>
            </main>
        </div>
    )
}
