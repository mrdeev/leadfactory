"use client";

import { Sidebar } from "./Sidebar";
import { UserCircle, Search, HelpCircle, Rocket, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const productIdMatch = pathname?.match(/\/dashboard\/([^/]+)/);
    const productId = productIdMatch ? productIdMatch[1] : null;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-8">
                    <div className="flex-1 max-w-2xl relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-11 bg-slate-50 border-none text-sm h-10 w-full rounded-full focus-visible:ring-1 focus-visible:ring-slate-200"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium cursor-pointer hover:text-slate-700">
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">S</div>
                            support
                        </div>

                        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-100">
                            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" className="h-full w-full object-cover" />
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-10 bg-[#F8F9FA]">
                    {children}
                </main>
            </div>
        </div>
    );
}
