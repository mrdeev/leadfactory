"use client";

import { Activity, AlertTriangle, Link2, Share2 } from "lucide-react";

export function StatCards({ channels }: { channels: any[] }) {
    const total = channels.length;
    const operational = channels.filter(c => c.status !== 'STOPPED' && c.status !== 'CREDENTIALS').length;
    const attention = channels.filter(c => c.status === 'STOPPED' || c.status === 'CREDENTIALS').length;

    const stats = [
        { label: "Total Accounts", value: total, icon: Share2, color: "text-primary", bg: "bg-primary/10" },
        { label: "Operational", value: operational, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Needs Attention", value: attention, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Disconnected", value: 0, icon: Link2, color: "text-rose-500", bg: "bg-rose-500/10" }, // Can derive from specific statuses if Unipile gives "DISCONNECTED"
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <h3 className="text-2xl font-bold mt-1 text-foreground">{stat.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}
