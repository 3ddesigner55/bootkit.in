"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import LocationBottomSheet from "@/components/location/LocationBottomSheet";
import { useLocation } from "@/hooks/useLocation";
import type { MapboxLocationSuggestion } from "@/services/mapbox.service";

const PENDING_LOCATION_KEY = "bootkit_pending_location_v1";

export default function SelectLocationPage() {
  const router = useRouter();
  const { location } = useLocation();

  const handleLocationSelect = useCallback(
    (suggestion: MapboxLocationSuggestion) => {
      try {
        window.sessionStorage.setItem(
          PENDING_LOCATION_KEY,
          JSON.stringify(suggestion),
        );

        router.push("/confirm-location");
      } catch {
        // Keep the location selector open if storage fails.
      }
    },
    [router],
  );

  const handleClose = () => {
    if (location) {
      router.replace("/");
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[var(--background)]">
      <LocationBottomSheet
        open
        onClose={handleClose}
        onSelect={handleLocationSelect}
      />
    </main>
  );
}