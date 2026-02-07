"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FolderOpen,
  Users,
  Mail,
  Phone,
  Linkedin,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import type { SearchRecord } from "@/lib/types";

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

function FilterSummary({ filters }: { filters: Record<string, unknown> }) {
  const parts: string[] = [];

  const industries = filters.companyIndustryIncludes as string[] | undefined;
  if (industries && industries.length > 0) {
    parts.push(industries.slice(0, 2).join(", ") + (industries.length > 2 ? ` +${industries.length - 2}` : ""));
  }

  const cities = filters.companyLocationCityIncludes as string[] | undefined;
  if (cities && cities.length > 0) {
    parts.push(cities.join(", "));
  }

  const titles = filters.personTitleIncludes as string[] | undefined;
  if (titles && titles.length > 0) {
    parts.push(titles.slice(0, 2).join(", ") + (titles.length > 2 ? ` +${titles.length - 2}` : ""));
  }

  if (parts.length === 0) return <span className="text-muted-foreground">General search</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((part, i) => (
        <Badge key={i} variant="secondary" className="text-xs font-normal">
          {part}
        </Badge>
      ))}
    </div>
  );
}

export default function SearchesPage() {
  const [searches, setSearches] = React.useState<SearchRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("searches")
        .select("*")
        .in("status", ["completed", "running"])
        .order("created_at", { ascending: false })
        .limit(50);

      setSearches((data as SearchRecord[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Searches</h1>
            <p className="text-sm text-muted-foreground">
              Browse and access your saved lead search results
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium">No saved searches yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Run your first search from the dashboard and your results will be automatically saved here.
          </p>
          <Link href="/" className="mt-4">
            <Button>Start Searching</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {searches.map((search) => {
            const filters = search.filters as unknown as Record<string, unknown>;
            return (
              <Link key={search.id} href={`/searches/${search.id}`}>
                <Card className="group h-full cursor-pointer border transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <StatusBadge status={search.status} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(search.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <div className="mb-4">
                          <FilterSummary filters={filters} />
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <div className="grid grid-cols-4 gap-3 border-t pt-3">
                      <div className="text-center">
                        <Users className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-semibold tabular-nums">{search.total_leads}</p>
                        <p className="text-[10px] text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <Linkedin className="mx-auto mb-1 h-3.5 w-3.5 text-sky-500" />
                        <p className="text-sm font-semibold tabular-nums">{search.leads_with_linkedin}</p>
                        <p className="text-[10px] text-muted-foreground">LinkedIn</p>
                      </div>
                      <div className="text-center">
                        <Mail className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-500" />
                        <p className="text-sm font-semibold tabular-nums">{search.leads_with_email}</p>
                        <p className="text-[10px] text-muted-foreground">Email</p>
                      </div>
                      <div className="text-center">
                        <Phone className="mx-auto mb-1 h-3.5 w-3.5 text-amber-500" />
                        <p className="text-sm font-semibold tabular-nums">{search.leads_with_phone}</p>
                        <p className="text-[10px] text-muted-foreground">Phone</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
