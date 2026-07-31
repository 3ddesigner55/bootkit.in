"use client";

import {
  BadgeCheck,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";

const items = [
  {
    icon: BadgeCheck,
    title: "Premium Quality",
    description:
      "Carefully selected quality products.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Delivered in minutes from nearby store.",
  },
  {
    icon: ShieldCheck,
    title: "Safe Packaging",
    description:
      "Packed hygienically before dispatch.",
  },
  {
    icon: Leaf,
    title: "Fresh Stock",
    description:
      "Daily replenished inventory.",
  },
];

export default function ProductHighlights() {
  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">

      <h2 className="text-xl font-black">
        Product Highlights
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-sm">
                <Icon size={22} />
              </span>

              <div>
                <h3 className="font-black">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}

      </div>

    </section>
  );
}