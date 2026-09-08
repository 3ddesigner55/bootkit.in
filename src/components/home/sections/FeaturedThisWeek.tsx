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

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {banners.map((banner, index) => {
          const fallbackImg = `/images/banners/banner${(index % 3) + 1}.png`;
          const imgSrc = banner.mobileImage || banner.desktopImage || fallbackImg;

          return (
            <Link
              key={banner.id || `featured-banner-${index}`}
              href={banner.buttonLink || "/products"}
              className="group relative flex-shrink-0 block w-72 sm:w-80 md:w-96 h-40 sm:h-44 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 snap-start bg-gray-100 border border-gray-100"
            >
              <img
                src={imgSrc}
                alt={banner.title || "Featured Banner"}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== fallbackImg && !target.src.endsWith(fallbackImg)) {
                    target.src = fallbackImg;
                  } else {
                    target.src = "/images/banners/placeholder.png";
                  }
                }}
                className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}