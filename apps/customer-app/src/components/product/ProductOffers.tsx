"use client";

import {
  BadgePercent,
  CreditCard,
  Gift,
  ChevronRight,
} from "lucide-react";

export default function ProductOffers() {
  const offers = [
    {
      icon: BadgePercent,
      title: "Flat ₹100 OFF",
      subtitle: "On orders above ₹999",
    },
    {
      icon: CreditCard,
      title: "10% Bank Discount",
      subtitle: "HDFC, ICICI & SBI Cards",
    },
    {
      icon: Gift,
      title: "Free Delivery",
      subtitle: "On eligible orders",
    },
  ];

  return (
    <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h3 className="text-sm font-black">
          Available Offers
        </h3>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {offers.map((offer, index) => {
          const Icon = offer.icon;

          return (
            <div
              key={index}
              className="flex items-center gap-3 px-5 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                <Icon size={18} />
              </span>

              <div className="flex-1">
                <p className="text-sm font-black">
                  {offer.title}
                </p>

                <p className="text-xs text-[var(--text-secondary)]">
                  {offer.subtitle}
                </p>
              </div>

              <ChevronRight
                size={16}
                className="text-[var(--text-muted)]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}