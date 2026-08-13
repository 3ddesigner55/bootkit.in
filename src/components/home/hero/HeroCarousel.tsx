"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getHeroBanners } from "@/services/hero.service";
import type { CustomerHeroBanner } from "@/services/customerApi.types";

export type CarouselBanner = Pick<CustomerHeroBanner, "title" | "subtitle"> & {
  image: string;
  linkUrl?: string;
};

function toCarouselBanner(banner: CustomerHeroBanner): CarouselBanner {
  return {
    title: banner.title,
    subtitle: banner.subtitle || "",
    image: banner.desktopImage || banner.mobileImage || "/images/banners/placeholder.png",
    linkUrl: banner.buttonLink || "/products",
  };
}

interface HeroCarouselProps {
  banners?: CarouselBanner[];
}

export default function HeroCarousel({ banners: initialBanners }: HeroCarouselProps = {}) {
  const isDynamicMode = initialBanners !== undefined;
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<CarouselBanner[]>(initialBanners || []);

  useEffect(() => {
    if (isDynamicMode) {
      setBanners(initialBanners || []);
      return;
    }

    let cancelled = false;

    void getHeroBanners()
      .then((nextBanners) => {
        if (!cancelled) {
          setBanners(nextBanners.map(toCarouselBanner));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanners([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialBanners, isDynamicMode]);

  useEffect(() => {
    if (banners.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  const banner = banners[current] || banners[0];
  if (!banner) return null;

  return (
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0F5D2F] via-[#16783E] to-[#22A559] p-6 text-white shadow-[0_18px_50px_rgba(18,90,52,.22)]">
        {/* Glow */}
        <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

        <div className="grid grid-cols-[1fr_150px] items-center gap-3">
          {/* Left Content */}
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur">
              BootKiT Premium
            </span>

            <h2 className="mt-4 whitespace-pre-line text-[32px] font-black leading-tight">
              {banner.title}
            </h2>

            {banner.subtitle ? (
              <p className="mt-3 text-sm text-white/80">
                {banner.subtitle}
              </p>
            ) : null}

            <Link
              href={banner.linkUrl || "/products"}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-[#166534] transition hover:scale-105"
            >
              Shop Now
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Right Image */}
          <div className="relative flex h-[220px] items-end justify-center">
            <Image
              src={banner.image}
              alt={banner.title}
              width={210}
              height={210}
              className="h-full w-full object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,.35)]"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
