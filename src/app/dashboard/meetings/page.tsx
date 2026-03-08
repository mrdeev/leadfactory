"use client";

import {
    Calendar, CheckCircle2, AlertCircle, TrendingUp, Search, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function MeetingsPage() {
    const stats = [
        { label: "Upcoming", value: "0", icon: <Calendar className="h-5 w-5 text-primary/70" />, className: "stat-indigo" },
        { label: "Completed", value: "0", icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, className: "stat-emerald" },
        { label: "No-Shows", value: "0", icon: <AlertCircle className="h-5 w-5 text-rose-400" />, className: "stat-rose" },
        { label: "Conversions", value: "0", icon: <TrendingUp className="h-5 w-5 text-amber-400" />, className: "stat-amber" },
    ];

    return (
        <div className="max-w-7xl mx-auto animate-slide-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-heading mb-1">Meetings</h1>
                <p className="text-body">Track your calls, demos, and coffee chats — all in one spot.</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className={`${stat.className} rounded-xl p-5 card-hover`}>
                        <div className="flex items-center gap-3">
                            <div className="shrink-0">{stat.icon}</div>
                            <div>
                                <div className="text-2xl font-bold text-heading">{stat.value}</div>
                                <div className="text-xs text-body font-medium">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input placeholder="Search meetings..." className="pl-10 h-10 input-surface rounded-lg" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px] h-10 rounded-lg">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="no-show">No-Shows</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Empty State */}
            <div className="rounded-2xl border border-dashed border-border bg-card/50 min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
                <div className="h-16 w-16 rounded-2xl stat-indigo flex items-center justify-center mb-6">
                    <CalendarDays className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="text-lg font-semibold text-heading mb-2">Your calendar is wide open</h3>
                <p className="text-body max-w-sm">
                    When prospects book calls through your campaigns, they&apos;ll show up right here. Connect your calendar to get started.
                </p>
                <Button className="mt-6 gradient-primary text-white font-medium shadow-lg hover:opacity-90 transition-all">
                    Connect Calendar
                </Button>
            </div>
        </div>
    );
}
