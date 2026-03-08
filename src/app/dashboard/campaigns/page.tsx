"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Loader2, Search, Star, BarChart2, MoreHorizontal,
    ChevronDown, Plus, CheckCircle2, AlertCircle, Megaphone, Play
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { WizardSelectorModal } from "@/components/products/WizardSelectorModal"
import { CreateProductModal } from "@/components/products/CreateProductModal"

interface Product {
    id: string
    name: string
    description: string
    campaignStatus?: string
    campaignSequence?: { id: string; emails: any[] }
    senderName?: string
    senderEmail?: string
    createdAt?: string
}

interface ContactStats {
    total: number
    complete: number
    needsApproval: number
    sent: number
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days} days ago`
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''} ago`
}

function initials(name?: string) {
    if (!name) return 'NJ'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Campaign row ──────────────────────────────────────────────────────────
function CampaignRow({ product, stats, onClick, onToggle, onDelete, isSelected, onSelect }: {
    product: Product
    stats: ContactStats
    onClick: () => void
    onToggle: (id: string, newStatus: 'active' | 'paused') => void
    onDelete: (id: string) => void
    isSelected: boolean
    onSelect: (id: string) => void
}) {
    const [hovered, setHovered] = useState(false)
    const [starred, setStarred] = useState(false)
    const [toggling, setToggling] = useState(false)
    const isActive = product.campaignStatus === 'active'

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (toggling) return
        setToggling(true)
        const newStatus = isActive ? 'paused' : 'active'
        await onToggle(product.id, newStatus)
        setToggling(false)
    }

    return (
        <tr
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "border-b border-slate-100 cursor-pointer transition-colors",
                hovered ? "bg-slate-50" : "bg-white"
            )}
        >
            {/* Checkbox */}
            <td className="pl-5 pr-2 py-3.5 w-8">
                <div
                    onClick={e => { e.stopPropagation(); onSelect(product.id) }}
                    className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                        isSelected ? "bg-primary border-primary" : "border-slate-300 hover:border-slate-400"
                    )}
                >
                    {isSelected && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>
            </td>

            {/* Status toggle */}
            <td className="px-3 py-3.5 w-20">
                <div
                    onClick={handleToggle}
                    title={isActive ? 'Pause campaign' : 'Activate campaign'}
                    className={cn(
                        "relative h-6 w-11 rounded-full transition-colors flex items-center cursor-pointer",
                        toggling && "opacity-60 cursor-wait",
                        isActive ? "bg-primary justify-end pr-0.5" : "bg-slate-200 justify-start pl-0.5"
                    )}
                >
                    <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
                </div>
            </td>

            {/* Campaign name */}
            <td className="px-3 py-3.5">
                <div className="flex items-center gap-2.5">
                    {/* Gem icon */}
                    <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="6 3 18 3 22 9 12 22 2 9" />
                            <line x1="2" y1="9" x2="22" y2="9" />
                            <line x1="12" y1="3" x2="6" y2="9" />
                            <line x1="12" y1="3" x2="18" y2="9" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                        AI — {product.name}'s Campaign
                    </span>
                </div>
            </td>

            {/* Leads completed */}
            <td className="px-3 py-3.5 w-44">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center flex-shrink-0">
                        {stats.complete > 0 && (
                            <div
                                className="h-2 w-2 rounded-full bg-emerald-500"
                                style={{ transform: `scale(${Math.min(stats.complete / Math.max(stats.total, 1), 1)})` }}
                            />
                        )}
                    </div>
                    <span className="text-sm text-slate-500">{stats.complete}/{stats.total}</span>
                </div>
            </td>

            {/* Sender */}
            <td className="px-3 py-3.5 w-24">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">{initials(product.senderName)}</span>
                    </div>
                </div>
            </td>

            {/* Tag */}
            <td className="px-3 py-3.5 w-24">
                <span className="text-sm text-slate-400">—</span>
            </td>

            {/* Created at */}
            <td className="px-3 py-3.5 w-36">
                <span className="text-sm text-slate-500">{timeAgo(product.createdAt)}</span>
            </td>

            {/* Actions */}
            <td className="px-4 py-3.5 w-28">
                <div className={cn("flex items-center gap-1 transition-opacity", hovered ? "opacity-100" : "opacity-0")} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={e => { e.stopPropagation(); setStarred(s => !s) }}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-amber-400 transition-colors"
                    >
                        <Star className={cn("h-3.5 w-3.5", starred && "fill-amber-400 text-amber-400")} />
                    </button>
                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(product.id) }}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete Campaign"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

// ─── Inner page ────────────────────────────────────────────────────────────
function CampaignsPageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [products, setProducts] = useState<Product[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isWizardSelectorOpen, setIsWizardSelectorOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [productsRes, contactsRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/contacts'),
            ])
            setProducts(productsRes.ok ? await productsRes.json() : [])
            const c = contactsRes.ok ? await contactsRes.json() : []
            setContacts(Array.isArray(c) ? c : [])
        } catch { }
        finally { setIsLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const getStats = (productId: string): ContactStats => {
        const pc = contacts.filter((c: any) => c.productId === productId)
        const sent = pc.filter((c: any) => c.campaignStep >= 1 && c.status !== 'needs_approval').length
        return {
            total: pc.length,
            complete: pc.filter((c: any) => c.campaignComplete).length,
            needsApproval: pc.filter((c: any) => c.status === 'needs_approval').length,
            sent,
        }
    }

    const toggleCampaign = async (id: string, newStatus: 'active' | 'paused') => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignStatus: newStatus }),
            })
            if (res.ok) {
                const updated = await res.json()
                setProducts(prev => prev.map(p => p.id === id ? { ...p, campaignStatus: updated.campaignStatus } : p))
            }
        } catch { }
    }

    const bulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} campaigns? This will also remove all associated contacts.`)) return
        setIsLoading(true)
        try {
            await Promise.all(selectedIds.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
            setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)))
            setSelectedIds([])
        } catch { }
        finally { setIsLoading(false) }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const toggleAll = () => {
        if (selectedIds.length === filtered.length && filtered.length > 0) {
            setSelectedIds([])
        } else {
            setSelectedIds(filtered.map(p => p.id))
        }
    }

    const deleteCampaign = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign? This will also remove associated contacts.')) return
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id))
            }
        } catch { }
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Page heading */}
            <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>

            {/* Search + filters row */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search a campaign..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 pr-4 h-9 w-64 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                    />
                </div>

                {/* Filter pills */}
                {['Status: All', 'Sender: All', 'Tags: All', 'Creators: All'].map(f => (
                    <button key={f} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                        {f}
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                ))}

                {/* Favorites toggle */}
                <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white">
                    <div className="relative h-5 w-9 rounded-full bg-slate-200 flex items-center px-0.5 cursor-pointer">
                        <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                    <span className="text-sm text-slate-600">Favorites only</span>
                </div>

                <div className="flex-1" />

                {selectedIds.length > 0 && (
                    <Button
                        onClick={bulkDelete}
                        variant="destructive"
                        className="h-9 gap-2 px-4 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete Selected ({selectedIds.length})
                    </Button>
                )}

                {/* Create campaign */}
                <Button onClick={() => setIsWizardSelectorOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 gap-2 px-4">
                    <Plus className="h-4 w-4" />
                    Create campaign
                    <div className="h-4 w-px bg-white/30 mx-0.5" />
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            </div>

            <WizardSelectorModal
                open={isWizardSelectorOpen}
                onOpenChange={setIsWizardSelectorOpen}
                products={products}
                onCreateNew={() => { setIsWizardSelectorOpen(false); setIsCreateModalOpen(true); }}
            />
            <CreateProductModal
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) {
                        loadData(); // reload products when closing modal
                    }
                }}
            />

            {/* Table */}
            {products.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                        <Megaphone className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">No campaigns yet</h3>
                        <p className="text-slate-500 text-sm mt-1">Add a company and run the setup wizard to get started</p>
                    </div>
                    <Button onClick={() => setIsWizardSelectorOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                        <Play className="h-4 w-4" />
                        Get Started
                    </Button>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-white">
                                <th className="pl-5 pr-2 py-3 w-8">
                                    <div
                                        onClick={toggleAll}
                                        className={cn(
                                            "h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                                            selectedIds.length > 0 && selectedIds.length === filtered.length && filtered.length > 0
                                                ? "bg-primary border-primary"
                                                : "border-slate-300 hover:border-slate-400"
                                        )}
                                    >
                                        {selectedIds.length > 0 && selectedIds.length === filtered.length && filtered.length > 0 && (
                                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                        {selectedIds.length > 0 && selectedIds.length < filtered.length && (
                                            <div className="h-0.5 w-2 bg-slate-400 rounded-full" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-3 py-3 w-20 text-left">
                                    <span className="text-xs font-semibold text-slate-500">Status</span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
                                        Campaign Name
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-3 py-3 w-44 text-left">
                                    <span className="text-xs font-semibold text-slate-500">Leads completed</span>
                                </th>
                                <th className="px-3 py-3 w-24 text-left">
                                    <span className="text-xs font-semibold text-slate-500">Sender</span>
                                </th>
                                <th className="px-3 py-3 w-24 text-left">
                                    <span className="text-xs font-semibold text-slate-500">Tag</span>
                                </th>
                                <th className="px-3 py-3 w-36 text-left">
                                    <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
                                        Created at
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 w-28 text-left">
                                    <span className="text-xs font-semibold text-slate-500">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                                        No campaigns match your search
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(product => (
                                    <CampaignRow
                                        key={product.id}
                                        product={product}
                                        stats={getStats(product.id)}
                                        onClick={() => router.push(`/dashboard/campaigns/${product.id}`)}
                                        onToggle={toggleCampaign}
                                        onDelete={deleteCampaign}
                                        isSelected={selectedIds.includes(product.id)}
                                        onSelect={toggleSelect}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default function CampaignsPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        }>
            <CampaignsPageInner />
        </Suspense>
    )
}
