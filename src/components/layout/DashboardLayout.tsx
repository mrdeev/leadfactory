"use client";

import { Sidebar } from "./Sidebar";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen overflow-hidden page-bg">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex h-14 items-center justify-between header-bg px-8">
                    <div className="flex-1 max-w-lg relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Search anything..."
                            className="pl-11 bg-muted/50 border-border text-sm h-9 w-full rounded-lg text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:border-ring/30"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <button className="relative p-2 rounded-lg hover:bg-accent/30 transition-colors group">
                            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-[var(--card)]" />
                        </button>

                        {/* Divider */}
                        <div className="h-6 w-px bg-border" />

                        {/* Help */}
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium cursor-pointer hover:text-foreground transition-colors">
                            <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                ?
                            </div>
                            <span className="text-xs">Help</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
