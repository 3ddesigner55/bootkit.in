"use client";

import { Crosshair, MapPin, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  reverseGeocodeMapboxLocation,
  searchMapboxLocations,
  type MapboxLocationSuggestion,
} from "@/services/mapbox.service";

type LocationBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (location: MapboxLocationSuggestion) => void;
};

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  );
}

export default function LocationBottomSheet({
  open,
  onClose,
  onSelect,
}: LocationBottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(true);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxLocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const showLocationError = (message: string) => {
    window.alert(message);
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      });
    });

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showLocationError("Location services are not available on this device.");
      return;
    }

    try {
      const position = await getCurrentPosition();
      const controller = new AbortController();
      const location = await reverseGeocodeMapboxLocation(
        position.coords.latitude,
        position.coords.longitude,
        controller.signal
      );

      if (!location) {
        showLocationError("We could not find an address for your location.");
        return;
      }

      onSelect(location);
      onClose();
    } catch (error: unknown) {
      if (isGeolocationError(error)) {
        if (error.code === 1) {
          showLocationError("Location permission was denied.");
          return;
        }

        if (error.code === 3) {
          showLocationError("Location request timed out. Please try again.");
          return;
        }

        showLocationError("Your current location is unavailable.");
        return;
      }

      showLocationError("We could not find an address for your location.");
    }
  };

  useEffect(() => {
    if (open) {
      setMounted(true);

      const animationFrame = window.requestAnimationFrame(() => {
        setClosing(false);
      });
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.cancelAnimationFrame(animationFrame);
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!mounted) {
      return;
    }

    setClosing(true);
    const closeTimer = window.setTimeout(() => setMounted(false), 300);

    return () => window.clearTimeout(closeTimer);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSuggestions([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    const searchQuery = query.trim();

    if (searchQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    const searchTimer = window.setTimeout(() => {
      setIsSearching(true);
      setHasSearched(false);

      void searchMapboxLocations(searchQuery, controller.signal)
        .then((nextSuggestions) => {
          if (!controller.signal.aborted) {
            setSuggestions(nextSuggestions);
            setHasSearched(true);
          }
        })
        .catch((error: unknown) => {
          if (
            !controller.signal.aborted &&
            !(error instanceof DOMException && error.name === "AbortError")
          ) {
            setSuggestions([]);
            setHasSearched(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, 400);

    return () => {
      window.clearTimeout(searchTimer);
      controller.abort();
    };
  }, [query]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-bottom-sheet-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <section
        className={`safe-bottom flex h-[78vh] w-full max-w-md flex-col rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.20)] transition-transform duration-300 ${
          closing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#DCE6DF]" />

        <div className="flex items-center border-b border-[#EEF2EF] px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location selector"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-primary)] transition hover:bg-[#F5F8F5]"
          >
            <X size={20} />
          </button>

          <h2
            id="location-bottom-sheet-title"
            className="flex-1 pr-10 text-center text-base font-black text-[var(--text-primary)]"
          >
            Choose Delivery Location
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-[#E5ECE6] bg-[#F8FAF8] px-4">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for area, street or apartment"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
            />
          </label>

          {query.trim().length >= 3 ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#E5ECE6] bg-white">
              {isSearching ? (
                <p className="px-4 py-3 text-sm font-medium text-[var(--text-muted)]">
                  Searching locations...
                </p>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => {
                      onSelect(suggestion);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 border-b border-[#EEF2EF] px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F8F5]"
                  >
                    <MapPin
                      size={18}
                      className="shrink-0 text-[var(--primary)]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[var(--text-primary)]">
                        {suggestion.label}
                      </span>
                      {suggestion.description ? (
                        <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                          {suggestion.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))
              ) : hasSearched ? (
                <p className="px-4 py-3 text-sm font-medium text-[var(--text-muted)]">
                  No locations found
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#E5ECE6] bg-white px-4 py-3 text-left transition hover:bg-[#F5F8F5]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF8EF] text-[var(--primary)]">
              <Crosshair size={19} />
            </span>
            <span className="text-sm font-black text-[var(--primary)]">
              Use Current Location
            </span>
          </button>

          <LocationEmptyState title="Saved Addresses" message="No saved addresses" />
          <LocationEmptyState title="Recent Locations" message="No recent locations" />

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--primary)] px-4 py-3 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--primary-light)]"
          >
            <Plus size={18} />
            Add New Address
          </button>
        </div>
      </section>
    </div>
  );
}

function LocationEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="mt-7">
      <h3 className="text-sm font-black text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#F8FAF8] px-4 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--text-muted)] shadow-sm">
          <MapPin size={18} />
        </span>
        <p className="text-sm font-medium text-[var(--text-muted)]">{message}</p>
      </div>
    </section>
  );
}
