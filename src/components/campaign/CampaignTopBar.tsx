"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
    X, Star, Settings, MoreHorizontal, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Gem Icon ──────────────────────────────────────────────────────────────
function GemIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 3 18 3 22 9 12 22 2 9" />
            <line x1="2" y1="9" x2="22" y2="9" />
            <line x1="12" y1="3" x2="6" y2="9" />
            <line x1="12" y1="3" x2="18" y2="9" />
        </svg>
    )
}

export const TABS = [
    { id: 'sequence', label: 'Sequence', pathSuffix: '' },
    { id: 'stages', label: 'Pipeline Stages', pathSuffix: '/stages' },
    { id: 'strategy', label: 'AI Sales Strategy', pathSuffix: '/strategy' },
    { id: 'leads', label: 'Lead list', pathSuffix: '/leads' },
    { id: 'import', label: 'Import Contacts', pathSuffix: '/import' },
    { id: 'email', label: 'Email Settings', pathSuffix: '/email' },
    { id: 'calendar', label: 'Google Calendar', pathSuffix: '/calendar' },
    { id: 'auto-reply', label: 'AI Auto-Reply', pathSuffix: '/auto-reply' },
    { id: 'linkedin', label: 'Connect LinkedIn', pathSuffix: '/linkedin' },
    { id: 'launch', label: 'Launch', pathSuffix: '/launch' },
];

export function CampaignTopBar({
    product,
    productId,
    onClose,
    onConnectLinkedin,
    launchBadgeCount
}: {
    product: any
    productId: string
    onClose?: () => void
    onConnectLinkedin?: () => void
    launchBadgeCount?: number
}) {
    const pathname = usePathname()
    const router = useRouter()

    const handleClose = () => {
        if (onClose) onClose()
        else router.push('/dashboard/campaigns')
    }

    // Determine current tab index to figure out "Next step"
    const currentTabId = TABS.find(t => {
        const fullPath = `/dashboard/campaigns/${productId}${t.pathSuffix}`;
        return pathname === fullPath || pathname === `${fullPath}/`;
    })?.id || 'sequence';

    // Default to sequence if nothing matched precisely (though it might match sequence on exact match above)
    // Handle the root path match separately to avoid trailing slash issues
    const isRootMatch = pathname === `/dashboard/campaigns/${productId}` || pathname === `/dashboard/campaigns/${productId}/`;
    const activeTabId = isRootMatch ? 'sequence' : (currentTabId || 'sequence');

    const nextTabIndex = TABS.findIndex(t => t.id === activeTabId) + 1;
    const nextTab = nextTabIndex < TABS.length ? TABS[nextTabIndex] : null;

    return (
        <div className="h-[50px] border-b border-slate-200 bg-white flex items-center px-3 gap-2 flex-shrink-0 z-10 w-full overflow-hidden">
            {/* Close */}
            <button
                onClick={handleClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5 flex-shrink-0" />

            {/* Gem icon */}
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <GemIcon className="h-4 w-4 text-white" />
            </div>

            {/* Campaign name */}
            <span className="text-sm font-semibold text-slate-800 max-w-[150px] truncate flex-shrink-0">
                AI — {product?.name ? `${product.name}'s Campaign` : 'Campaign'}
            </span>

            {/* Active toggle */}
            {product?.campaignStatus === 'active' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 ml-1 cursor-pointer flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-emerald-700">Active</span>
                </div>
            ) : product?.campaignStatus === 'paused' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 ml-1 cursor-pointer flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-700">Paused</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 ml-1 cursor-pointer flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500">Draft</span>
                </div>
            )}

            {/* Tools */}
            <div className="flex items-center flex-shrink-0">
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-slate-50 transition-colors ml-0.5">
                    <Star className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                    <Settings className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1" />

            {/* Tab nav - Scrollable for many tabs */}
            <div className="flex-1 overflow-x-auto no-scrollbar ml-2 p-1 min-w-0">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 w-max">
                    {TABS.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        const badgeCount = tab.id === 'launch' && launchBadgeCount !== undefined ? launchBadgeCount : (tab as any).badge;
                        return (
                            <Link key={tab.id} href={`/dashboard/campaigns/${productId}${tab.pathSuffix}`}>
                                <button className={cn(
                                    "px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap",
                                    isActive
                                        ? "font-semibold text-slate-900 bg-white shadow-sm"
                                        : "font-medium text-slate-500 hover:text-slate-800"
                                )}>
                                    {tab.label}
                                    {badgeCount !== undefined && badgeCount > 0 && (
                                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {badgeCount}
                                        </span>
                                    )}
                                </button>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {nextTab && (
                <Link href={`/dashboard/campaigns/${productId}${nextTab.pathSuffix}`} className="flex-shrink-0 ml-2">
                    <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-black text-white h-8 text-xs gap-1.5 px-4"
                    >
                        Next step
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            )}
        </div>
    )
}
