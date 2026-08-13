"use client";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import LocationModal from "@/components/location/LocationModal";
import type {
  DeliveryArea,
  LocationContextValue,
  SelectedLocation,
} from "@/types/location";

export const LocationContext =
  createContext<LocationContextValue | null>(null);


const STORAGE_KEY = "bootkit_location_v1";
const DEVICE_LOCATION_KEY = "bootkit_device_location_v1";

function readStoredLocation(): SelectedLocation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SelectedLocation>;

    if (
      typeof parsed.city !== "string" ||
      typeof parsed.area !== "string" ||
      typeof parsed.pincode !== "string" ||
      typeof parsed.deliveryMinutes !== "string"
    ) {
      return null;
    }

    return {
      city: parsed.city,
      area: parsed.area,
      pincode: parsed.pincode,
      deliveryMinutes: parsed.deliveryMinutes,
    };
  } catch {
    return null;
  }
}

export default function LocationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [location, setLocation] =
    useState<SelectedLocation | null>(null);
  

  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLocation(readStoredLocation());
    setHydrated(true);
  }, []);

useEffect(() => {
  if (!hydrated) {
    return;
  }

  const dedicatedLocationFlow = [
  "/login",
  "/phone-login",
  "/otp-verification",
  "/select-location",
  "/confirm-location",
  "/unserviceable-area",
].includes(pathname);

  if (dedicatedLocationFlow) {
    setModalOpen(false);
    return;
  }

  if (!location) {
    setModalOpen(true);
  }
}, [hydrated, location, pathname]);

  const openLocationModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const selectLocation = useCallback((area: DeliveryArea) => {
    const selectedLocation: SelectedLocation = {
      city: area.city,
      area: area.area,
      pincode: area.pincode,
      deliveryMinutes: area.deliveryMinutes,
    };

    setLocation(selectedLocation);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(selectedLocation)
      );

      // Ask only after the customer has chosen a delivery area. Coordinates are
      // retained locally for future delivery-availability checks.
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => window.localStorage.setItem(DEVICE_LOCATION_KEY, JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, updatedAt: new Date().toISOString() })),
          () => undefined,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      }
    } catch {
      // Local storage failure should not break location selection.
    }

    setModalOpen(false);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore local storage failure.
    }
  }, []);

  const [resolvedStoreId, setResolvedStoreIdState] = useState<string | null>(null);

  const setResolvedStoreId = useCallback((storeId: string | null) => {
    setResolvedStoreIdState(storeId);
    if (storeId) {
      try {
        window.localStorage.setItem("bootkit_resolved_store_id", storeId);
      } catch {}
    }
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      resolvedStoreId,
      setResolvedStoreId,
      hydrated,
      modalOpen,
      openLocationModal,
      closeLocationModal,
      selectLocation,
      clearLocation,
    }),
    [
      location,
      resolvedStoreId,
      setResolvedStoreId,
      hydrated,
      modalOpen,
      openLocationModal,
      closeLocationModal,
      selectLocation,
      clearLocation,
    ]
  );


  return (
    <LocationContext.Provider value={value}>
      {children}
      <LocationModal />
    </LocationContext.Provider>
  );
}
