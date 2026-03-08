import { InboxConversation } from "./InboxSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface InboxChatProps {
    conversation: InboxConversation | null
}

export function InboxChat({ conversation }: InboxChatProps) {
    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-r-xl border-l border-slate-200">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-4">
                    <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Select a conversation</h3>
                <p className="text-sm text-slate-500 mt-1">Choose a message from the list to view the full timeline.</p>
            </div>
        )
    }

    const suggestions = [
        "Great! Here's my calendar link for a quick 15-min chat.",
        "Absolutely! Let me send over a detailed overview.",
        "Sure thing — what specific challenges are you facing?"
    ];

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 rounded-r-xl border-l border-slate-200 relative">
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 rounded-tr-xl">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={`https://avatar.vercel.sh/${conversation.contactName}.png`} />
                        <AvatarFallback className="bg-gradient-to-br from-rose-400 to-red-500 text-white font-medium">
                            {conversation.contactName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900">{conversation.contactName}</h2>
                            {conversation.classification && (
                                <span className={cn(
                                    "px-2 py-0.5 mt-[1px] rounded-full text-[9px] font-bold uppercase tracking-wider text-white",
                                    conversation.classification === 'HOT LEAD' ? "bg-emerald-600" :
                                        conversation.classification === 'QUESTION' ? "bg-amber-500" : "bg-slate-500"
                                )}>
                                    {conversation.classification}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500">{conversation.contactRole} at {conversation.contactCompany}</p>
                    </div>
                </div>

                <div className="flex gap-1.5">
                    <button className="h-8 w-10 flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary text-xs font-bold">
                        <span className="mr-1">in</span> <Check className="h-3 w-3" />
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500 text-xs font-bold hover:bg-slate-50">
                        M
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-500 text-xs font-bold hover:bg-slate-50">
                        W
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Outbound Bubble */}
                <div className="flex justify-end">
                    <div className="gradient-primary text-primary-foreground rounded-2xl rounded-tr-sm p-4 max-w-[80%] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-white/80">You via LinkedIn</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            Hi {conversation.contactName.split(" ")[0]}! Based on our last conversation, I've tailored a solution for your ops challenges. Interested in a quick overview?
                        </p>
                        <div className="text-right mt-2 text-[10px] text-white/70">
                            Today, 5:09 PM
                        </div>
                    </div>
                </div>

                {/* Inbound Bubble */}
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-sm p-4 max-w-[80%] shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-5 w-5 border border-slate-200">
                                <AvatarFallback className="bg-rose-400 text-white text-[9px] font-medium">
                                    {conversation.contactName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-bold">{conversation.contactName}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700">
                            {conversation.lastMessage}
                        </p>
                        <div className="text-left mt-2 text-[10px] text-slate-400">
                            {conversation.time === "2m" ? "Today, 7:12 PM" : "Yesterday, 3:45 PM"}
                        </div>
                    </div>
                </div>

            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 rounded-br-xl shrink-0">
                {/* AI Suggestions */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                        <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-600">AI Suggestions</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {suggestions.map((sug, i) => (
                            <button key={i} className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors whitespace-nowrap text-left shrink-0">
                                {sug}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Textbox */}
                <div className="relative flex items-center">
                    <Input
                        placeholder={`Reply to ${conversation.contactName.split(" ")[0]} via linkedin...`}
                        className="pr-20 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300 rounded-xl h-12"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                            in
                        </div>
                        <Button size="icon" className="h-9 w-9 gradient-primary hover:opacity-90 text-white rounded-lg shadow-sm">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
