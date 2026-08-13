"use client";

import Image from "next/image";
import Link from "next/link";

export interface SpotlightStore {
  name: string;
  description?: string;
  image?: string;
  delivery?: string;
  href: string;
}

const DEFAULT_STORES: SpotlightStore[] = [
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

interface StoreSpotlightProps {
  stores?: SpotlightStore[];
  title?: string;
}

export default function StoreSpotlight({
  stores: initialStores,
  title = "Store Spotlight",
}: StoreSpotlightProps = {}) {
  const isDynamicMode = initialStores !== undefined;

  if (isDynamicMode && (!initialStores || initialStores.length === 0)) {
    return null;
  }

  const activeStores = isDynamicMode ? initialStores : DEFAULT_STORES;

  if (!activeStores || activeStores.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">⭐ {title}</h2>

        <Link
          href="/categories"
          className="text-sm font-semibold text-[var(--primary)]"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {activeStores.map((store) => (
          <Link
            key={store.name}
            href={store.href}
            className="flex items-center gap-4 rounded-2xl border border-[#EDF1EE] bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F5F8F5]">
              <Image
                src={store.image || "/images/stores/fresh-mart.png"}
                alt={store.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-bold">{store.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {store.description || store.delivery || "Fast local fulfillment"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
