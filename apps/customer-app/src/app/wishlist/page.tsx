"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Heart,
  MapPin,
  Search,
} from "lucide-react";

import CustomerAuthGuard from "@/components/auth/CustomerAuthGuard";
import LocationBottomSheet from "@/components/location/LocationBottomSheet";
import WishlistCompactCard from "@/components/wishlist/WishlistCompactCard";
import { useLocation } from "@/hooks/useLocation";
import { useWishlist } from "@/hooks/useWishlist";
import type { MapboxLocationSuggestion } from "@/services/mapbox.service";

const PENDING_LOCATION_KEY = "bootkit_pending_location_v1";
const DEFAULT_LOCATION_NAME = "Sardarshahar";

export default function WishlistPage() {
  const router = useRouter();
  const { items, hydrated } = useWishlist();
  const { location } = useLocation();

  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  const handleLocationSelect = useCallback(
    (suggestion: MapboxLocationSuggestion) => {
      try {
        window.sessionStorage.setItem(
          PENDING_LOCATION_KEY,
          JSON.stringify(suggestion),
        );
      } catch {
        return;
      }

      setLocationSheetOpen(false);
      router.push("/confirm-location");
    },
    [router],
  );

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-[#F8FAF8] pb-28 text-[var(--text-primary)]">
        {/* Top Wishlist Header with Title, Delivery Address & Search Icon */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#EEF2EF] bg-white/95 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-black transition hover:bg-[#E5E7EB] active:scale-95"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-[var(--text-primary)] truncate">
                Your Wishlist
                {hydrated && items.length > 0 ? (
                  <span className="ml-1 text-xs font-bold text-[var(--text-muted)]">
                    ({items.length})
                  </span>
                ) : null}
              </h1>

              {/* Delivery Address (Matches Home Page Header) */}
              <button
                type="button"
                onClick={() => setLocationSheetOpen(true)}
                className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                <MapPin size={12} className="text-[var(--primary)] shrink-0" />
                <span className="truncate max-w-[170px] sm:max-w-xs">
                  {location?.area ?? DEFAULT_LOCATION_NAME}
                </span>
                <ChevronDown size={13} className="text-gray-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Right Side: Search Icon Button (Navigates to /search) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-primary)] shadow-sm transition hover:bg-[#F3F4F6] active:scale-95"
            >
              <Search size={18} />
            </Link>
          </div>
        </header>

        {/* Main Wishlist Grid */}
        <main className="mx-auto max-w-md px-3 py-4">
          {!hydrated ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[250px] animate-pulse rounded-[20px] bg-white"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <section className="flex min-h-[calc(100svh-12rem)] flex-col items-center justify-center px-5 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-[var(--danger)]">
                <Heart size={35} fill="currentColor" />
              </span>

              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                Your wishlist is empty
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Start adding your favourite products.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-black text-white shadow-md transition active:scale-95"
              >
                Explore Products
              </Link>
            </section>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((product) => (
                <WishlistCompactCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

        {/* Location Picker Sheet */}
        <LocationBottomSheet
          open={locationSheetOpen}
          onClose={() => setLocationSheetOpen(false)}
          onSelect={handleLocationSelect}
        />
      </div>
    </CustomerAuthGuard>
  );
}
