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

export default function MobileHeader() {
  const { totalItems, hydrated: cartHydrated } = useCart();

  const { location,hydrated: locationHydrated,openLocationModal,} = useLocation();
  const { unreadCount,hydrated: notificationsHydrated,} = useNotifications(); 
    
   
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

        <SearchBar
          compact
          className="mt-3"
          placeholder="Search products and categories"
        />
      </Container>
    </header>
  );
}