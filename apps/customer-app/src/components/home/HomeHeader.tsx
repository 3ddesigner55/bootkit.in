"use client";

import { Bell, ChevronDown, MapPin, UserCircle2 } from "lucide-react";
import LocationBottomSheet from "@/components/location/LocationBottomSheet";
import type { MapboxLocationSuggestion } from "@/services/mapbox.service";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/hooks/useAccount";

const LOCATION_STORAGE_KEY = "bootkit_selected_location_v1";
const DEFAULT_LOCATION_NAME = "Sardarshahar";

function readStoredLocation(): MapboxLocationSuggestion | null {
  try {
    const storedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);

    if (!storedLocation) {
      return null;
    }

    const location: unknown = JSON.parse(storedLocation);

    if (
      !location ||
      typeof location !== "object" ||
      !("id" in location) ||
      !("label" in location) ||
      typeof location.id !== "string" ||
      typeof location.label !== "string"
    ) {
      return null;
    }

    return {
      id: location.id,
      label: location.label,
      ...("description" in location && typeof location.description === "string"
        ? { description: location.description }
        : {}),
    };
  } catch {
    return null;
  }
}

export default function HomeHeader() {
  const { session } = useAccount();
  const [showHeaderInfo, setShowHeaderInfo] = useState(true);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<MapboxLocationSuggestion | null>(null);

  const handleLocationSelect = useCallback(
    (location: MapboxLocationSuggestion) => {
      setSelectedLocation(location);

      try {
        window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      } catch {
        // Storage failures should not prevent location selection.
      }
    },
    []
  );

  useEffect(() => {
    setSelectedLocation(readStoredLocation());
  }, []);

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

  window.addEventListener(
    "scroll",
    handleScroll
  );

  return () =>
    window.removeEventListener(
      "scroll",
      handleScroll
    );
}, []);

  return (
    <>
   <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 backdrop-blur-xl bg-white/55 border-b border-white/20">

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
      {selectedLocation?.label ?? DEFAULT_LOCATION_NAME}
    </span>

    <ChevronDown
      size={15}
      className="text-gray-500"
    />

  </button>

</div>

     <div className="flex items-center gap-3">

  <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,.08)]">
    <Bell size={19} />
  </button>

  {session ? (
    <Link
      href="/account"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,.08)] text-[var(--text-primary)]"
    >
      <UserCircle2 size={22} />
    </Link>
  ) : (
    <Link
      href="/login"
      className="flex h-11 items-center justify-center px-4 rounded-full border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,.08)] text-[12px] font-black text-[var(--primary)]"
    >
      Continue
    </Link>
  )}

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
