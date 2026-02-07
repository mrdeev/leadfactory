"use client";

import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { ProductProvider } from "@/components/product-context";
import { Sidebar } from "@/components/sidebar";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <div
        className="min-h-screen pt-14 transition-[margin] duration-200 lg:pt-0"
        style={{ marginLeft: typeof window !== "undefined" ? undefined : 0 }}
      >
        <div
          className="hidden min-h-screen lg:block"
          style={{ marginLeft: collapsed ? 60 : 220 }}
        >
          {children}
        </div>
        <div className="min-h-screen lg:hidden">
          {children}
        </div>
      </div>
    </>
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProductProvider>
        <ShellInner>{children}</ShellInner>
      </ProductProvider>
    </SidebarProvider>
  );
}
