"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Grid2X2,
  Image,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Users,
  X,
  Upload,
  Truck,
  RotateCcw,
  DollarSign,
  LifeBuoy,
  History,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAccount } from "@/hooks/useAccount";

const navigationItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Home Merchandising", href: "/admin/home-builder", icon: Sparkles },
  { label: "Products", href: "/admin/products", icon: Boxes },
  { label: "Categories", href: "/admin/categories", icon: Grid2X2 },
  { label: "Brands", href: "/admin/brands", icon: Tags },
  { label: "Media Library", href: "/admin/media", icon: Image },
  { label: "Hero Banners", href: "/admin/banners", icon: FileImage },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Staff & Users", href: "/admin/users", icon: Users },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Riders", href: "/admin/riders", icon: Truck },
  { label: "Marketing & Promotions", href: "/admin/marketing", icon: Sparkles },
  { label: "Orders Overview", href: "/admin/orders", icon: ShoppingBag },
  { label: "Live Packing", href: "/admin/orders/live", icon: PackageCheck },
  { label: "In-Transit Dispatch", href: "/admin/orders/in-transit", icon: Truck },
  { label: "Order History", href: "/admin/orders/history", icon: History },
  { label: "Support Tickets", href: "/admin/support/tickets", icon: LifeBuoy },
  { label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { label: "Refunds", href: "/admin/refunds", icon: DollarSign },

  { label: "Inventory", href: "/admin/inventory", icon: PackageCheck },
  { label: "Import Center", href: "/admin/catalog/import", icon: Upload },
  { label: "Delivery Areas", href: "/admin/delivery-areas", icon: MapPin },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  compact = false,
  onNavigate,
}: {
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { logout } = useAccount();

  return (
    <>
      <div className={`flex h-16 items-center border-b border-white/10 px-4 ${compact ? "justify-center" : "gap-3"}`}>
        <Link
          href="/admin/products/new"
          title="Add Product"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[var(--primary)] transition hover:scale-105 active:scale-95"
        >
          B
        </Link>
        {!compact && (
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">BootKit</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">Admin panel</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <p className={`mb-2 px-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/45 ${compact ? "sr-only" : ""}`}>
          Management
        </p>
        <div className="space-y-1">
          {navigationItems.map(({ label, href, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                title={compact ? label : undefined}
                className={`group flex h-10 items-center rounded-xl text-xs font-bold transition ${
                  compact ? "justify-center px-2" : "gap-3 px-3"
                } ${
                  active
                    ? "bg-white text-[var(--primary)] shadow-[var(--shadow-sm)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!compact && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => logout()}
          title={compact ? "Logout" : undefined}
          className={`group flex h-10 w-full items-center rounded-xl text-xs font-bold transition text-white/70 hover:bg-white/10 hover:text-white ${
            compact ? "justify-center px-2" : "gap-3 px-3"
          }`}
        >
          <LogOut size={17} className="shrink-0" />
          {!compact && <span>Logout</span>}
        </button>
        {!compact && (
          <div className="mt-3 px-3">
            <p className="text-[10px] font-bold text-white/55">BootKit Admin</p>
            <p className="mt-0.5 text-[9px] text-white/40">Production workspace</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[var(--primary)] shadow-[var(--shadow-md)] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col bg-[var(--primary)] shadow-[var(--shadow-md)] transition-[width] duration-200 md:flex lg:hidden ${
          isTabletExpanded ? "w-64" : "w-20"
        }`}
      >
        <SidebarContent pathname={pathname} compact={!isTabletExpanded} />
        <button
          type="button"
          onClick={() => setIsTabletExpanded((current) => !current)}
          className="absolute -right-4 top-20 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--primary)] shadow-[var(--shadow-sm)]"
          aria-label={isTabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isTabletExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--shadow-md)] md:hidden"
        aria-label="Open admin navigation"
      >
        <Menu size={20} />
      </button>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close admin navigation"
          />
          <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-[var(--primary)] shadow-[var(--shadow-md)]">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white"
              aria-label="Close admin navigation"
            >
              <X size={17} />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setIsMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
