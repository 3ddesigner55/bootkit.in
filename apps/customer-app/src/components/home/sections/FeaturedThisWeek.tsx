"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getHome } from "@/services/home.service";
import type { CustomerHeroBanner } from "@/services/customerApi.types";

interface FeaturedThisWeekProps {
  banners?: CustomerHeroBanner[];
  title?: string;
}

export default function FeaturedThisWeek({
  banners: initialBanners,
  title = "Featured This Week",
}: FeaturedThisWeekProps = {}) {
  const isDynamicMode = initialBanners !== undefined;
  const [banners, setBanners] = useState<CustomerHeroBanner[]>(initialBanners || []);
  const [loading, setLoading] = useState(!isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setBanners(initialBanners || []);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getHome()
      .then((data) => {
        if (!cancelled && data.featuredThisWeek) {
          setBanners(data.featuredThisWeek);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanners([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialBanners, isDynamicMode]);

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {banners.map((banner) => (
          <Link key={banner.id} href={banner.buttonLink || "/products"}>
            <img
              src={banner.mobileImage || banner.desktopImage}
              alt={banner.title}
              className="h-44 w-36 flex-shrink-0 rounded-2xl object-cover"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}