"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Plus, Users, Loader2, Trash2, Edit2, Linkedin, ExternalLink } from "lucide-react"
import Papa from "papaparse"
import { ContactSelector } from "../ContactSelector"
import { AddContactModal } from "@/components/AddContactModal"

interface Contact {
    id: string
    fullName: string
    email: string
    orgName: string
    position?: string
    phone?: string
    linkedinUrl?: string
}

export function ImportContactsStep({ productId }: { productId: string }) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)

    const fetchContacts = async () => {
        try {
            const res = await fetch(`/api/contacts?productId=${productId}`)
            if (res.ok) {
                const data = await res.json()
                setContacts(data)
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContacts()
    }, [productId])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                // Map CSV fields to our Contact schema (basic mapping)
                const mappedContacts = results.data.map((row: any) => ({
                    fullName: row.fullName || row['First Name'] + ' ' + row['Last Name'] || row.name || 'Unknown',
                    email: row.email || row['Email Address'] || row.Email || '',
                    orgName: row.orgName || row.Company || row.company || '',
                    position: row.position || row.Title || row.title || '',
                    phone: row.phone || row['Phone Number'] || row.Phone || '',
                    linkedinUrl: row.linkedinUrl || row['LinkedIn URL'] || row.LinkedIn || ''
                })).filter((c: any) => c.email && c.email.includes('@')) // Basic validation

                if (mappedContacts.length > 0) {
                    try {
                        const res = await fetch(`/api/contacts?productId=${productId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(mappedContacts)
                        })
                        if (res.ok) {
                            const resData = await res.json();
                            fetchContacts() // Refresh list
                            alert(resData.message || `Successfully imported ${resData.addedCount} contacts.`)
                        }
                    } catch (error) {
                        console.error("Import failed", error)
                    }
                }
                setUploading(false)
            },
            error: (error) => {
                console.error("CSV Parse error", error)
                setUploading(false)
            }
        })
    }

    const downloadTemplate = () => {
        const csv = "fullName,email,orgName,position,phone,linkedinUrl\nJohn Doe,john@example.com,Acme Inc,CEO,555-0123,https://linkedin.com/in/johndoe"
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = "contact_template.csv"
        a.click()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this contact?")) return
        try {
            await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
            setContacts(contacts.filter(c => c.id !== id))
        } catch (error) {
            console.error("Delete failed", error)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Import Contacts</h2>
                <p className="text-sm text-slate-500 mt-1">Add contacts to start AI outreach. You need at least one contact to test the AI in the final step.</p>
            </div>

            {/* Current Contacts Card */}
            <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-400" />
                        <h3 className="font-bold text-slate-900">Current Contacts</h3>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold border border-slate-200 uppercase tracking-tighter">{contacts.length} contacts</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-700 font-bold h-9"
                            onClick={() => setIsSelectorOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Import from Contacts
                        </Button>
                        <AddContactModal productId={productId} onSuccess={fetchContacts} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 px-6">Name</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 px-6">Email</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 px-6">Company</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 px-6">LinkedIn</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 px-6 w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
                                    </TableCell>
                                </TableRow>
                            ) : contacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-sm font-medium italic">
                                        No contacts found. Please import or add contacts.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contacts.map(contact => (
                                    <TableRow key={contact.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-bold text-slate-900 px-6 h-14">{contact.fullName}</TableCell>
                                        <TableCell className="text-slate-600 px-6 font-medium">{contact.email}</TableCell>
                                        <TableCell className="text-slate-600 px-6">{contact.orgName}</TableCell>
                                        <TableCell className="px-6">
                                            {contact.linkedinUrl ? (
                                                <a
                                                    href={contact.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors group"
                                                >
                                                    <Linkedin className="h-4 w-4" />
                                                    <span className="text-xs font-medium border-b border-transparent group-hover:border-primary/80 leading-none">View Profile</span>
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 italic text-[11px]">No profile</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                                                    onClick={() => handleDelete(contact.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Template Download */}
                <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Download className="h-4 w-4 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Download Template</h3>
                        </div>
                        <p className="text-xs text-slate-500">Get the CSV template with all supported columns correctly formatted.</p>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate} className="border-slate-200 text-slate-900 font-bold h-11 hover:bg-slate-50">
                        Download Template
                    </Button>
                </div>

                {/* Upload CSV */}
                <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Upload className="h-4 w-4 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Upload CSV File</h3>
                        </div>
                        <p className="text-xs text-slate-500">Upload your CSV. AI matches columns to fields automatically.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Input
                            type="file"
                            accept=".csv"
                            className="cursor-pointer file:bg-slate-900 file:text-white file:border-0 file:rounded-md file:px-4 file:h-8 file:mr-4 border-slate-200 h-11"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        {uploading && <Loader2 className="h-5 w-5 animate-spin text-slate-900" />}
                    </div>
                </div>
            </div>

            <ContactSelector
                productId={productId}
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSuccess={fetchContacts}
                existingProjectContacts={contacts.map(c => c.id)}
            />
        </div>
    )
}
