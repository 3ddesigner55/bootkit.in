"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Crosshair, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";

import { useLocation } from "@/hooks/useLocation";
import {
  resolveMapboxDeliveryLocation,
  type MapboxDeliveryLocation,
} from "@/services/mapbox.service";
import { resolveServiceabilityByPincode } from "@/services/serviceability.service";
import type { DeliveryArea } from "@/types/location";

const DEFAULT_CENTER: [number, number] = [74.4908, 28.4403];

export default function ConfirmLocationPage() {
    const PENDING_LOCATION_KEY = "bootkit_pending_location_v1";

type PendingLocation = {
  latitude: number;
  longitude: number;
};
  const router = useRouter();
  const { selectLocation, setResolvedStoreId } = useLocation();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState<MapboxDeliveryLocation | null>(null);

  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");

  const resolveMapCenter = useCallback(
    async (latitude: number, longitude: number) => {
      requestControllerRef.current?.abort();

      const controller = new AbortController();
      requestControllerRef.current = controller;

      setError("");
      setIsResolving(true);

      try {
        const result = await resolveMapboxDeliveryLocation(
          latitude,
          longitude,
          controller.signal,
        );

        setSelectedLocation(result);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setSelectedLocation(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to identify this location.",
        );
      } finally {
        if (requestControllerRef.current === controller) {
          setIsResolving(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const accessToken =
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

    if (!mapContainerRef.current || !accessToken) {
      setError("Mapbox access token is not configured.");
      return;
    }

if (!mapContainerRef.current || !accessToken) {
  setError("Mapbox access token is not configured.");
  return;
}

    mapboxgl.accessToken = accessToken;

    let initialCenter: [number, number] = DEFAULT_CENTER;

try {
  const rawPendingLocation =
    window.sessionStorage.getItem(PENDING_LOCATION_KEY);

  if (!rawPendingLocation) {
    router.replace("/select-location");
    return;
  }

  const pendingLocation = JSON.parse(
    rawPendingLocation,
  ) as Partial<PendingLocation>;

  if (
    typeof pendingLocation.latitude !== "number" ||
    typeof pendingLocation.longitude !== "number"
  ) {
    router.replace("/select-location");
    return;
  }

  initialCenter = [
    pendingLocation.longitude,
    pendingLocation.latitude,
  ];
} catch {
  router.replace("/select-location");
  return;
}

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: 15,
      attributionControl: false,
    });

    mapRef.current = map;

    const resolveCurrentCenter = () => {
      const center = map.getCenter();
      void resolveMapCenter(center.lat, center.lng);
    };

    map.on("load", resolveCurrentCenter);
    map.on("moveend", resolveCurrentCenter);

    return () => {
      requestControllerRef.current?.abort();
      map.off("load", resolveCurrentCenter);
      map.off("moveend", resolveCurrentCenter);
      map.remove();
      mapRef.current = null;
    };
  }, [resolveMapCenter, router]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location access is not supported on this device.");
      return;
    }

    setError("");
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          essential: true,
        });

        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError(
          "Location permission was denied. Move the map manually to select your location.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    );
  };

  const confirmLocation = async () => {
    if (!selectedLocation || isResolving) {
      return;
    }

    setError("");
    setIsConfirming(true);

    try {
      const result = await resolveServiceabilityByPincode(
        selectedLocation.pincode,
      );

     if (!result.serviceable || !result.storeId) {
  window.sessionStorage.setItem(
    "bootkit_unserviceable_location_v1",
    JSON.stringify(selectedLocation),
  );

  router.replace("/unserviceable-area");
  return;
}

      const deliveryArea: DeliveryArea = {
        id: result.storeId,
        city: selectedLocation.city,
        area: selectedLocation.area,
        pincode: selectedLocation.pincode,
        deliveryMinutes: `${
          result.estimatedDeliveryMinutes ?? 10
        } min`,
        deliveryFee: result.deliveryFee ?? 0,
        minimumOrder: result.minimumOrderAmountOverride ?? 0,
        active: true,
      };

      selectLocation(deliveryArea);
      setResolvedStoreId?.(result.storeId);

      window.localStorage.setItem(
        "bootkit_selected_coordinates_v1",
        JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
          updatedAt: new Date().toISOString(),
        }),
      );

     window.sessionStorage.removeItem(PENDING_LOCATION_KEY);
window.sessionStorage.removeItem(
  "bootkit_unserviceable_location_v1",
);

router.replace("/");
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "Unable to check delivery availability.",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white">
      <header className="grid h-[64px] shrink-0 grid-cols-[48px_1fr_48px] items-center border-b border-[#EEF2EF] px-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-center text-base font-bold">
          Select delivery location
        </h1>

        <span />
      </header>

      <section className="relative min-h-0 flex-1">
        <div ref={mapContainerRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <MapPin
            size={44}
            fill="#166534"
            className="text-[#166534]"
          />
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={isLocating}
          className="absolute bottom-5 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-lg disabled:opacity-60"
          aria-label="Use current location"
        >
          {isLocating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Crosshair size={21} />
          )}
        </button>
      </section>

      <section className="safe-bottom shrink-0 rounded-t-[24px] border-t border-[#EEF2EF] bg-white px-5 pb-6 pt-5 shadow-[0_-12px_35px_rgba(0,0,0,0.10)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF7EF] text-[var(--primary)]">
            <MapPin size={19} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--text-muted)]">
              Your delivery location
            </p>

            {isResolving ? (
              <p className="mt-1 text-sm font-bold">
                Identifying location...
              </p>
            ) : selectedLocation ? (
              <>
                <p className="mt-1 text-base font-black">
                  {selectedLocation.area}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {selectedLocation.address}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--primary)]">
                  Pincode: {selectedLocation.pincode}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm font-bold">
                Move the map to choose your location
              </p>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-xs font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={confirmLocation}
          disabled={
            !selectedLocation ||
            isResolving ||
            isConfirming
          }
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConfirming ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Checking availability...
            </>
          ) : (
            "Confirm delivery location"
          )}
        </button>
      </section>
    </main>
  );
}