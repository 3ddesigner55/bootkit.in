"use client";

import {
  BadgePercent,
  ChevronDown,
  ChevronUp,
  TicketPercent,
} from "lucide-react";
import { useState } from "react";
import { getActiveCoupons } from "@/data/coupons";
import { useCoupon } from "@/hooks/useCoupon";

type CouponSelectorProps = {
  subtotal: number;
  hasPreviousOrders?: boolean;
};

export default function CouponSelector({
  subtotal,
  hasPreviousOrders = false,
}: CouponSelectorProps) {
  const { appliedCoupon, applyCoupon } = useCoupon();

  const [showOffers, setShowOffers] = useState(false);
  const [message, setMessage] = useState("");

  const availableCoupons = getActiveCoupons();

  const selectOffer = (couponCode: string) => {
  const result = applyCoupon(
    couponCode,
    subtotal,
    hasPreviousOrders
  );

  if (result.success) {
    setMessage("");
    return;
  }

  setMessage(result.message);
};

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <button
        type="button"
        onClick={() => {
          setShowOffers((current) => !current);
          setMessage("");
        }}
        className="flex h-14 w-full items-center gap-3 px-4 text-left transition hover:bg-[var(--surface-soft)]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
          <TicketPercent size={17} />
        </span>

       <span className="flex-1">
  <span className="block text-sm font-black text-[var(--text-primary)]">
    Offers
  </span>
  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
  Tap any offer to apply instantly.
</p>

  <span className="block text-[10px] text-[var(--text-muted)]">
    Save more on this order
  </span>
</span>

        {showOffers ? (
          <ChevronUp
            size={17}
            className="text-[var(--text-muted)]"
          />
        ) : (
          <ChevronDown
            size={17}
            className="text-[var(--text-muted)]"
          />
        )}
      </button>

      {showOffers && (
        <div className="space-y-3 border-t border-[var(--border)] p-3">
          {message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-[var(--danger)]">
              {message}
            </p>
          )}

          {availableCoupons.map((coupon) => {
            const isApplied =
              appliedCoupon?.coupon.code === coupon.code;

            return (
              
                <div
  key={coupon.id}
  className={`rounded-2xl border transition ${
    isApplied
      ? "border-green-500 bg-green-50"
      : "border-[var(--border)] bg-white"
  }`}
>
  <div className="flex items-start gap-3 p-4">

    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        isApplied
          ? "bg-green-600 text-white"
          : "bg-[var(--primary-light)] text-[var(--primary)]"
      }`}
    >
      <BadgePercent size={18} />
    </div>

    <div className="min-w-0 flex-1">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-sm font-black">
            {coupon.code}
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {coupon.description}
          </p>

        </div>

        <button
          type="button"
          disabled={isApplied}
          onClick={() => selectOffer(coupon.code)}
          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
            isApplied
              ? "bg-green-600 text-white"
              : "border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)]"
          }`}
        >
          {isApplied ? "Applied ✓" : "Apply"}
        </button>

      </div>

    </div>

  </div>
</div>
            );
          })}
        </div>
      )}
    </section>
  );
}