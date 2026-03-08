"use client";

import {
    Calendar,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Search,
    ChevronDown,
    CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function MeetingsPage() {
    const stats = [
        {
            label: "Upcoming",
            value: "0",
            icon: <Calendar className="h-5 w-5 text-blue-500" />,
            bgColor: "bg-blue-50"
        },
        {
            label: "Completed",
            value: "0",
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            bgColor: "bg-emerald-50"
        },
        {
            label: "No-Shows",
            value: "0",
            icon: <AlertCircle className="h-5 w-5 text-red-400" />,
            bgColor: "bg-red-50"
        },
        {
            label: "Conversions",
            value: "0",
            icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
            bgColor: "bg-emerald-50"
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Meetings</h1>
                <p className="text-slate-500">Manage your scheduled meetings and appointments</p>
            </div>

            {/* Statistics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-100 shadow-sm rounded-xl">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`${stat.bgColor} p-3 rounded-xl`}>
                                {stat.icon}
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                <div className="text-sm text-slate-500">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                        placeholder="Search meetings..."
                        className="pl-10 h-11 bg-white border-slate-200 focus:bg-white transition-all rounded-lg"
                    />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px] h-11 bg-white border-slate-200 rounded-lg">
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
            <Card className="border-slate-100 border-dashed shadow-none rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <CalendarDays className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No meetings found</h3>
                <p className="text-slate-500 max-w-sm leading-relaxed">
                    Meetings will appear here when booked via Calendly or other integrations
                </p>
            </Card>
        </div>
    );
}
