"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const stores = [
  {
    name: "Fresh Mart",
    description: "Fresh fruits, vegetables & daily essentials",
    image: "/images/stores/fresh-mart.png",
    delivery: "10-15 min",
    href: "/category/fresh-mart",
  },
  {
    name: "Kitchen World",
    description: "Kitchen tools & home essentials",
    image: "/images/stores/kitchen-world.png",
    delivery: "15-20 min",
    href: "/category/kitchen-world",
  },
];

export default function StoreSpotlight() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">
          ⭐ Store Spotlight
        </h2>

        <Link
          href="/stores"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {stores.map((store) => (
          <Link
            key={store.name}
            href={store.href}
            className="flex items-center gap-4 rounded-2xl border border-[#EDF1EE] bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F5F8F5]">
              <Image
                src={store.image}
                alt={store.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-bold">
                {store.name}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {store.description}
              </p>

              <p className="mt-2 text-xs font-semibold text-[var(--primary)]">
                {store.delivery}
              </p>
            </div>

            <ArrowRight
              size={20}
              className="text-[var(--primary)]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}