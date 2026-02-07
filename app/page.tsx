"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, ExternalLink, Save } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { LeadsTable } from "@/components/leads-table";
import { EmailDialog } from "@/components/email-dialog";
import { CsvExport } from "@/components/csv-export";
import { PipelineProgress } from "@/components/pipeline-progress";
import { ResultsSummary } from "@/components/results-summary";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/components/product-context";
import type { FormValues, LeadResult, PipelineStep, PipelineResponse } from "@/lib/types";

export default function DashboardPage() {
  const { selectedProduct } = useProduct();
  const [isLoading, setIsLoading] = React.useState(false);
  const [pipelineStep, setPipelineStep] = React.useState<PipelineStep>("scraping");
  const [leads, setLeads] = React.useState<LeadResult[]>([]);
  const [summary, setSummary] = React.useState<PipelineResponse["summary"] | null>(null);
  const [searchId, setSearchId] = React.useState<string | null>(null);
  const [emailDialogLead, setEmailDialogLead] = React.useState<LeadResult | null>(null);

  const handleSearch = async (values: FormValues) => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    setIsLoading(true);
    setLeads([]);
    setSummary(null);
    setSearchId(null);
    setPipelineStep("scraping");

    const stepTimer = (step: PipelineStep, delay: number) =>
      setTimeout(() => setPipelineStep(step), delay);

    const t1 = stepTimer("filtering", 8000);
    const t2 = stepTimer("posts", 16000);
    const t3 = stepTimer("emails", 25000);

    try {
      const response = await fetch("/api/run-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, productId: selectedProduct.id }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      const data: PipelineResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setPipelineStep("done");
      setLeads(data.leads || []);
      setSummary(data.summary);
      setSearchId(data.searchId);

      toast.success(
        `Found ${data.summary.totalLeads} leads with ${data.summary.leadsWithEmail} emails`
      );
    } catch (error) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      toast.error(
        error instanceof Error ? error.message : "Search pipeline failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Search for B2B leads, scrape their LinkedIn activity, and generate
          personalized outreach emails
          {selectedProduct && (
            <span className="font-medium text-foreground"> for {selectedProduct.name}</span>
          )}
          .
        </p>
      </div>

      <div className="space-y-8">
        <SearchForm onSubmit={handleSearch} isLoading={isLoading} />

        {isLoading && (
          <PipelineProgress currentStep={pipelineStep} visible={isLoading} />
        )}

        {summary && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {searchId && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <Save className="h-5 w-5 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Results saved automatically</p>
                  <p className="text-xs text-muted-foreground">
                    You can access this search anytime from &ldquo;My Searches&rdquo; in the sidebar.
                  </p>
                </div>
                <Link href={`/searches/${searchId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    View Saved
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            <ResultsSummary {...summary} />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Results ({leads.length} leads)
              </h2>
              <CsvExport leads={leads} />
            </div>

            <LeadsTable
              leads={leads}
              isLoading={false}
              onViewEmail={setEmailDialogLead}
            />
          </div>
        )}

        {!isLoading && !summary && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">Ready to find leads</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Configure your search filters above and click &ldquo;Find Leads&rdquo; to
              start the pipeline. Results will appear here.
            </p>
          </div>
        )}
      </div>

      <EmailDialog
        lead={emailDialogLead}
        open={!!emailDialogLead}
        onClose={() => setEmailDialogLead(null)}
      />
    </div>
  );
}
