import { Contact } from "./ContactSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Rocket, Send, MessageSquare, Linkedin, Sparkles, Clock, RefreshCw } from "lucide-react"

interface ContactDetailProps {
    contact: Contact | null
}

export function ContactDetail({ contact }: ContactDetailProps) {
    if (!contact) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-r-xl border-l border-slate-200">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-4">
                    <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Select a contact</h3>
                <p className="text-sm text-slate-500 mt-1">Choose a contact from the list to view their deep profile.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-slate-50/30 overflow-y-auto rounded-r-xl p-6">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <Avatar className="h-16 w-16 border border-slate-200">
                                <AvatarImage src={`https://avatar.vercel.sh/${contact.name}.png`} />
                                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-red-500 text-white text-xl font-bold">
                                    {contact.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{contact.name}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">{contact.title} at {contact.company}</p>

                                <div className="flex items-center gap-2 mt-3">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                                        <Linkedin className="h-3 w-3" />
                                    </span>
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                                        M
                                    </span>
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                                        W
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right space-y-2">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium shadow-sm">
                                {contact.enrichmentScore}% enriched
                            </div>
                            <div className="text-xs text-slate-500">
                                {contact.email || "No email available"}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-3 mt-8">
                        <Button className="w-full gradient-primary hover:opacity-90 text-white rounded-xl h-12 shadow-sm shadow-ring/20">
                            <Rocket className="h-4 w-4 mr-2" />
                            Sequence
                        </Button>
                        <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 shadow-sm shadow-rose-200/50">
                            <Send className="h-4 w-4 mr-2" />
                            Email
                        </Button>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 shadow-sm shadow-ring/20">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            InMail
                        </Button>
                        <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-12 shadow-sm shadow-teal-200/50">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Comment
                        </Button>
                    </div>
                </div>

                {/* AI Intelligence Brief */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-slate-900">AI Intelligence Brief</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-[95%] italic">
                        {contact.aiBrief || `${contact.name} is ${contact.title} at ${contact.company}. Active LinkedIn poster (${contact.postsCount} posts in 30 days). Key topics: engineering scale, AI integration. Recently posted about team velocity. Tone: pragmatic, technical. Best approach: reference their post about dev speed, position your solution as a developer productivity multiplier.`}
                    </p>
                </div>

                {/* Scraped Posts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <Linkedin className="h-4 w-4" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Scraped LinkedIn Posts</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 h-8 px-3 text-xs font-semibold">
                            Re-scrape
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {contact.posts && contact.posts.length > 0 ? (
                            contact.posts.map((post, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-sm text-slate-700 font-medium">"{post.title}"</p>
                                    <div className="flex items-center text-xs text-slate-400 mt-2">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {post.timeAgo}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-500 text-sm">
                                No recent posts found.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
