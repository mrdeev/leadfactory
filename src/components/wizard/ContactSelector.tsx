"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Search, Loader2, Users, Linkedin, ExternalLink } from "lucide-react"

interface Contact {
    id: string
    fullName: string
    email: string
    orgName: string
    position?: string
    phone?: string
    linkedinUrl?: string
    productId?: string
}

interface ContactSelectorProps {
    productId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    existingProjectContacts: string[] // IDs of contacts already in this project
}

export function ContactSelector({ productId, isOpen, onClose, onSuccess, existingProjectContacts }: ContactSelectorProps) {
    const [allContacts, setAllContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchAllContacts()
            setSelectedIds([])
        }
    }, [isOpen])

    const fetchAllContacts = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/contacts', { cache: 'no-store' })
            if (res.ok) {
                const data: Contact[] = await res.json()

                // Deduplicate by email to avoid showing the same person multiple times 
                // if they were added to different projects previously
                const uniqueByEmail = new Map<string, Contact>()
                data.forEach(c => {
                    const key = c.email?.toLowerCase() || `${c.fullName}-${c.orgName}`.toLowerCase()
                    if (!uniqueByEmail.has(key)) {
                        uniqueByEmail.set(key, c)
                    }
                })

                setAllContacts(Array.from(uniqueByEmail.values()))
            }
        } catch (error) {
            console.error("Failed to fetch all contacts", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredContacts = allContacts.filter(c =>
        (c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            (c.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
            c.orgName.toLowerCase().includes(search.toLowerCase())) &&
        !existingProjectContacts.includes(c.id)
    )

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        if (selectedIds.length === filteredContacts.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredContacts.map(c => c.id))
        }
    }

    const handleSave = async () => {
        if (selectedIds.length === 0) return

        setSaving(true)
        try {
            const contactsToCopy = allContacts
                .filter(c => selectedIds.includes(c.id))
                .map(c => ({
                    fullName: c.fullName,
                    email: c.email,
                    orgName: c.orgName,
                    position: c.position,
                    phone: c.phone,
                    linkedinUrl: c.linkedinUrl,
                }))

            await fetch(`/api/contacts?productId=${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactsToCopy),
            })
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Failed to save contacts to project", error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-400" />
                        Select from Existing Contacts
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, email or company..."
                            className="pl-10 h-11 border-slate-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="w-[50px] px-6">
                                        <Checkbox
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredContacts.length}
                                            onCheckedChange={selectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11">Name</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11">Email</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11">Company</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11">LinkedIn</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
                                            <p className="text-sm text-slate-400 mt-2">Loading contacts...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredContacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-slate-400 text-sm italic">
                                            {search ? "No contacts match your search." : "No existing contacts found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContacts.map(contact => (
                                        <TableRow
                                            key={contact.id}
                                            className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-100"
                                            onClick={() => toggleSelect(contact.id)}
                                        >
                                            <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedIds.includes(contact.id)}
                                                    onCheckedChange={() => toggleSelect(contact.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 h-14">{contact.fullName}</TableCell>
                                            <TableCell className="text-slate-600 font-medium">{contact.email}</TableCell>
                                            <TableCell className="text-slate-600">{contact.orgName}</TableCell>
                                            <TableCell className="text-slate-600">
                                                {contact.linkedinUrl ? (
                                                    <a
                                                        href={contact.linkedinUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors group"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Linkedin className="h-4 w-4" />
                                                        <span className="text-xs font-medium border-b border-transparent group-hover:border-primary/80 leading-none">View Profile</span>
                                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[11px]">No profile</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-500 font-medium">
                            {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="border-slate-200">Cancel</Button>
                            <Button
                                onClick={handleSave}
                                disabled={selectedIds.length === 0 || saving}
                                className="bg-slate-900 text-white hover:bg-black font-bold min-w-[120px]"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Selected"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
