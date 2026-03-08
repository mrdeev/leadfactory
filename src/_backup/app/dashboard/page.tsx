"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-2">
                <LayoutDashboard className="h-12 w-12 text-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome to TopSalesAgent</h2>
            <p className="text-sm text-slate-500 leading-relaxed text-center">
                Select a company from the sidebar to manage your leads,
                or add a new one to start your outreach engine.
            </p>
            <div className="flex gap-4">
                <Button className="bg-black hover:bg-gray-800 text-white h-10 px-6">
                    Add a Company
                </Button>
            </div>
        </div>
    );
}

