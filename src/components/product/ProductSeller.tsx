"use client";

import {
  BadgeCheck,
  ChevronRight,
  Store,
  Star,
} from "lucide-react";

export default function ProductSeller() {
  return (
    <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white">

      <div className="border-b border-[var(--border)] px-5 py-4">
        <h3 className="text-sm font-black">
          Sold By
        </h3>
      </div>

      <div className="space-y-5 p-5">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
              <Store size={22} />
            </span>

            <div>
              <p className="font-black">
                BootKiT Fresh Store
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Star
                  size={13}
                  fill="currentColor"
                  className="text-yellow-500"
                />
                4.8 Seller Rating
              </div>
            </div>

          </div>

          <ChevronRight
            size={18}
            className="text-[var(--text-muted)]"
          />

        </div>

        <div className="grid gap-3 sm:grid-cols-2">

          <SellerPoint text="100% Original Products" />

          <SellerPoint text="GST Invoice Available" />

          <SellerPoint text="Fast Local Delivery" />

          <SellerPoint text="Trusted Seller" />

        </div>

      </div>

    </section>
  );
}

function SellerPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] p-3">

      <BadgeCheck
        size={16}
        className="text-green-600"
      />

      <span className="text-xs font-bold">
        {text}
      </span>

    </div>
  );
}
