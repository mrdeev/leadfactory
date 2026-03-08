"use client"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Mail, Eye, Save, Trash2, Check, Wand2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { AddContactModal } from "@/components/AddContactModal"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"

interface Lead {
    id?: string
    fullName: string
    position: string
    orgName: string
    orgIndustry: string
    email: string
    emailStatus: string
    phone: string
    linkedinUrl: string
    generatedEmail?: string
    insights?: string[]
    professional_focus?: string[]
    websiteContent?: string[] // From search results
    city?: string
    state?: string
    country?: string
}

interface ResultsTableProps {
    leads: Lead[]
    mode?: "search" | "saved"
    onRefresh?: () => void
}

function parseIndustry(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'string') {
        const cleaned = val
            .replace(/^\[|\]$/g, '')
            .replace(/'/g, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .join(', ');
        return cleaned;
    }
    return String(val);
}

export function ResultsTable({ leads, mode = "search", onRefresh }: ResultsTableProps) {
    // Basic array check to prevent crash
    const safeLeads = Array.isArray(leads) ? leads : [];

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndices(new Set(safeLeads.map((_, i) => i)))
        } else {
            setSelectedIndices(new Set())
        }
    }

    const toggleSelect = (index: number) => {
        const newSelected = new Set(selectedIndices)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }
        setSelectedIndices(newSelected)
    }

    const handleBulkSave = async () => {
        if (selectedIndices.size === 0) return
        setIsSaving(true)

        const selectedLeads = Array.from(selectedIndices).map(idx => safeLeads[idx])

        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedLeads)
            })

            if (res.ok) {
                const result = await res.json()
                // Mark locally as saved
                const newSavedIds = new Set(savedIds)
                selectedLeads.forEach((lead) => {
                    if (lead.id) newSavedIds.add(lead.id)
                })
                setSavedIds(newSavedIds)
                setSelectedIndices(new Set()) // Clear selection
                alert(`Successfully saved ${result.addedCount} contacts!`)
            } else {
                console.error("Failed to save contacts")
            }
        } catch (error) {
            console.error("Error saving contacts:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this contact?")) return;

        try {
            const res = await fetch(`/api/contacts?id=${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error("Error deleting contact:", error)
        }
    }

    if (!safeLeads || safeLeads.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/10">
                {mode === "saved" ? "No saved contacts yet." : "No results found. Try adjusting your filters."}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {mode === "search" && selectedIndices.size > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                    <span className="text-sm font-medium ml-2">{selectedIndices.size} selected</span>
                    <Button size="sm" onClick={handleBulkSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Selected"}
                    </Button>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                            {mode === "search" && (
                                <TableHead className="w-[50px] text-center">
                                    <Checkbox
                                        checked={safeLeads.length > 0 && selectedIndices.size === safeLeads.length}
                                        onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Name</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Title</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Company</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Industry</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Email</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">Phone</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px]">LinkedIn</TableHead>
                            <TableHead className="text-slate-400 font-medium py-3 text-[13px] text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {safeLeads.map((lead, idx) => {
                            const isSelected = selectedIndices.has(idx)
                            return (
                                <TableRow key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors h-[64px]">
                                    {mode === "search" && (
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(idx)}
                                                aria-label={`Select ${lead.fullName}`}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="py-4 font-bold text-slate-900 text-[14px]">
                                        {lead.fullName}
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 text-[14px]">
                                        {lead.position || "-"}
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 text-[14px]">
                                        {lead.orgName || "-"}
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-400 text-[14px]">
                                        <div className="flex flex-col gap-1">
                                            <span>{parseIndustry(lead.orgIndustry) || "-"}</span>
                                            {(lead.insights?.length || 0) > 0 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                                                            <Check className="h-2.5 w-2.5" />
                                                            Scraped Insights
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4 shadow-xl border-slate-200" align="start">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900 mb-2">LinkedIn Activity Insights</h4>
                                                                <ul className="space-y-1.5">
                                                                    {lead.insights?.map((insight, i) => (
                                                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                                                            {insight}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            {((lead.professional_focus?.length || 0) > 0 || (lead.websiteContent?.length || 0) > 0) && (
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Professional Focus</h4>
                                                                    <ul className="space-y-1.5">
                                                                        {(lead.professional_focus || lead.websiteContent)?.map((focus, i) => (
                                                                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                                                                {focus}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 text-[14px]">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[150px]">{lead.email || "-"}</span>
                                            {lead.email && (
                                                <div className="h-[3px] w-6 bg-yellow-400 rounded-full shrink-0" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-500 text-[14px]">
                                        {lead.phone || "—"}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        {lead.linkedinUrl ? (
                                            <a
                                                href={lead.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary/80 hover:text-primary inline-flex items-center"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right py-4 pr-6">
                                        <div className="flex justify-end items-center gap-3">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-40 p-1" align="end">
                                                    <div className="flex flex-col">
                                                        {mode === "saved" && lead.id && (
                                                            <AddContactModal
                                                                contact={lead}
                                                                onSuccess={onRefresh}
                                                                trigger={
                                                                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-left">
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                        Edit Contact
                                                                    </button>
                                                                }
                                                            />
                                                        )}
                                                        {mode === "saved" && lead.id && (
                                                            <button
                                                                onClick={() => handleDelete(lead.id!)}
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                                Delete
                                                            </button>
                                                        )}
                                                        {mode === "search" && (
                                                            <div className="px-3 py-2 text-xs text-slate-400 italic">
                                                                Save to enable actions
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
