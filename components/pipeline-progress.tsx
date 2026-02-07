"use client";

import { Loader2, Check, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PIPELINE_STEPS } from "@/lib/constants";
import type { PipelineStep } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PipelineProgressProps {
  currentStep: PipelineStep;
  visible: boolean;
}

const STEP_ORDER: PipelineStep[] = ["scraping", "filtering", "posts", "emails", "done"];

function getStepStatus(
  stepId: string,
  currentStep: PipelineStep
): "completed" | "active" | "pending" {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  const stepIdx = STEP_ORDER.indexOf(stepId as PipelineStep);

  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx && currentStep !== "done") return "active";
  if (currentStep === "done") return "completed";
  return "pending";
}

export function PipelineProgress({
  currentStep,
  visible,
}: PipelineProgressProps) {
  if (!visible) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium">Processing Your Search</p>
        </div>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, index) => {
            const status = getStepStatus(step.id, currentStep);

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300",
                      status === "completed" &&
                        "border-emerald-500 bg-emerald-500 text-white",
                      status === "active" &&
                        "border-primary bg-primary/10 text-primary",
                      status === "pending" &&
                        "border-muted-foreground/30 text-muted-foreground/30"
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : status === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 fill-current" />
                    )}
                  </div>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mt-1 h-4 w-0.5 transition-colors duration-300",
                        status === "completed"
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/20"
                      )}
                    />
                  )}
                </div>
                <div className="pt-0.5">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      status === "completed" && "text-emerald-600 dark:text-emerald-400",
                      status === "active" && "text-foreground",
                      status === "pending" && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </p>
                  {status === "active" && (
                    <p className="mt-0.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
