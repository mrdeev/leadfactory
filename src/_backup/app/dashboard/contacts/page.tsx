"use client";

import { useEffect, useState } from "react"
import { ResultsTable } from "@/components/ResultsTable"
import { AddContactModal } from "@/components/AddContactModal"
import { Button } from "@/components/ui/button"
import { Upload, Users } from "lucide-react"

export default function ContactsPage() {
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchContacts = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/contacts', { cache: 'no-store' })
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
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Contacts
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your contacts and leads
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-4">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                    <AddContactModal onSuccess={fetchContacts} />
                </div>
            </div>

            <div className="bg-white">
                {loading ? (
                    <div className="text-center p-20 text-slate-400">Loading contacts...</div>
                ) : (
                    <ResultsTable leads={contacts} mode="saved" onRefresh={fetchContacts} />
                )}
            </div>
        </div>
    )
}
