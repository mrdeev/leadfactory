"use client";

import Link from "next/link";
import { Plus, LayoutDashboard, Users, Megaphone, MessageSquare, Calendar, FileText, ChevronDown, Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreateProductModal } from "@/components/products/CreateProductModal";
import { WizardSelectorModal } from "@/components/products/WizardSelectorModal";

export function Sidebar() {
    const pathname = usePathname();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWizardSelectorOpen, setIsWizardSelectorOpen] = useState(false);
    const [products, setProducts] = useState<{ id: string, name: string }[]>([]);

    // Determine active product from URL
    const activeProductId = pathname?.split('/')[2];
    const currentProduct = products.find(p => p.id === activeProductId) || products[0];

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        };
        fetchProducts();
    }, [isCreateModalOpen]); // Refresh when a new product might have been created

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/dashboard/linkedin-scraper", icon: LayoutDashboard, label: "Linkedin Scraper" },
        { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
        { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns" },
        { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
        { href: "/dashboard/meetings", icon: Calendar, label: "Meetings" },
    ];

    const bottomNavItems = [
        { href: "/dashboard/product-settings", icon: Settings, label: "Company Settings" },
        { href: "/dashboard/pricing", icon: LayoutDashboard, label: "Pricing" },
        { href: "/dashboard/account", icon: Users, label: "Account" },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-100 bg-white text-slate-900">
            <div className="p-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">TopSalesAgent</h1>
            </div>

            <div className="px-4 mb-4">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-slate-600 border-slate-200 font-normal hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Add a Company
                </Button>
            </div>

            <CreateProductModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <WizardSelectorModal
                open={isWizardSelectorOpen}
                onOpenChange={setIsWizardSelectorOpen}
                products={products}
                onCreateNew={() => {
                    setIsWizardSelectorOpen(false);
                    setIsCreateModalOpen(true);
                }}
            />

            <div className="px-4 mb-2">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/dashboard/${product.id}`}
                        className={cn(
                            "flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            pathname?.includes(product.id) ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <div className="bg-slate-200 p-1 rounded-sm mr-2">
                            <LayoutDashboard className="h-3 w-3" />
                        </div>
                        {product.name}
                    </Link>
                ))}
            </div>

            <div className="px-4 mb-8">
                <Button
                    onClick={() => setIsWizardSelectorOpen(true)}
                    className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white gap-2 font-medium"
                >
                    Setup Wizard
                </Button>
            </div>


            <nav className="flex-1 space-y-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1",
                                isActive
                                    ? "bg-black text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-1">
                {bottomNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <item.icon className="mr-3 h-4 w-4 text-slate-400" />
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
