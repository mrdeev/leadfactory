"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Pencil,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { supabase } from "@/lib/supabase";
import type { Contact, ContactStage } from "@/lib/types";
import Papa from "papaparse";

const STAGE_CONFIG: Record<ContactStage, { label: string; className: string }> = {
  new: { label: "New", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  contacted: { label: "Contacted", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  qualified: { label: "Qualified", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  proposal: { label: "Proposal", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  won: { label: "Won", className: "bg-green-600/10 text-green-700 dark:text-green-400" },
  lost: { label: "Lost", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");
  const [page, setPage] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const loadContacts = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (stageFilter !== "all") {
      query = query.eq("stage", stageFilter);
    }

    const { data } = await query;
    setContacts((data as Contact[]) || []);
    setLoading(false);
  }, [stageFilter]);

  React.useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const startItem = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const endItem = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  React.useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [searchQuery, stageFilter]);

  const allOnPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("contacts").delete().eq("id", id);
    toast.success("Contact removed");
    loadContacts();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await supabase.from("contacts").delete().in("id", ids);
    setSelectedIds(new Set());
    toast.success(`${ids.length} contacts removed`);
    loadContacts();
  };

  const handleExport = () => {
    const rows = (selectedIds.size > 0 ? filtered.filter((c) => selectedIds.has(c.id)) : filtered).map((c) => ({
      Name: c.full_name,
      Email: c.email,
      Phone: c.phone,
      Title: c.position,
      Company: c.company,
      Industry: c.industry,
      Stage: c.stage,
      Source: c.source,
      Score: c.score,
      City: c.city,
      LinkedIn: c.linkedin_url,
      Added: c.created_at,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toLowerCase();

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Contacts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your contacts and leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Search className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">
              {searchQuery || stageFilter !== "all" ? "No contacts match your filters" : "No contacts yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery || stageFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first contact or save leads from a search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((contact) => {
                  const stageInfo = STAGE_CONFIG[contact.stage] || STAGE_CONFIG.new;
                  return (
                    <TableRow key={contact.id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={() => toggleOne(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {getInitials(contact.full_name)}
                          </div>
                          <span className="text-sm font-medium">{contact.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={stageInfo.className}>
                          {stageInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.company ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{contact.company}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="max-w-[180px] truncate">{contact.email}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal capitalize">
                          {contact.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border px-1.5 text-xs font-medium tabular-nums">
                          {contact.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contact.tags.length > 0 ? (
                          <div className="flex gap-1">
                            {contact.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(contact.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {contact.linkedin_url && (
                              <DropdownMenuItem asChild>
                                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                  LinkedIn
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(contact.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {filtered.length} contacts
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
              Page {page + 1} of {totalPages}
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

      <AddContactDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={() => {
          loadContacts();
          toast.success("Contact added");
        }}
      />
    </div>
  );
}
