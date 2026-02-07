"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Users,
  Linkedin,
  Mail,
  Phone,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsTable } from "@/components/leads-table";
import { CsvExport } from "@/components/csv-export";
import { EmailDialog } from "@/components/email-dialog";
import { supabase } from "@/lib/supabase";
import type { LeadResult, SearchRecord } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "running":
      return (
        <Badge className="gap-1 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function FilterTags({ filters }: { filters: Record<string, unknown> }) {
  const tags: { label: string; value: string }[] = [];

  const industries = filters.companyIndustryIncludes as string[] | undefined;
  if (industries) {
    industries.forEach((i) => tags.push({ label: "Industry", value: i }));
  }

  const cities = filters.companyLocationCityIncludes as string[] | undefined;
  if (cities) {
    cities.forEach((c) => tags.push({ label: "City", value: c }));
  }

  const titles = filters.personTitleIncludes as string[] | undefined;
  if (titles) {
    titles.forEach((t) => tags.push({ label: "Title", value: t }));
  }

  const keywords = filters.companyKeywordIncludes as string[] | undefined;
  if (keywords) {
    keywords.forEach((k) => tags.push({ label: "Keyword", value: k }));
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <Badge key={`${tag.label}-${i}`} variant="secondary" className="text-xs font-normal">
          {tag.value}
        </Badge>
      ))}
    </div>
  );
}

const statItems = [
  { key: "total_leads", label: "Total Leads", icon: Users, color: "text-primary" },
  { key: "leads_with_linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-500" },
  { key: "leads_with_email", label: "Email", icon: Mail, color: "text-emerald-500" },
  { key: "leads_with_phone", label: "Phone", icon: Phone, color: "text-amber-500" },
] as const;

export default function SearchDetailPage() {
  const params = useParams();
  const searchId = params.id as string;

  const [search, setSearch] = React.useState<SearchRecord | null>(null);
  const [leads, setLeads] = React.useState<LeadResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [emailDialogLead, setEmailDialogLead] = React.useState<LeadResult | null>(null);

  React.useEffect(() => {
    async function load() {
      const [searchRes, leadsRes] = await Promise.all([
        supabase.from("searches").select("*").eq("id", searchId).maybeSingle(),
        supabase.from("leads").select("*").eq("search_id", searchId).order("created_at"),
      ]);

      if (searchRes.data) {
        setSearch(searchRes.data as SearchRecord);
      }

      const rawLeads = (leadsRes.data || []) as LeadResult[];

      const leadIds = rawLeads.map((l) => l.id);
      if (leadIds.length > 0) {
        const [postsRes, emailsRes] = await Promise.all([
          supabase.from("linkedin_posts").select("*").in("lead_id", leadIds),
          supabase.from("generated_emails").select("*").in("lead_id", leadIds),
        ]);

        const postsMap = new Map<string, typeof postsRes.data>();
        (postsRes.data || []).forEach((p: Record<string, unknown>) => {
          const lid = p.lead_id as string;
          if (!postsMap.has(lid)) postsMap.set(lid, []);
          postsMap.get(lid)!.push(p);
        });

        const emailsMap = new Map<string, Record<string, unknown>>();
        (emailsRes.data || []).forEach((e: Record<string, unknown>) => {
          emailsMap.set(e.lead_id as string, e);
        });

        rawLeads.forEach((lead) => {
          lead.linkedin_posts = (postsMap.get(lead.id) || []) as LeadResult["linkedin_posts"];
          lead.generated_email = (emailsMap.get(lead.id) || undefined) as LeadResult["generated_email"];
        });
      }

      setLeads(rawLeads);
      setLoading(false);
    }
    load();
  }, [searchId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!search) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <XCircle className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Search not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This search may have been removed or the link is invalid.
          </p>
          <Link href="/searches" className="mt-4">
            <Button size="sm">View All Searches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filters = search.filters as unknown as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/searches">
            <Button variant="ghost" size="icon" className="mt-0.5 h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Search Results</h1>
              <StatusBadge status={search.status} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(search.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
            {filters && (
              <div className="mt-3">
                <FilterTags filters={filters} />
              </div>
            )}
          </div>
        </div>
        <CsvExport leads={leads} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          const value = search[stat.key];
          return (
            <Card
              key={stat.key}
              className="border-0 bg-muted/50 transition-colors hover:bg-muted/70"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={stat.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Leads ({leads.length})
          </h2>
        </div>
        <LeadsTable
          leads={leads}
          isLoading={false}
          onViewEmail={setEmailDialogLead}
        />
      </div>

      <EmailDialog
        lead={emailDialogLead}
        open={!!emailDialogLead}
        onClose={() => setEmailDialogLead(null)}
      />
    </div>
  );
}
