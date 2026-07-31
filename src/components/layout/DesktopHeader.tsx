"use client";

import Link from "next/link";
import { useAccount } from "@/hooks/useAccount";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

import {
  ChevronDown,
  Heart,
  MapPin,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Logo from "@/components/ui/Logo";
import SearchBar from "@/components/ui/SearchBar";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";



export default function DesktopHeader() {
  const { totalItems, hydrated: cartHydrated } = useCart();
  
  const {
    location,
    hydrated: locationHydrated,
    openLocationModal,
  } = useLocation();

  const {
  profile,
  hydrated: accountHydrated,
} = useAccount();

const {
  unreadCount,
  hydrated: notificationsHydrated,
} = useNotifications();

  return (
    <header className="hidden border-b border-[var(--border)] bg-white/95 backdrop-blur-xl lg:block">
      <Container className="flex h-[82px] items-center gap-5">
        <Logo className="shrink-0" />

        <button
          type="button"
          onClick={openLocationModal}
          aria-label="Select delivery location"
          className="group flex min-w-[215px] max-w-[245px] items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-soft)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
            <MapPin size={20} strokeWidth={2.2} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Delivering to
            </span>

            <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-[var(--text-primary)]">
              <span className="truncate">
                {locationHydrated && location
                  ? location.area
                  : "Select your location"}
              </span>

              <ChevronDown
                size={15}
                className="shrink-0 transition group-hover:translate-y-0.5"
              />
            </span>

            {locationHydrated && location && (
              <span className="mt-1 block truncate text-[10px] font-semibold text-[var(--primary)]">
                {location.pincode} · {location.deliveryMinutes}
              </span>
            )}
          </span>
        </button>

        <SearchBar className="mx-auto max-w-[650px] flex-1" />

        <nav
          aria-label="Account actions"
          className="flex shrink-0 items-center gap-1.5"
        >
          <Link
  href="/notifications"
  aria-label="Notifications"
  className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
>
  <Bell size={21} strokeWidth={2} />

  {notificationsHydrated && unreadCount > 0 && (
    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[8px] font-black text-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
          >
            <Heart size={21} />
          </Link>

          <Link
            href="/account"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
          >
            <UserRound size={21} />

            <span className="hidden xl:block">
              <span className="block text-[11px] text-[var(--text-muted)]">
                Hello
              </span>

              <span className="mt-1 block text-[13px] font-bold leading-none text-[var(--text-primary)]">
  {accountHydrated && profile.fullName
    ? profile.fullName.split(" ")[0]
    : "Account"}
</span>
            </span>
          </Link>

          <Link
            href="/cart"
            className="flex h-12 items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
          >
            <ShoppingBag size={20} />

            <span className="text-[13px] font-bold">
              Cart
            </span>

            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[var(--primary)]">
              {cartHydrated ? totalItems : 0}
            </span>
          </Link>
        </nav>
      </Container>
    </header>
  );
}