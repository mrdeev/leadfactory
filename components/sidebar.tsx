"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Zap,
  LayoutDashboard,
  Users,
  Send,
  Mail,
  Calendar,
  Sunrise,
  Settings,
  CreditCard,
  User,
  Moon,
  Sun,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar-context";
import { useProduct } from "@/components/product-context";
import { AddProductDialog } from "@/components/add-product-dialog";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/daily-briefing", label: "Daily Briefing", icon: Sunrise },
];

const bottomNav = [
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/account", label: "Account", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();
  const { selectedProduct, products, setSelectedProduct } = useProduct();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [addProductOpen, setAddProductOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const productSettingsActive = pathname.includes("/products/");

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 shrink-0 items-center border-b px-4", collapsed && "justify-center px-2")}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight">Lead Factory</span>
          )}
        </Link>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 font-medium"
              onClick={() => setAddProductOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add New Product
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-between px-3 py-2 font-normal"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium">
                      {selectedProduct?.name.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <span className="truncate text-sm font-medium">
                      {selectedProduct?.name || "Select Product"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {products.map((product) => (
                  <DropdownMenuItem
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="gap-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium">
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{product.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedProduct && !selectedProduct.wizard_completed ? (
              <Button
                size="sm"
                className="w-full gap-2 bg-primary/90 font-medium hover:bg-primary"
                onClick={() => router.push(`/products/${selectedProduct.id}/wizard`)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Setup Wizard
              </Button>
            ) : null}
          </>
        )}

        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Separator className="mx-2" />

      <div className="space-y-1 px-2 py-3">
        <Link
          href={selectedProduct ? `/products/${selectedProduct.id}/settings` : "#"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
            productSettingsActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Product Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && "Product Settings"}
        </Link>

        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Toggle theme" : undefined}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-card transition-[width] duration-200 lg:block",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {sidebarContent}
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">Lead Factory</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] border-r bg-card shadow-xl lg:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}

      <AddProductDialog
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
      />
    </>
  );
}
