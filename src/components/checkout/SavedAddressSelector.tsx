"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Home,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import type { SavedAddress } from "@/types/address";

type SavedAddressSelectorProps = {
  addresses: SavedAddress[];
  selectedAddressId: string;
  onSelect: (address: SavedAddress) => void;
};

export default function SavedAddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
}: SavedAddressSelectorProps) {

const [sheetOpen, setSheetOpen] = useState(false);

const selectedAddress =
  addresses.find(
    (address) => address.id === selectedAddressId
  ) ??
  addresses.find((address) => address.isDefault) ??
  addresses[0] ??
  null;
  
useEffect(() => {
  if (!sheetOpen) {
    document.body.style.overflow = "";
    return;
  }

  document.body.style.overflow = "hidden";

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setSheetOpen(false);
    }
  };

  window.addEventListener("keydown", closeOnEscape);

  return () => {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", closeOnEscape);
  };
}, [sheetOpen]);

  if (addresses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--primary)]">
            <MapPin size={19} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[var(--text-primary)]">
              No saved address
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
              Enter the delivery details below or save an address for faster
              checkout next time.
            </p>

            <Link
              href="/account/addresses"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-[11px] font-black text-white"
            >
              <Plus size={14} />
              Add saved address
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
  <>
  <div>
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-black text-[var(--text-primary)]">
          Delivery address
        </p>

        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          Your order will be delivered here
        </p>
      </div>

      <Link
        href="/account/addresses"
        className="shrink-0 text-[11px] font-black text-[var(--primary)]"
      >
        Manage
      </Link>
    </div>

    {selectedAddress && (
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full items-start gap-3 rounded-2xl border border-[var(--primary)] bg-[var(--primary-light)] p-4 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
          {selectedAddress.addressType === "Home" ? (
            <Home size={19} />
          ) : selectedAddress.addressType === "Office" ? (
            <Building2 size={19} />
          ) : (
            <MapPin size={19} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-black text-[var(--text-primary)]">
              {selectedAddress.addressType}
            </span>

            {selectedAddress.isDefault && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-[var(--primary)]">
                Default
              </span>
            )}
          </span>

          <span className="mt-1 block text-xs font-black text-[var(--text-primary)]">
            {selectedAddress.fullName}
          </span>

          <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-[var(--text-secondary)]">
            {selectedAddress.houseNumber}, {selectedAddress.street},{" "}
            {selectedAddress.area}
            {selectedAddress.landmark
              ? `, ${selectedAddress.landmark}`
              : ""}
            , {selectedAddress.city}, {selectedAddress.state} -{" "}
            {selectedAddress.pincode}
          </span>

          <span className="mt-2 block text-[10px] font-bold text-[var(--text-primary)]">
            +91 {selectedAddress.phone}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1 pt-1 text-[10px] font-black text-[var(--primary)]">
          Change
          <ChevronRight size={14} />
        </span>
      </button>
    )}
  </div>
  
{sheetOpen && (
  <>
    <div
      onClick={() => setSheetOpen(false)}
      className="fixed inset-0 z-40 bg-black/40"
    />

    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h3 className="text-lg font-black">
          Select delivery address
        </h3>

        <button
          type="button"
          onClick={() => setSheetOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-soft)]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
        {addresses.map((address) => {
          const active =
            address.id === selectedAddressId;

          return (
            <button
              key={address.id}
              type="button"
              onClick={() => {
                onSelect(address);
                setSheetOpen(false);
              }}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-light)]"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">
                  {address.fullName}
                </p>

                {active && (
                  <CheckCircle2
                    size={18}
                    className="text-[var(--primary)]"
                  />
                )}
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                {address.houseNumber}, {address.street},{" "}
                {address.area}, {address.city}
              </p>

              <p className="mt-2 text-[10px] font-bold text-[var(--primary)]">
                {address.addressType}
                {address.isDefault
                  ? " • Default"
                  : ""}
              </p>
            </button>
          );
        })}

        <Link
          href="/account/addresses"
          className="mt-2 flex h-12 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm font-black text-[var(--primary)]"
        >
          <Plus size={16} className="mr-2" />
          Add New Address
        </Link>
      </div>
    </div>
  </>
)}
  </>
);
}
