"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Plus, LayoutDashboard, ChevronRight, Building2, Sparkles,
    Loader2, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WizardSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: { id: string; name: string }[];
    onCreateNew: () => void;
}

export function WizardSelectorModal({
    open,
    onOpenChange,
    products,
    onCreateNew,
}: WizardSelectorModalProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [filter, setFilter] = useState("");

    const handleSelectProduct = async (productId: string) => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const res = await fetch(`/api/products/${productId}`);
            if (!res.ok) throw new Error("Failed to fetch existing product");
            const existingProduct = await res.json();

            const { id, ...productDataToClone } = existingProduct;
            delete productDataToClone.campaignStatus;
            delete productDataToClone.campaignSequence;
            delete productDataToClone.campaignComplete;

            const createRes = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...productDataToClone,
                    productName: existingProduct.name,
                }),
            });

            if (!createRes.ok) throw new Error("Failed to clone product");
            const newProduct = await createRes.json();

            router.push(`/dashboard/${newProduct.id}/setup`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error duplicating product:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const filtered = filter.trim()
        ? products.filter((p) =>
            p.name.toLowerCase().includes(filter.toLowerCase())
        )
        : products;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[420px] md:w-[480px] p-0 flex flex-col overflow-hidden border-l border-slate-200/60 shadow-2xl"
            >
                {/* ── Header ─────────────────────────────────────── */}
                <SheetHeader className="px-6 pt-7 pb-4 border-b border-slate-100 shrink-0 bg-white">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="gradient-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg text-white">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                                Create Campaign
                            </SheetTitle>
                            <SheetDescription className="text-slate-400 text-sm font-medium mt-0.5">
                                Choose a company or start fresh
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* ── New Company Card ────────────────────────────── */}
                <div className="px-5 pt-5 shrink-0">
                    <button
                        onClick={onCreateNew}
                        disabled={isCreating}
                        className="w-full group relative flex items-center gap-4 p-5 bg-gradient-to-br from-primary/5 to-white border border-primary/20 rounded-2xl text-left transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-all duration-300">
                            {isCreating ? (
                                <Loader2 className="h-6 w-6 text-primary group-hover:text-primary-foreground animate-spin" />
                            ) : (
                                <Plus className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900">
                                Add a Company
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mt-0.5">
                                Start fresh from a website URL or product
                                description
                            </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                </div>

                {/* ── Existing Companies ──────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden px-5 pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Existing Companies
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {filtered.length}
                        </span>
                    </div>

                    {/* Search */}
                    {products.length > 5 && (
                        <div className="relative mb-3 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <Input
                                placeholder="Search companies..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-9 h-9 text-sm rounded-xl border-slate-200 focus:border-primary bg-slate-50/80"
                            />
                        </div>
                    )}

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1 custom-scrollbar">
                        {filtered.length > 0 ? (
                            filtered.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() =>
                                        handleSelectProduct(product.id)
                                    }
                                    disabled={isCreating}
                                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group active:bg-slate-100/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            {isCreating ? (
                                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                            ) : (
                                                <LayoutDashboard className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                                            {product.name}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Building2 className="h-10 w-10 text-slate-200 mb-3" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    {filter
                                        ? "No matching companies"
                                        : "No companies yet"}
                                </p>
                                {filter && (
                                    <button
                                        onClick={() => setFilter("")}
                                        className="mt-2 text-xs text-primary hover:underline"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ─────────────────────────────────────── */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        TopSalesAgent v1.0
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-200 text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] h-9 px-5 rounded-xl hover:bg-slate-50"
                    >
                        Close
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
