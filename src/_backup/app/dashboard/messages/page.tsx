"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Mail, Search, Trash2, Reply, Send, CheckCircle2,
    AlertCircle, Loader2, Edit3, X, ChevronDown, ChevronUp,
    Clock, Building2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Pending approval row ────────────────────────────────────────────────────

function PendingEmailRow({
    contact,
    onApprove,
    onSkip,
    isProcessing,
}: {
    contact: any;
    onApprove: (contactId: string, productId: string, editedMessage: string, editedSubject: string) => void;
    onSkip: (contactId: string) => void;
    isProcessing: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [body, setBody] = useState(contact.generatedEmail || "");
    const [subject, setSubject] = useState(contact.generatedSubject || "");

    const hasContent = !!contact.generatedEmail;

    return (
        <Card className={cn(
            "border-slate-100 shadow-none rounded-2xl overflow-hidden transition-all",
            isProcessing && "opacity-60"
        )}>
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-orange-500" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <span className="font-bold text-slate-900 text-sm">{contact.fullName}</span>
                                {contact.position && (
                                    <span className="text-slate-400 text-xs ml-2">{contact.position}</span>
                                )}
                                {contact.orgName && (
                                    <span className="text-slate-400 text-xs ml-1">· {contact.orgName}</span>
                                )}
                            </div>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] flex-shrink-0">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                Awaiting Approval
                            </Badge>
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">{contact.email}</p>

                        {/* Subject line */}
                        <div className="mt-3">
                            {editing ? (
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="h-8 text-xs font-medium border-slate-200 bg-white"
                                    placeholder="Subject line..."
                                />
                            ) : (
                                <p className="text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                    Subject: {subject || <span className="text-slate-400 italic">No subject generated</span>}
                                </p>
                            )}
                        </div>

                        {/* Email body preview / edit */}
                        {hasContent && (
                            <div className="mt-2">
                                {editing ? (
                                    <Textarea
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                        rows={8}
                                        className="text-xs text-slate-700 border-slate-200 bg-white resize-none leading-relaxed"
                                    />
                                ) : (
                                    <div
                                        className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                                        onClick={() => setExpanded(v => !v)}
                                    >
                                        <p className={cn("whitespace-pre-wrap", !expanded && "line-clamp-3")}>
                                            {body}
                                        </p>
                                        <button className="text-slate-400 hover:text-slate-600 text-[11px] mt-1 flex items-center gap-1">
                                            {expanded
                                                ? <><ChevronUp className="h-3 w-3" /> Show less</>
                                                : <><ChevronDown className="h-3 w-3" /> Read full email</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasContent && (
                            <p className="text-xs text-red-400 mt-2 italic">No email content generated for this contact.</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                            {hasContent && (
                                <Button
                                    size="sm"
                                    onClick={() => onApprove(contact.id, contact.productId, body, subject)}
                                    disabled={isProcessing}
                                    className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Approve & Send
                                </Button>
                            )}

                            {!editing ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setEditing(true); setExpanded(true); }}
                                    disabled={isProcessing}
                                    className="border-slate-200 text-slate-600 h-8 text-xs"
                                >
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditing(false)}
                                    className="border-slate-200 text-slate-600 h-8 text-xs"
                                >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Done editing
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSkip(contact.id)}
                                disabled={isProcessing}
                                className="text-slate-400 hover:text-red-500 h-8 text-xs"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Skip
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
    const [tab, setTab] = useState<"sent" | "pending">("sent");
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [pendingContacts, setPendingContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingLoading, setPendingLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all-status");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [approvingAll, setApprovingAll] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [products, setProducts] = useState<any[]>([]);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/messages");
            if (res.ok) setMessages(await res.json());
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    const fetchPending = useCallback(async () => {
        setPendingLoading(true);
        try {
            const [contactsRes, productsRes] = await Promise.all([
                fetch("/api/contacts"),
                fetch("/api/products"),
            ]);
            const allContacts = contactsRes.ok ? await contactsRes.json() : [];
            const allProducts = productsRes.ok ? await productsRes.json() : [];
            setProducts(allProducts);
            setPendingContacts(
                (Array.isArray(allContacts) ? allContacts : []).filter(
                    (c: any) => c.status === "needs_approval" && c.productId
                )
            );
        } catch { /* silent */ }
        finally { setPendingLoading(false); }
    }, []);

    useEffect(() => {
        fetchMessages();
        fetchPending();
    }, [fetchMessages, fetchPending]);

    // Switch to pending tab automatically if there are pending items and none sent
    useEffect(() => {
        if (!loading && !pendingLoading && messages.length === 0 && pendingContacts.length > 0) {
            setTab("pending");
        }
    }, [loading, pendingLoading, messages.length, pendingContacts.length]);

    const handleApprove = async (contactId: string, productId: string, editedMessage: string, editedSubject: string) => {
        setProcessingId(contactId);
        try {
            const res = await fetch("/api/campaign/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contactId, productId, editedMessage, editedSubject }),
            });
            if (res.ok) {
                showToast("success", "Email approved and sent!");
                setPendingContacts(prev => prev.filter(c => c.id !== contactId));
                await fetchMessages();
            } else {
                const err = await res.json();
                showToast("error", err.error || "Failed to send email");
            }
        } catch {
            showToast("error", "Connection error. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleSkip = async (contactId: string) => {
        // Mark as skipped (set status to 'skipped' via PATCH)
        try {
            await fetch("/api/contacts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: contactId, status: "skipped" }),
            });
            setPendingContacts(prev => prev.filter(c => c.id !== contactId));
            showToast("success", "Contact skipped");
        } catch {
            showToast("error", "Failed to skip contact");
        }
    };

    const handleApproveAll = async () => {
        if (pendingContacts.length === 0) return;
        // Group by productId and approve each group
        const productIds = [...new Set(pendingContacts.map(c => c.productId))];
        setApprovingAll(true);
        let totalSent = 0;
        try {
            for (const productId of productIds) {
                const res = await fetch("/api/campaign/approve-all", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    totalSent += data.sentCount || 0;
                }
            }
            showToast("success", `Approved and sent ${totalSent} email${totalSent !== 1 ? "s" : ""}`);
            await fetchPending();
            await fetchMessages();
            if (totalSent > 0) setTab("sent");
        } catch {
            showToast("error", "Failed to approve all emails");
        } finally {
            setApprovingAll(false);
        }
    };

    const handleMessageClick = (msg: any) => {
        setSelectedMessage(msg);
        setIsModalOpen(true);
    };

    const filteredMessages = messages.filter(msg => {
        const matchesSearch =
            msg.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all-status" || msg.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const filteredPending = pendingContacts.filter(c =>
        c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.orgName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getProductName = (productId: string) =>
        products.find((p: any) => p.id === productId)?.name || productId;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-top-2",
                    toast.type === "success"
                        ? "bg-white text-emerald-700 border-emerald-100"
                        : "bg-white text-red-600 border-red-100"
                )}>
                    {toast.type === "success"
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <AlertCircle className="h-4 w-4 text-red-500" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-sm text-slate-500 mt-1">Review AI-generated emails and view sent outreach</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => setTab("sent")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        tab === "sent"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Sent
                    {messages.length > 0 && (
                        <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-bold">
                            {messages.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("pending")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                        tab === "pending"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Pending Approval
                    {pendingContacts.length > 0 && (
                        <span className={cn(
                            "text-[10px] rounded-full px-2 py-0.5 font-bold",
                            tab === "pending"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-orange-500 text-white"
                        )}>
                            {pendingContacts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Search + filters row */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder={tab === "sent" ? "Search messages..." : "Search contacts..."}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-white border-slate-200 rounded-lg"
                    />
                </div>
                {tab === "sent" && (
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] h-10 bg-white border-slate-200 rounded-lg">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-status">All Status</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                {tab === "pending" && pendingContacts.length > 0 && (
                    <Button
                        onClick={handleApproveAll}
                        disabled={approvingAll}
                        className="bg-slate-900 hover:bg-slate-800 text-white h-10 text-sm"
                    >
                        {approvingAll ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Approve All ({pendingContacts.length})
                    </Button>
                )}
            </div>

            {/* ── PENDING TAB ── */}
            {tab === "pending" && (
                <div className="space-y-3">
                    {pendingLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                        </div>
                    ) : filteredPending.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-center border border-dashed border-slate-200 rounded-2xl">
                            <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">All caught up!</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    No emails waiting for approval. Launch a campaign to generate new ones.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Group header by product */}
                            {[...new Set(filteredPending.map(c => c.productId))].map(productId => {
                                const group = filteredPending.filter(c => c.productId === productId);
                                return (
                                    <div key={productId} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 bg-slate-900 rounded-md flex items-center justify-center flex-shrink-0">
                                                <Building2 className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {getProductName(productId)} · {group.length} pending
                                            </p>
                                        </div>
                                        {group.map(contact => (
                                            <PendingEmailRow
                                                key={contact.id}
                                                contact={contact}
                                                onApprove={handleApprove}
                                                onSkip={handleSkip}
                                                isProcessing={processingId === contact.id}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}

            {/* ── SENT TAB ── */}
            {tab === "sent" && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-center border border-dashed border-slate-200 rounded-2xl">
                            <Mail className="h-10 w-10 text-slate-200" />
                            <p className="text-slate-500 text-sm font-medium">
                                No messages yet.{" "}
                                {pendingContacts.length > 0 && (
                                    <button
                                        onClick={() => setTab("pending")}
                                        className="text-orange-500 hover:underline font-semibold"
                                    >
                                        You have {pendingContacts.length} email{pendingContacts.length !== 1 ? "s" : ""} awaiting approval →
                                    </button>
                                )}
                            </p>
                        </div>
                    ) : (
                        filteredMessages.map(msg => (
                            <Card
                                key={msg.id}
                                className="border-slate-100 hover:border-slate-300 shadow-none transition-all cursor-pointer rounded-2xl group"
                                onClick={() => handleMessageClick(msg)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-2.5 rounded-xl transition-colors",
                                            msg.direction === "incoming"
                                                ? "bg-emerald-50 text-emerald-500"
                                                : "bg-blue-50 text-blue-500"
                                        )}>
                                            {msg.direction === "incoming"
                                                ? <Reply className="h-4 w-4" />
                                                : <Mail className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-bold text-slate-900 text-sm">{msg.contactName}</span>
                                                    {msg.campaignStep && (
                                                        <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-200 px-1.5 py-0">
                                                            Email {msg.campaignStep}
                                                        </Badge>
                                                    )}
                                                    <span className="text-slate-400 text-sm hidden sm:inline">—</span>
                                                    <span className="font-semibold text-slate-800 text-sm truncate hidden sm:inline">
                                                        {msg.subject}
                                                    </span>
                                                </div>
                                                <Badge className={cn(
                                                    "border-none px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider h-6 flex-shrink-0",
                                                    msg.status === "Replied"
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {msg.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-400 font-semibold sm:hidden truncate">{msg.subject}</p>
                                            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                                {msg.snippet}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[11px] text-slate-400">{msg.email}</span>
                                                <span className="text-[11px] text-slate-400">{msg.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Message Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl p-0 gap-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 pb-6 border-b border-slate-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900">
                                    {selectedMessage?.contactName} — {selectedMessage?.subject}
                                </DialogTitle>
                                <p className="text-slate-400 text-xs font-medium mt-0.5">
                                    {selectedMessage?.date} at {selectedMessage?.time}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn(
                                "border-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                                selectedMessage?.status === "Replied"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-blue-50 text-blue-600"
                            )}>
                                {selectedMessage?.status}
                            </Badge>
                            {selectedMessage?.campaignStep && (
                                <Badge variant="outline" className="text-slate-500 border-slate-200 text-[11px]">
                                    Email {selectedMessage.campaignStep} of sequence
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-8 bg-white max-h-[55vh] overflow-y-auto">
                        <div className="grid grid-cols-[70px_1fr] text-sm gap-y-2 mb-6">
                            <span className="text-slate-400">From:</span>
                            <span className="text-slate-900 font-medium">
                                {selectedMessage?.from || "support@topsalesagent.ai"}
                            </span>
                            <span className="text-slate-400">To:</span>
                            <span className="text-slate-900 font-medium">{selectedMessage?.email}</span>
                        </div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            {selectedMessage?.body}
                        </div>
                    </div>

                    <DialogFooter className="p-6 px-8 border-t border-slate-50 flex items-center justify-end sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="text-slate-600 hover:text-slate-900 h-11 px-8 font-bold rounded-xl"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
