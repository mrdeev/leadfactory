"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    X, ChevronRight, Star, Settings, MoreHorizontal,
    Search, Mail, ExternalLink, CheckCircle2,
    Clock, Users, ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { CampaignTopBar } from "@/components/campaign/CampaignTopBar"

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ contact }: { contact: any }) {
    if (!contact.campaignStep || contact.campaignStep === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                Not launched
            </span>
        )
    }
    if (contact.campaignComplete) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Complete
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active — Step {contact.campaignStep}
        </span>
    )
}

// ─── Initials Avatar ───────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const colors = [
        'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
        'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
    ]
    const color = colors[name.charCodeAt(0) % colors.length]

    return (
        <div className={cn(
            "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
            color,
            size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs'
        )}>
            {initials}
        </div>
    )
}// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CampaignLeadsPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params)
    const router = useRouter()

    const [product, setProduct] = useState<any>(null)
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [sortField, setSortField] = useState<string>('savedAt')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    useEffect(() => {
        Promise.all([
            fetch(`/api/products/${productId}`).then(r => r.ok ? r.json() : null),
            fetch(`/api/contacts?productId=${productId}`).then(r => r.ok ? r.json() : []),
        ]).then(([prod, ctcts]) => {
            setProduct(prod)
            setContacts(Array.isArray(ctcts) ? ctcts : [])
        }).catch(() => { }).finally(() => setLoading(false))
    }, [productId])

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const filtered = contacts
        .filter(c => {
            if (!search) return true
            const q = search.toLowerCase()
            return (
                c.fullName?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.orgName?.toLowerCase().includes(q) ||
                c.position?.toLowerCase().includes(q)
            )
        })
        .sort((a, b) => {
            let av = a[sortField] ?? ''
            let bv = b[sortField] ?? ''
            if (typeof av === 'string') av = av.toLowerCase()
            if (typeof bv === 'string') bv = bv.toLowerCase()
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const launched = contacts.filter(c => c.campaignStep && c.campaignStep > 0).length
    const completed = contacts.filter(c => c.campaignComplete).length

    return (
        <div className="fixed inset-0 flex flex-col bg-white z-50">
            <CampaignTopBar
                product={product}
                productId={productId}
                onClose={() => router.push('/dashboard/campaigns')}
            />

            {/* Subheader */}
            <div className="border-b border-slate-100 bg-white px-6 py-3 flex items-center gap-4 flex-shrink-0">
                {/* Stats */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-800">{contacts.length}</span> leads
                        </span>
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <span className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{launched}</span> launched
                    </span>
                    <div className="h-3 w-px bg-slate-200" />
                    <span className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{completed}</span> completed
                    </span>
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 w-56 bg-white placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                            <p className="text-[12px] text-slate-400">Loading leads...</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                            {search ? 'No leads match your search' : 'No leads in this campaign yet'}
                        </p>
                        <p className="text-[12px] text-slate-400">
                            {search ? 'Try a different search term' : 'Import contacts to get started'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="w-10 px-4 py-3">
                                    <input type="checkbox" className="rounded border-slate-300 h-3.5 w-3.5" />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('fullName')}
                                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
                                    >
                                        Name
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('orgName')}
                                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
                                    >
                                        Company
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Position
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('campaignStep')}
                                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
                                    >
                                        Status
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    LinkedIn
                                </th>
                                <th className="w-10 px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(contact => (
                                <LeadRow key={contact.id} contact={contact} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-2.5 flex items-center flex-shrink-0 bg-white">
                    <p className="text-[11px] text-slate-400">
                        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
                        <span className="font-semibold text-slate-600">{contacts.length}</span> leads
                    </p>
                </div>
            )}
        </div>
    )
}

// ─── Lead Row ──────────────────────────────────────────────────────────────
function LeadRow({ contact }: { contact: any }) {
    const [hovered, setHovered] = useState(false)

    return (
        <tr
            className={cn("transition-colors", hovered ? "bg-slate-50/80" : "bg-white")}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-slate-300 h-3.5 w-3.5" />
            </td>

            {/* Name */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <Avatar name={contact.fullName || '?'} />
                    <div>
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                            {contact.fullName || '—'}
                        </p>
                        {contact.seniority && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{contact.seniority}</p>
                        )}
                    </div>
                </div>
            </td>

            {/* Company */}
            <td className="px-4 py-3">
                <div>
                    <p className="text-[13px] text-slate-700 font-medium leading-tight">{contact.orgName || '—'}</p>
                    {contact.orgIndustry && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {Array.isArray(contact.orgIndustry)
                                ? contact.orgIndustry.join(', ')
                                : String(contact.orgIndustry).replace(/^\[|\]$/g, '').replace(/'/g, '')}
                        </p>
                    )}
                </div>
            </td>

            {/* Email */}
            <td className="px-4 py-3">
                <a
                    href={`mailto:${contact.email}`}
                    className="text-[12px] text-slate-500 hover:text-primary flex items-center gap-1 group"
                    onClick={e => e.stopPropagation()}
                >
                    <Mail className="h-3 w-3 text-slate-300 group-hover:text-primary flex-shrink-0" />
                    <span className="truncate max-w-[180px]">{contact.email || '—'}</span>
                </a>
            </td>

            {/* Position */}
            <td className="px-4 py-3">
                <p className="text-[12px] text-slate-600 max-w-[160px] truncate">{contact.position || '—'}</p>
            </td>

            {/* Status */}
            <td className="px-4 py-3">
                <StatusBadge contact={contact} />
                {contact.nextEmailAt && !contact.campaignComplete && (
                    <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-2.5 w-2.5 text-slate-300" />
                        <p className="text-[10px] text-slate-400">
                            Next: {new Date(contact.nextEmailAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                )}
            </td>

            {/* LinkedIn */}
            <td className="px-4 py-3">
                {contact.linkedinUrl ? (
                    <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#0A66C2] hover:underline"
                        onClick={e => e.stopPropagation()}
                    >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Profile
                        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                    </a>
                ) : (
                    <span className="text-[11px] text-slate-300">—</span>
                )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                {hovered && (
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                )}
            </td>
        </tr>
    )
}
