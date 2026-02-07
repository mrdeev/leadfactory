"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Mail,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Check,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import type { LeadResult } from "@/lib/types";

interface LeadsTableProps {
  leads: LeadResult[];
  isLoading: boolean;
  onViewEmail: (lead: LeadResult) => void;
}

type SortKey = "full_name" | "org_name" | "position";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

export function LeadsTable({ leads, isLoading, onViewEmail }: LeadsTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("full_name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [page, setPage] = React.useState(0);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [leads]);

  const sorted = React.useMemo(() => {
    return [...leads].sort((a, b) => {
      const aVal = (a[sortKey] || "").toLowerCase();
      const bVal = (b[sortKey] || "").toLowerCase();
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [leads, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const saveToContacts = async (lead: LeadResult) => {
    setSavingId(lead.id);
    const { error } = await supabase.from("contacts").insert({
      full_name: lead.full_name,
      email: lead.email || "",
      email_status: lead.email_status || "",
      phone: lead.phone || "",
      position: lead.position || "",
      company: lead.org_name || "",
      industry: lead.org_industry || "",
      linkedin_url: lead.linkedin_url || "",
      city: lead.city || "",
      state: lead.state || "",
      country: lead.country || "",
      stage: "new",
      source: "search",
      score: 0,
      tags: [],
      lead_id: lead.id,
      search_id: lead.search_id,
    });

    setSavingId(null);

    if (error) {
      toast.error("Failed to save contact");
      return;
    }

    setSavedIds((prev) => new Set(prev).add(lead.id));
    toast.success(`${lead.full_name} saved to contacts`);
  };

  const saveAllToContacts = async () => {
    const unsaved = leads.filter((l) => !savedIds.has(l.id));
    if (unsaved.length === 0) return;

    const rows = unsaved.map((lead) => ({
      full_name: lead.full_name,
      email: lead.email || "",
      email_status: lead.email_status || "",
      phone: lead.phone || "",
      position: lead.position || "",
      company: lead.org_name || "",
      industry: lead.org_industry || "",
      linkedin_url: lead.linkedin_url || "",
      city: lead.city || "",
      state: lead.state || "",
      country: lead.country || "",
      stage: "new",
      source: "search",
      score: 0,
      tags: [],
      lead_id: lead.id,
      search_id: lead.search_id,
    }));

    const { error } = await supabase.from("contacts").insert(rows);

    if (error) {
      toast.error("Failed to save contacts");
      return;
    }

    setSavedIds(new Set(leads.map((l) => l.id)));
    toast.success(`${unsaved.length} contacts saved`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={saveAllToContacts}
          disabled={savedIds.size === leads.length}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {savedIds.size === leads.length ? "All Saved" : "Save All to Contacts"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium"
                    onClick={() => toggleSort("full_name")}
                  >
                    Name
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium"
                    onClick={() => toggleSort("position")}
                  >
                    Title
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium"
                    onClick={() => toggleSort("org_name")}
                  >
                    Company
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>LinkedIn</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {lead.position}
                  </TableCell>
                  <TableCell>{lead.org_name}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                    {lead.org_industry}
                  </TableCell>
                  <TableCell>
                    {lead.email ? (
                      <div className="flex items-center gap-2">
                        <span className="max-w-[160px] truncate text-sm">
                          {lead.email}
                        </span>
                        <Badge
                          variant={
                            lead.email_status?.toLowerCase() === "verified"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            lead.email_status?.toLowerCase() === "verified"
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }
                        >
                          {lead.email_status || "Unknown"}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.phone ? (
                      <span className="text-sm">{lead.phone}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.linkedin_url ? (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {savedIds.has(lead.id) ? (
                        <Button variant="ghost" size="sm" className="gap-1 text-emerald-600" disabled>
                          <Check className="h-3.5 w-3.5" />
                          Saved
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 opacity-70 transition-opacity group-hover:opacity-100"
                          onClick={() => saveToContacts(lead)}
                          disabled={savingId === lead.id}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      )}
                      {lead.generated_email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 opacity-70 transition-opacity group-hover:opacity-100"
                          onClick={() => onViewEmail(lead)}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1} -{" "}
            {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}{" "}
            leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
