"use client"

import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface WizardStepperProps {
    steps: {
        id: number
        label: string
    }[]
    currentStep: number
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
    return (
        <div className="w-full py-6 bg-white border-b border-slate-200 mb-8">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="flex items-center justify-between relative">
                    {/* Background Line */}
                    <div className="absolute left-0 top-[18px] w-full h-[1px] bg-slate-100 -z-10" />

                    {/* Progress Line */}
                    <motion.div
                        className="absolute left-0 top-[18px] h-[1px] bg-emerald-500 -z-10"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    />

                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id
                        const isActive = currentStep === step.id

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 relative bg-white px-3">
                                <motion.div
                                    className={cn(
                                        "w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300",
                                        isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100" :
                                            isActive ? "border-slate-900 bg-white text-slate-900 ring-4 ring-slate-50" : "border-slate-200 bg-white text-slate-400"
                                    )}
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.05 : 1,
                                    }}
                                >
                                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                                </motion.div>
                                <span className={cn(
                                    "text-[11px] font-semibold transition-colors duration-300 whitespace-nowrap",
                                    isCompleted ? "text-emerald-600" : isActive ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
