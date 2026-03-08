"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert, RefreshCw, User, Mail, Clock } from "lucide-react"

interface LinkedInSession {
    user_id: string
    email: string | null
    is_valid: boolean
    updated_at: string
}

export default function LinkedInSessionsAdmin() {
    const [sessions, setSessions] = useState<LinkedInSession[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchSessions = async () => {
        setRefreshing(true)
        try {
            const res = await fetch("/api/linkedin-sessions")
            if (res.ok) {
                const data = await res.json()
                setSessions(data)
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchSessions()
    }, [])

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">LinkedIn Cookie Sync</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Monitor active LinkedIn sessions synced from the Chrome extension.
                    </p>
                </div>
                <button
                    onClick={fetchSessions}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="px-6 py-4 font-bold text-slate-700">User ID</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-700">Email Address</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-700">Status</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-slate-700">Last Synced</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <RefreshCw className="h-8 w-8 animate-spin" />
                                        <span>Loading sessions...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-slate-500 italic">
                                    No LinkedIn sessions have been synced yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => (
                                <TableRow key={session.user_id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            {session.user_id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            {session.email || <span className="text-slate-300 italic">Not provided</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        {session.is_valid ? (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-xs">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Valid
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-xs">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Invalid
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-slate-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {new Date(session.updated_at).toLocaleString()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
