"use client";

import {
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAdminDeliveryAreas } from "@/hooks/useAdminDeliveryAreas";
import { useLocation } from "@/hooks/useLocation";

export default function LocationModal() {
  const {
    location,
    modalOpen,
    closeLocationModal,
    selectLocation,
  } = useLocation();

  const [query, setQuery] = useState("");
  const requiresSelection = !location;

  const {
  activeDeliveryAreas: areas,
  hydrated,
} = useAdminDeliveryAreas();


  const filteredAreas = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return areas;

    return areas.filter((area) =>
      [
        area.city,
        area.area,
        area.pincode,
      ].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [areas, query]);

  useEffect(() => {
    if (!modalOpen) {
      setQuery("");
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !requiresSelection) {
        closeLocationModal();
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, [modalOpen, closeLocationModal, requiresSelection]);

  if (!hydrated || !modalOpen) {
  return null;
}

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (!requiresSelection && event.target === event.currentTarget) {
          closeLocationModal();
        }
      }}
    >
      <section className="safe-bottom max-h-[88vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.20)] sm:max-w-lg sm:rounded-[28px]">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
              BootKiT delivery
            </p>

            <h2
              id="location-modal-title"
              className="mt-1 text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]"
            >
              Select your location
            </h2>

            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Delivery is currently available only in selected areas.
            </p>
          </div>

          {!requiresSelection && <button
            type="button"
            onClick={closeLocationModal}
            aria-label="Close location selector"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-secondary)]"
          >
            <X size={19} />
          </button>}
        </div>

        <div className="px-4 pt-4 sm:px-6">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-green-900/10">
            <Search
              size={18}
              className="shrink-0 text-[var(--text-muted)]"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search area or pincode"
              inputMode="search"
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear location search"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)]"
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-4 sm:px-6">
          {filteredAreas.length > 0 ? (
            <div className="space-y-2.5">
              {filteredAreas.map((area) => {
                const selected =
                  location?.pincode === area.pincode;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => selectLocation(area)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary-light)]"
                        : "border-[var(--border)] bg-white active:bg-[var(--surface-soft)]"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                        selected
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-soft)] text-[var(--primary)]"
                      }`}
                    >
                      <MapPin size={20} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-[var(--text-primary)]">
                        {area.area}
                      </span>

                      <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                        {area.city} · {area.pincode}
                      </span>

                      <span className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)]">
                        <Clock3 size={12} />
                        Delivery in {area.deliveryMinutes}
                      </span>
                    </span>

                    {selected && (
                      <CheckCircle2
                        size={20}
                        className="shrink-0 text-[var(--primary)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--surface-soft)] text-[var(--text-muted)]">
                <MapPin size={28} />
              </span>

              <h3 className="mt-4 text-base font-black text-[var(--text-primary)]">
                Area not serviceable
              </h3>

              <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
                BootKiT is not delivering to this area yet. Try another
                area or pincode.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-center text-[10px] font-semibold text-[var(--text-muted)] sm:px-6">
          More delivery areas will be added after local launch.
        </div>
      </section>
    </div>
  );
}
