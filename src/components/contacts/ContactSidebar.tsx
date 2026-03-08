import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface Contact {
    id: string
    name: string
    title: string
    company: string
    email?: string
    linkedinUrl?: string
    enrichmentScore: number
    postsCount: number
    tags: string[]
    status: 'active' | 'inactive' | 'pending'
    aiBrief?: string
    posts?: { title: string, timeAgo: string }[]
}

interface ContactSidebarProps {
    contacts: Contact[]
    selectedContactId: string | null
    onSelectContact: (id: string) => void
}

export function ContactSidebar({ contacts, selectedContactId, onSelectContact }: ContactSidebarProps) {
    return (
        <div className="w-[320px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full rounded-l-xl">
            {/* Header & Search */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-9 bg-slate-50 border-transparent focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:border-slate-300 rounded-lg h-10 w-full"
                        />
                    </div>
                </div>
                <Button className="w-full gradient-primary hover:opacity-90 text-white rounded-lg h-10 shadow-sm flex items-center justify-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Generate Campaign
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No contacts found.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => onSelectContact(contact.id)}
                                className={cn(
                                    "w-full text-left p-4 hover:bg-slate-50 transition-colors relative",
                                    selectedContactId === contact.id ? "bg-slate-50 border-l-2 border-primary" : "border-l-2 border-transparent"
                                )}
                            >
                                <div className="flex gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-200">
                                        <AvatarImage src={`https://avatar.vercel.sh/${contact.name}.png`} />
                                        <AvatarFallback className="gradient-primary text-white font-medium text-sm">
                                            {contact.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-900 text-[15px] truncate max-w-[130px]">{contact.name}</span>
                                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", contact.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300')} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-semibold text-primary">{contact.enrichmentScore}%</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{contact.postsCount} posts</div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500 truncate mt-0.5">
                                            {contact.title} at {contact.company}
                                        </div>

                                        {contact.tags && contact.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {contact.tags.map(tag => (
                                                    <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
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
