"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Link, Search } from "lucide-react"

interface AddContactModalProps {
    productId?: string
    contact?: any // Provide existing contact for edit mode
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function AddContactModal({ productId, contact, onSuccess, trigger }: AddContactModalProps) {
    const isEdit = !!contact
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullName: contact?.fullName || "",
        position: contact?.position || "",
        orgName: contact?.orgName || "",
        orgIndustry: contact?.orgIndustry || "",
        email: contact?.email || "",
        phone: contact?.phone || "",
        linkedinUrl: contact?.linkedinUrl || "",
        insights: contact?.insights || [] as string[],
        professional_focus: contact?.professional_focus || [] as string[],
    })
    const [isScraping, setIsScraping] = useState(false)

    // Sync form fields whenever the parent passes updated contact data (e.g. after a save + re-fetch)
    useEffect(() => {
        if (contact) {
            setFormData({
                fullName: contact.fullName || "",
                position: contact.position || "",
                orgName: contact.orgName || "",
                orgIndustry: contact.orgIndustry || "",
                email: contact.email || "",
                phone: contact.phone || "",
                linkedinUrl: contact.linkedinUrl || "",
                insights: contact.insights || [],
                professional_focus: contact.professional_focus || [],
            })
        }
    }, [contact])

    const handleScrapeLinkedIn = async () => {
        if (!formData.linkedinUrl) {
            alert("Please enter a LinkedIn URL first")
            return
        }
        setIsScraping(true)
        try {
            const res = await fetch("/api/run-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    maxResults: 1,
                    scrapePosts: true,
                    specificLead: {
                        linkedinUrl: formData.linkedinUrl,
                        fullName: formData.fullName || "Target Profile",
                        // Pass existing data if any
                        position: formData.position,
                        orgName: formData.orgName,
                    }
                }),
            })

            if (res.ok) {
                const results = await res.json()
                if (results && results.length > 0) {
                    const lead = results[0]
                    setFormData({
                        ...formData,
                        fullName: lead.fullName || formData.fullName,
                        position: lead.position || formData.position,
                        orgName: lead.orgName || formData.orgName,
                        orgIndustry: lead.orgIndustry || formData.orgIndustry,
                        email: (lead.email && lead.email !== 'N/A') ? lead.email : formData.email,
                        phone: (lead.phone && lead.phone !== '—') ? lead.phone : formData.phone,
                        insights: lead.insights || [],
                        professional_focus: lead.websiteContent || [], // Re-mapped in route.ts
                    })
                } else {
                    alert("No data found for this profile. Please ensure it's a valid public LinkedIn profile.")
                }
            } else {
                const data = await res.json()
                alert(data.error || "Failed to scrape LinkedIn profile")
            }
        } catch (error) {
            console.error("Error scraping LinkedIn:", error)
            alert("An error occurred while scraping. Please try again.")
        } finally {
            setIsScraping(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch(`/api/contacts${productId ? `?productId=${productId}` : ""}`, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? { id: contact.id, ...formData } : formData),
            })

            if (res.ok) {
                const resData = await res.json()
                if (!isEdit && resData.addedCount === 0) {
                    alert("This contact already exists in this campaign.")
                    setLoading(false)
                    return
                }
                setOpen(false)
                if (!isEdit) {
                    setFormData({
                        fullName: "",
                        position: "",
                        orgName: "",
                        orgIndustry: "",
                        email: "",
                        phone: "",
                        linkedinUrl: "",
                        insights: [],
                        professional_focus: [],
                    })
                }
                if (onSuccess) onSuccess()
            } else {
                const data = await res.json()
                alert(data.error || "Failed to add contact")
            }
        } catch (error) {
            console.error("Error adding contact:", error)
            alert("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="bg-black hover:bg-gray-800 text-white h-10 px-5">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? "Update the contact details below." : "Enter the details of the new contact."} Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        {/* Scraping Section */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linkedinUrl" className="text-sm font-bold text-primary flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                LinkedIn Profile URL
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="linkedinUrl"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    className="flex-1 h-10 border-primary/20 focus-visible:ring-primary"
                                    placeholder="https://linkedin.com/in/johndoe"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleScrapeLinkedIn}
                                    disabled={isScraping || !formData.linkedinUrl}
                                    className="shrink-0 h-10 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                                >
                                    {isScraping ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            Scrape & Fill
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">Enter a LinkedIn URL to automatically fill the form below.</p>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        {/* Manual Fields */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="fullName" className="text-sm font-medium">
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="John Doe"
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="h-10"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone" className="text-sm font-medium">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="position" className="text-sm font-medium">
                                    Position
                                </Label>
                                <Input
                                    id="position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="CEO"
                                    className="h-10"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="orgName" className="text-sm font-medium">
                                    Company
                                </Label>
                                <Input
                                    id="orgName"
                                    value={formData.orgName}
                                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                                    placeholder="Acme Inc."
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="orgIndustry" className="text-sm font-medium">
                                Industry
                            </Label>
                            <Input
                                id="orgIndustry"
                                value={formData.orgIndustry}
                                onChange={(e) => setFormData({ ...formData, orgIndustry: e.target.value })}
                                placeholder="Technology"
                                className="h-10"
                            />
                        </div>

                        {(formData.insights.length > 0 || formData.professional_focus.length > 0) && (
                            <div className="col-span-4 mt-2 space-y-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                {formData.insights.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">LinkedIn Activity Insights</h4>
                                        <ul className="space-y-1">
                                            {formData.insights.map((insight: string, i: number) => (
                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                    <span className="mr-2 text-primary">•</span>
                                                    {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {formData.professional_focus.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Professional Focus</h4>
                                        <ul className="space-y-1">
                                            {formData.professional_focus.map((focus: string, i: number) => (
                                                <li key={i} className="text-sm text-gray-700 flex items-start">
                                                    <span className="mr-2 text-green-500">•</span>
                                                    {focus}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEdit ? "Updating..." : "Saving..."}</>
                            ) : (
                                isEdit ? "Update Contact" : "Save Contact"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
