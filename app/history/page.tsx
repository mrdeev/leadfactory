"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Mail,
  Phone,
  Linkedin,
  History,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <span className="text-sm text-muted-foreground">
      {parts.length > 0 ? parts.join(" | ") : "No filters"}
    </span>
  );
}

export default function HistoryPage() {
  const [searches, setSearches] = React.useState<SearchRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("searches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setSearches((data as SearchRecord[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Search History</h1>
          <p className="text-sm text-muted-foreground">
            View all past lead searches and their results
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">All Searches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No searches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run your first search from the dashboard
              </p>
              <Link href="/" className="mt-4">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">
                      <Users className="mx-auto h-4 w-4" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Linkedin className="mx-auto h-4 w-4" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Mail className="mx-auto h-4 w-4" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Phone className="mx-auto h-4 w-4" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map((search) => {
                    const isClickable = search.status === "completed";
                    const row = (
                      <TableRow
                        key={search.id}
                        className={isClickable ? "cursor-pointer hover:bg-muted/50" : ""}
                      >
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(search.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <FilterSummary filters={search.filters as unknown as Record<string, unknown>} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={search.status} />
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums">
                          {search.total_leads}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {search.leads_with_linkedin}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {search.leads_with_email}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {search.leads_with_phone}
                        </TableCell>
                      </TableRow>
                    );

                    if (isClickable) {
                      return (
                        <Link
                          key={search.id}
                          href={`/searches/${search.id}`}
                          className="contents"
                        >
                          {row}
                        </Link>
                      );
                    }

                    return row;
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
