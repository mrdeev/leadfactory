"use client";

import Link from "next/link";
import {
    Plus,
    LayoutDashboard,
    Users,
    Megaphone,
    MessageSquare,
    Calendar,
    Settings,
    Sparkles,
    Search as SearchIcon,
    ChevronRight,
    ChevronDown,
    LogOut,
    Sun,
    Moon,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreateProductModal } from "@/components/products/CreateProductModal";
import { WizardSelectorModal } from "@/components/products/WizardSelectorModal";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuthContext();
    const { theme, toggleTheme } = useTheme();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWizardSelectorOpen, setIsWizardSelectorOpen] = useState(false);
    const [products, setProducts] = useState<{ id: string; name: string; campaignStatus?: string }[]>([]);
    const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);

    const activeProductId = pathname?.split("/")[2];

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await fetch("/api/products");
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        };
        fetchProducts();
    }, [isCreateModalOpen]);

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-primary/80", hoverColor: "group-hover:text-primary" },
        { href: "/dashboard/linkedin-scraper", icon: SearchIcon, label: "Lead Finder", color: "text-teal-500", hoverColor: "group-hover:text-teal-500" },
        { href: "/dashboard/contacts", icon: Users, label: "Contacts", color: "text-purple-500", hoverColor: "group-hover:text-purple-500" },
        { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns", color: "text-amber-500", hoverColor: "group-hover:text-amber-500" },
        { href: "/dashboard/messages", icon: MessageSquare, label: "Messages", color: "text-emerald-500", hoverColor: "group-hover:text-emerald-500" },
        { href: "/dashboard/meetings", icon: Calendar, label: "Meetings", color: "text-pink-500", hoverColor: "group-hover:text-pink-500" },
    ];

    const bottomNavItems = [
        { href: "/dashboard/channels", icon: Share2, label: "Channels" },
        { href: "/dashboard/product-settings", icon: Settings, label: "Settings" },
    ];

    const groupedProducts = Object.values(
        products.reduce((acc, product) => {
            if (!acc[product.name]) {
                acc[product.name] = { name: product.name, items: [] };
            }
            acc[product.name].items.push(product);
            return acc;
        }, {} as Record<string, { name: string; items: typeof products }>)
    );

    const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
    const userInitial = user?.email?.[0]?.toUpperCase() || "U";

    return (
        <div className="flex h-screen w-64 flex-col sidebar-bg">
            {/* Logo */}
            <div className="p-6 pb-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold gradient-text-brand">
                        TopSalesAgent
                    </span>
                </Link>
            </div>

            {/* Add Company */}
            <div className="px-4 mb-3">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-muted-foreground border-border bg-transparent font-medium hover:bg-accent/50 hover:text-foreground transition-all h-9 text-sm"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add a Company
                </Button>
            </div>

            <CreateProductModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
            <WizardSelectorModal
                open={isWizardSelectorOpen}
                onOpenChange={setIsWizardSelectorOpen}
                products={products}
                onCreateNew={() => { setIsWizardSelectorOpen(false); setIsCreateModalOpen(true); }}
            />

            {/* Product List */}
            {products.length > 0 && (
                <div className="px-3 mb-2">
                    <button
                        onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
                        className="flex items-center w-full text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2 hover:text-muted-foreground transition-colors"
                    >
                        Companies
                        {isCompaniesExpanded ? (
                            <ChevronDown className="ml-auto h-3 w-3" />
                        ) : (
                            <ChevronRight className="ml-auto h-3 w-3" />
                        )}
                    </button>
                    {isCompaniesExpanded && groupedProducts.map((group) => {
                        const hasMultiple = group.items.length > 1;
                        const firstProduct = group.items[0];
                        const isPathActive = group.items.some(p => pathname?.includes(p.id));
                        const isExpanded = expandedCompanies[group.name] !== undefined
                            ? expandedCompanies[group.name]
                            : isPathActive;

                        return (
                            <div key={group.name} className="flex flex-col mb-0.5 relative group">
                                {!hasMultiple ? (
                                    <>
                                        <Link
                                            href={`/dashboard/${firstProduct.id}`}
                                            className={cn(
                                                "flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 pr-10",
                                                pathname?.includes(firstProduct.id)
                                                    ? "bg-accent/60 text-foreground"
                                                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-6 w-6 rounded-md flex items-center justify-center mr-2.5 text-[10px] font-bold",
                                                pathname?.includes(firstProduct.id) ? "gradient-primary text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                {firstProduct.name[0]?.toUpperCase()}
                                            </div>
                                            <span className="truncate">{firstProduct.name}</span>
                                        </Link>
                                        {/* Individual company status toggle */}
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newStatus = firstProduct.campaignStatus === 'active' ? 'paused' : 'active';
                                                const res = await fetch(`/api/products/${firstProduct.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ campaignStatus: newStatus }),
                                                });
                                                if (res.ok) {
                                                    setProducts(prev => prev.map(p => p.id === firstProduct.id ? { ...p, campaignStatus: newStatus } : p));
                                                }
                                            }}
                                            className={cn(
                                                "absolute right-2 top-1/2 -translate-y-1/2 h-4 w-7 rounded-full transition-all opacity-0 group-hover:opacity-100 flex items-center px-0.5 z-10",
                                                firstProduct.campaignStatus === 'active' ? "bg-blue-500" : "bg-slate-300"
                                            )}
                                            title={firstProduct.campaignStatus === 'active' ? "Pause campaign" : "Activate campaign"}
                                        >
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full shrink-0",
                                                firstProduct.campaignStatus === 'active' ? "bg-primary" : "bg-slate-300"
                                            )} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setExpandedCompanies(prev => ({ ...prev, [group.name]: !isExpanded }))}
                                            className={cn(
                                                "flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                isPathActive || isExpanded
                                                    ? "text-foreground"
                                                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-6 w-6 rounded-md flex items-center justify-center mr-2.5 text-[10px] font-bold",
                                                pathname?.includes(firstProduct.id) ? "gradient-primary text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                {firstProduct.name[0]?.toUpperCase()}
                                            </div>
                                            <span className="truncate flex-1 text-left">{group.name}</span>
                                            {isExpanded ? <ChevronDown className="h-4 w-4 ml-1 opacity-50" /> : <ChevronRight className="h-4 w-4 ml-1 opacity-50" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="pl-9 pr-2 py-1 space-y-1 border-l-2 border-accent/50 ml-6 my-1">
                                                {group.items.map((product, idx) => {
                                                    const isActive = pathname?.includes(product.id);
                                                    return (
                                                        <div key={product.id} className="group/item relative">
                                                            <Link
                                                                href={`/dashboard/${product.id}`}
                                                                className={cn(
                                                                    "flex items-center w-full rounded-md px-3 py-1.5 text-xs font-medium transition-all text-left",
                                                                    isActive
                                                                        ? "bg-accent/60 text-foreground"
                                                                        : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                                                                )}
                                                            >
                                                                <span className="truncate">Campaign {idx + 1}</span>
                                                            </Link>
                                                            {/* Campaign status toggle */}
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const newStatus = product.campaignStatus === 'active' ? 'paused' : 'active';
                                                                    const res = await fetch(`/api/products/${product.id}`, {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ campaignStatus: newStatus }),
                                                                    });
                                                                    if (res.ok) {
                                                                        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, campaignStatus: newStatus } : p));
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-6 rounded-full transition-all opacity-0 group-hover/item:opacity-100 flex items-center px-0.5",
                                                                    product.campaignStatus === 'active' ? "bg-blue-500" : "bg-slate-300"
                                                                )}
                                                                title={product.campaignStatus === 'active' ? "Pause campaign" : "Activate campaign"}
                                                            >
                                                                <div className={cn(
                                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                                    product.campaignStatus === 'active' ? "bg-primary" : "bg-slate-300"
                                                                )} />
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Setup Wizard */}
            <div className="px-4 mb-4">
                <Button
                    onClick={() => setIsWizardSelectorOpen(true)}
                    className="w-full gradient-primary hover:opacity-90 text-white gap-2 font-semibold shadow-lg shadow-indigo-500/20 h-9 text-sm transition-all duration-200"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Setup Wizard
                </Button>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 space-y-0.5 px-3">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">
                    Navigation
                </p>
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "nav-active"
                                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "mr-3 h-4 w-4 transition-colors",
                                isActive ? (item.color || "text-primary") : `text-muted-foreground/60 ${item.hoverColor || "group-hover:text-muted-foreground"}`
                            )} />
                            {item.label}
                            {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary/60" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-border space-y-1">
                {bottomNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all duration-200"
                    >
                        <item.icon className="mr-3 h-4 w-4 text-muted-foreground/60" />
                        {item.label}
                    </Link>
                ))}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all duration-200 group"
                >
                    {theme === "dark" ? (
                        <Sun className="mr-3 h-4 w-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
                    ) : (
                        <Moon className="mr-3 h-4 w-4 text-primary/80 group-hover:text-primary transition-colors" />
                    )}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-muted/50 border border-border">
                    <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user?.email?.split("@")[0] || "User"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                            {user?.email || ""}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-all"
                        title="Sign out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
