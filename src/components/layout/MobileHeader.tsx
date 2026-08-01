"use client";

import { ChevronDown,MapPin,ShoppingBag,} from "lucide-react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import SearchBar from "@/components/ui/SearchBar";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileHeader() {
  const { totalItems, hydrated: cartHydrated } = useCart();

  const { location,hydrated: locationHydrated,openLocationModal,} = useLocation();
  const { unreadCount,hydrated: notificationsHydrated,} = useNotifications(); 
  const { activeCategories, hydrated: categoriesHydrated } = useAdminCategories();
  const pathname = usePathname(); const [showDiscover, setShowDiscover] = useState(true); const lastScrollY = useRef(0);
  useEffect(() => { const onScroll = () => { const current = window.scrollY; setShowDiscover(current < lastScrollY.current || current < 36); lastScrollY.current = current; }; window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
    
   
  return (
    <header className="border-b border-[var(--border)] bg-white/95 backdrop-blur-xl lg:hidden">
      <Container className="py-3">
        <div className="flex items-center justify-between gap-3">
          <Logo compact />

          <button
            type="button"
            onClick={openLocationModal}
            aria-label="Select delivery location"
            className="min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left transition active:bg-[var(--surface-soft)]"
          >
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--text-muted)]">
              <MapPin size={12} />
              Delivering to
            </span>

            <span className="mt-0.5 flex items-center gap-1 text-[13px] font-extrabold text-[var(--text-primary)]">
              <span className="truncate">
                {locationHydrated && location
                  ? location.area
                  : "Select location"}
              </span>

              <ChevronDown
                size={14}
                className="shrink-0"
              />
            </span>

            {locationHydrated && location && (
              <span className="mt-0.5 block truncate text-[9px] font-bold text-[var(--primary)]">
                {location.pincode} · {location.deliveryMinutes}
              </span>
            )}
          </button>

          <Link
  href="/notifications"
  aria-label="Open notifications"
  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
>
  <Bell size={18} />

  {notificationsHydrated && unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--danger)] px-1 text-[9px] font-black text-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</Link>

          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
          >
            <ShoppingBag size={19} />

            {cartHydrated && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)] px-1 text-[9px] font-black text-[var(--text-primary)]">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${showDiscover ? "mt-3 max-h-40 opacity-100" : "mt-0 max-h-0 opacity-0"}`}>
          <SearchBar compact placeholder="Search products and categories" />
          {pathname === "/" && categoriesHydrated && <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1"><span className="flex shrink-0 items-center rounded-full bg-[var(--primary)] px-3 py-1.5 text-[10px] font-bold text-white">All</span>{activeCategories.map((category) => <span key={category.id} className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] text-[var(--text-secondary)]"><span>{category.icon}</span>{category.name}</span>)}</div>}
        </div>
      </Container>
    </header>
  );
}
