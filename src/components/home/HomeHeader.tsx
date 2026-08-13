"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  MapPin,
  UserCircle2,
} from "lucide-react";

import LocationBottomSheet from "@/components/location/LocationBottomSheet";
import { useLocation } from "@/hooks/useLocation";
import type { MapboxLocationSuggestion } from "@/services/mapbox.service";

const PENDING_LOCATION_KEY = "bootkit_pending_location_v1";
const DEFAULT_LOCATION_NAME = "Sardarshahar";

export default function HomeHeader() {
  const router = useRouter();
  const { location } = useLocation();

  const [showHeaderInfo, setShowHeaderInfo] = useState(true);
  const [locationSheetOpen, setLocationSheetOpen] =
    useState(false);

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

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (
        currentScrollY > lastScrollY &&
        currentScrollY > 80
      ) {
        setShowHeaderInfo(false);
      } else {
        setShowHeaderInfo(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/20 bg-white/55 px-4 py-4 backdrop-blur-xl">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showHeaderInfo
              ? "max-h-28 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <h1 className="text-[12px] font-brown text-[var(--text-primary)]">
            Bootkit.in
          </h1>

          <p className="text-[20px] font-brown text-[var(--text-primary)]">
            15 minutes in delivery
          </p>

          <button
            type="button"
            onClick={() => setLocationSheetOpen(true)}
            className="mt-1 flex items-center gap-1"
          >
            <MapPin
              size={15}
              className="text-[var(--primary)]"
            />

            <span className="text-[12px] font-bold">
              {location?.area ?? DEFAULT_LOCATION_NAME}
            </span>

            <ChevronDown
              size={15}
              className="text-gray-500"
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-[0_4px_12px_rgba(0,0,0,.08)] backdrop-blur-md"
          >
            <Bell size={19} />
          </button>

          <Link
            href="/account"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-[0_4px_12px_rgba(0,0,0,.08)] backdrop-blur-md"
          >
            <UserCircle2 size={22} />
          </Link>
        </div>
      </header>

      <LocationBottomSheet
        open={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        onSelect={handleLocationSelect}
      />
    </>
  );
}