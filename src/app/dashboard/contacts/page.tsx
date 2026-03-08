"use client"

import { useEffect, useState } from "react"
import { ContactSidebar, Contact } from "@/components/contacts/ContactSidebar"
import { ContactDetail } from "@/components/contacts/ContactDetail"
import { AddContactModal } from "@/components/AddContactModal"
import { Loader2 } from "lucide-react"

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

    const fetchContacts = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/contacts", { cache: "no-store" })
            if (res.ok) {
                const data = await res.json()
                // Map the raw data to the new Contact interface, using fallbacks for mockup visuals
                const mappedContacts: Contact[] = data.map((c: any, index: number) => ({
                    id: c.id,
                    name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.name || "Unknown",
                    title: c.headline || c.title || c.role || "Professional",
                    company: c.company || "Unknown Company",
                    email: c.email || undefined,
                    linkedinUrl: c.linkedin || c.linkedinUrl || undefined,
                    enrichmentScore: Math.floor(Math.random() * 30) + 70, // Mock: 70-99
                    postsCount: Math.floor(Math.random() * 20), // Mock: 0-20
                    tags: index % 2 === 0 ? ['SaaS', 'Sales Leader'] : ['AI', 'Engineering'], // Mock tags
                    status: index === 0 ? 'active' : 'inactive', // Mock status
                    aiBrief: undefined, // Let the component use its generic fallback
                    posts: index % 2 === 0 ? [
                        { title: "Declining reply rates in outbound...", timeAgo: "2 days ago" },
                        { title: "AI is transforming how we think about pipeline generation...", timeAgo: "1 week ago" }
                    ] : []
                }))
                setContacts(mappedContacts)
                if (mappedContacts.length > 0) {
                    setSelectedContactId(mappedContacts[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchContacts() }, [])

    const selectedContact = contacts.find(c => c.id === selectedContactId) || null

    if (loading) {
        return (
            <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-slate-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-slate-500 font-medium mt-4">Loading your contacts database...</p>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-80px)] -m-6 flex flex-col bg-slate-50 overflow-hidden">
            {/* Top Bar for Context */}
            <div className="shrink-0 h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Contacts</h1>
                    <p className="text-xs text-slate-500">{contacts.length} contacts scraped with AI intelligence briefs.</p>
                </div>
                <div>
                    <AddContactModal onSuccess={fetchContacts} />
                </div>
            </div>

            {/* Layout Wrapper */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Sidebar */}
                <div className="w-[380px] shrink-0 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <ContactSidebar
                        contacts={contacts}
                        selectedContactId={selectedContactId}
                        onSelectContact={setSelectedContactId}
                    />
                </div>

                {/* Right Detail Pane */}
                <div className="flex-1 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    <ContactDetail contact={selectedContact} />
                </div>
            </div>
        </div>
    )
}
