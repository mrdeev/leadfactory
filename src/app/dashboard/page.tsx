"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Megaphone,
    ArrowRight,
    TrendingUp,
    Mail,
    Calendar,
    Sparkles,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function DashboardPage() {
    const { user } = useAuthContext();
    const [stats, setStats] = useState({ contacts: 0, products: 0, messages: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [contactsRes, productsRes, messagesRes] = await Promise.all([
                    fetch("/api/contacts"),
                    fetch("/api/products"),
                    fetch("/api/messages"),
                ]);
                const contacts = contactsRes.ok ? await contactsRes.json() : [];
                const products = productsRes.ok ? await productsRes.json() : [];
                const messages = messagesRes.ok ? await messagesRes.json() : [];
                setStats({
                    contacts: Array.isArray(contacts) ? contacts.length : 0,
                    products: Array.isArray(products) ? products.length : 0,
                    messages: Array.isArray(messages) ? messages.length : 0,
                });
            } catch {
                /* silent */
            }
        };
        fetchStats();
    }, []);

    const userName = user?.email?.split("@")[0] || "there";

    const statCards = [
        { label: "Total Contacts", value: stats.contacts, icon: Users, className: "stat-indigo", iconColor: "text-primary/70" },
        { label: "Active Campaigns", value: stats.products, icon: Megaphone, className: "stat-emerald", iconColor: "text-emerald-400" },
        { label: "Emails Sent", value: stats.messages, icon: Mail, className: "stat-amber", iconColor: "text-amber-400" },
        { label: "Meetings Booked", value: 0, icon: Calendar, className: "stat-rose", iconColor: "text-rose-400" },
    ];

    const quickActions = [
        { href: "/dashboard/linkedin-scraper", icon: Zap, title: "Find New Leads", desc: "Scrape LinkedIn for your ideal prospects", gradient: "gradient-primary" },
        { href: "/dashboard/campaigns", icon: Megaphone, title: "Launch Campaign", desc: "Create AI-powered email sequences", gradient: "gradient-success" },
        { href: "/dashboard/messages", icon: Mail, title: "Review Messages", desc: "Approve pending emails and replies", gradient: "gradient-warning" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-2xl p-8 card-surface bg-gradient-to-br from-card to-muted">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                            Command Center
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-heading mb-2">
                        Hey {userName} 👋
                    </h1>
                    <p className="text-body max-w-lg">
                        Your outreach engine is ready. Let&apos;s turn strangers into customers
                        — one smart email at a time.
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className={`${stat.className} rounded-xl p-5 card-hover`}>
                        <div className="flex items-center justify-between mb-3">
                            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </div>
                        <p className="text-2xl font-bold text-heading">{stat.value}</p>
                        <p className="text-xs text-body mt-0.5 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-semibold text-body uppercase tracking-widest mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href}>
                            <div className="group rounded-xl p-6 card-surface card-hover cursor-pointer">
                                <div className={`h-10 w-10 rounded-xl ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <action.icon className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-heading mb-1 flex items-center gap-2">
                                    {action.title}
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </h3>
                                <p className="text-sm text-body">{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
