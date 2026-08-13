"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getHomeCategorySection,
  type HomeCategoryItem,
} from "@/services/home.service";
import { resolveSafeInternalUrl } from "@/utils/navigationWhitelist";

interface GroceryKitchenProps {
  items?: HomeCategoryItem[];
  title?: string;
  viewAllUrl?: string;
}


export default function GroceryKitchen({
  items: initialItems,
  title = "Grocery & Kitchen",
  viewAllUrl,
}: GroceryKitchenProps = {}) {
  const isDynamicMode = initialItems !== undefined;
  const [groceryItems, setGroceryItems] = useState<HomeCategoryItem[]>(initialItems || []);
  const [hydrated, setHydrated] = useState(isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setGroceryItems(initialItems || []);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void getHomeCategorySection("groceryKitchen")
      .then((items) => {
        if (!cancelled) {
          setGroceryItems(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroceryItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialItems, isDynamicMode]);

  if (!hydrated || groceryItems.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>


        {viewAllUrl ? (
          <Link
            href={viewAllUrl}
            className="text-sm font-semibold text-[var(--primary)]"
          >
            View All
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        {groceryItems.slice(0, 8).map((item) => {
          const isValidImage =
            typeof item.image === "string" &&
            (item.image.startsWith("/") ||
              item.image.startsWith("http://") ||
              item.image.startsWith("https://"));

          const href = resolveSafeInternalUrl("category", item.slug);
          if (!href) {
            console.warn("[CustomerHome] Category card is missing a safe slug.", item);
            return null;
          }

          return (
            <Link
              key={item.slug}
              href={href}
              className="flex min-w-0 flex-col items-center"
            >
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-[#F5F8F5]">
                {isValidImage ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>

              <p className="mt-2 min-h-[32px] line-clamp-2 w-full text-center text-[11px] font-semibold leading-4">
                {item.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
