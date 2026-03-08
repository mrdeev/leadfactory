import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface InboxConversation {
    id: string
    contactName: string
    contactRole: string
    contactCompany: string
    lastMessage: string
    time: string
    channel: 'linkedin' | 'email' | 'whatsapp'
    unread: boolean
    classification?: 'HOT LEAD' | 'QUESTION' | 'NOT INTERESTED'
}

interface InboxSidebarProps {
    conversations: InboxConversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    activeTab: string
    onTabChange: (tab: string) => void
}

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'hot', label: 'Hot Leads' },
    { id: 'questions', label: 'Questions' },
]

export function InboxSidebar({ conversations, selectedId, onSelect, activeTab, onTabChange }: InboxSidebarProps) {
    return (
        <div className="w-[380px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full rounded-l-xl">
            {/* Filter Tabs */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                            activeTab === tab.id
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No conversations found.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={cn(
                                    "w-full text-left p-4 hover:bg-slate-50 transition-colors relative group",
                                    selectedId === conv.id ? "bg-slate-50 border-l-2 border-primary" : "border-l-2 border-transparent"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border border-slate-200">
                                            <AvatarImage src={`https://avatar.vercel.sh/${conv.contactName}.png`} />
                                            <AvatarFallback className={cn(
                                                "text-white font-medium text-sm",
                                                conv.classification === 'HOT LEAD' ? "bg-emerald-500" :
                                                    conv.classification === 'QUESTION' ? "bg-amber-500" :
                                                        conv.classification === 'NOT INTERESTED' ? "bg-rose-500" : "bg-primary"
                                            )}>
                                                {conv.contactName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white",
                                            conv.channel === 'linkedin' ? 'bg-[#0A66C2]' :
                                                conv.channel === 'email' ? 'bg-rose-500' : 'bg-[#25D366]'
                                        )}>
                                            {conv.channel === 'linkedin' ? 'in' : conv.channel === 'email' ? 'M' : 'W'}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="font-semibold text-slate-900 text-sm truncate pr-2">
                                                {conv.contactName}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] text-slate-500 font-medium">{conv.time}</span>
                                                {conv.unread && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {conv.contactRole} at {conv.contactCompany}
                                        </div>

                                        <p className={cn(
                                            "text-xs truncate mt-1.5",
                                            conv.unread ? "text-slate-900 font-medium" : "text-slate-600"
                                        )}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
