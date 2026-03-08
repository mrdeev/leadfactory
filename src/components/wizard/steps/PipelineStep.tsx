"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Stage {
    id: string
    name: string
    color?: string
}

interface Template {
    id: string
    name: string
    stages: Stage[]
    comingSoon?: boolean
}

const TEMPLATES: Template[] = [
    {
        id: "saas",
        name: "SaaS",
        stages: [
            { id: "new-lead", name: "New Lead", color: "bg-white border-gray-200" },
            { id: "signup", name: "Signup", color: "bg-white border-gray-200" },
            { id: "trial", name: "Trial", color: "bg-white border-gray-200" },
            { id: "paid", name: "Paid", color: "bg-emerald-100 border-emerald-200 text-emerald-800" },
            { id: "churned", name: "Churned", color: "bg-red-100 border-red-200 text-red-800" },
        ]
    },
    {
        id: "service",
        name: "Service",
        stages: [
            { id: "lead", name: "Lead", color: "bg-white border-gray-200" },
            { id: "contacted", name: "Contacted", color: "bg-white border-gray-200" },
            { id: "qualified", name: "Qualified", color: "bg-white border-gray-200" },
            { id: "consult", name: "Consult", color: "bg-white border-gray-200" },
            { id: "booked", name: "Booked", color: "bg-emerald-100 border-emerald-200 text-emerald-800" },
        ]
    },
    {
        id: "b2b",
        name: "B2B Sales",
        stages: [],
        comingSoon: true
    },
    {
        id: "lead-gen",
        name: "Lead Gen",
        stages: [],
        comingSoon: true
    },
    {
        id: "ecommerce",
        name: "E-commerce",
        stages: [],
        comingSoon: true
    }
]

export function PipelineStep({ productId }: { productId: string }) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>("saas")
    const [stages, setStages] = useState<Stage[]>(TEMPLATES[0].stages)

    const handleSelectTemplate = async (template: Template) => {
        if (template.comingSoon) return
        setSelectedTemplate(template.id)
        setStages(template.stages)

        // Persist to backend
        try {
            await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipelineTemplate: template.id }),
            });
        } catch (error) {
            console.error('Failed to save pipeline template:', error);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Pipeline Stages</h2>
                <p className="text-sm text-slate-500 mt-1">Define your sales pipeline stages. This determines how leads progress through your sales process.</p>
            </div>

            {/* Current Pipeline Visualization */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50 shadow-inner">
                <h3 className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Live Pipeline Preview</h3>
                <div className="flex flex-wrap items-center gap-3">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center">
                            <div className={cn(
                                "px-5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm",
                                stage.color || "bg-white border-slate-200 text-slate-700"
                            )}>
                                {stage.name}
                            </div>
                            {index < stages.length - 1 && (
                                <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                            )}
                        </div>
                    ))}
                    <Button variant="outline" size="icon" className="h-10 w-10 ml-3 border-dashed border-slate-300 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all rounded-xl">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Select a pipeline template:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEMPLATES.map((template) => (
                        <Card
                            key={template.id}
                            className={cn(
                                "p-6 cursor-pointer transition-all hover:bg-slate-50 relative overflow-hidden rounded-xl",
                                selectedTemplate === template.id ? "border-slate-400 bg-slate-50 shadow-sm" : "border-slate-200 bg-white",
                                template.comingSoon && "opacity-60 cursor-not-allowed grayscale"
                            )}
                            onClick={() => handleSelectTemplate(template)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-slate-900">{template.name}</span>
                                {selectedTemplate === template.id && (
                                    <div className="h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm shadow-emerald-100">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                )}
                                {template.comingSoon && (
                                    <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded text-slate-500 uppercase tracking-wider font-bold border border-slate-200">Coming Soon</span>
                                )}
                            </div>

                            {!template.comingSoon && (
                                <div className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-1.5">
                                    {template.stages.map((s, i) => (
                                        <span key={s.id} className="flex items-center">
                                            {s.name}
                                            {i < template.stages.length - 1 && (
                                                <ChevronRight className="w-3 h-3 mx-1 opacity-30" />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
