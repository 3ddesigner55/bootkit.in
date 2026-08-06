"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const banners = [
  {
    title: "Fresh groceries,\ndelivered beautifully.",
    subtitle: "Premium groceries delivered in just 10–20 minutes.",
    image: "/images/banners/banner1.png",
  },
  {
    title: "Farm Fresh\nEvery Morning.",
    subtitle: "Fresh fruits & vegetables directly from local farms.",
    image: "/images/banners/banner2.png",
  },
  {
    title: "Everything You Need.\nOne Tap Away.",
    subtitle: "Milk, snacks, drinks and daily essentials.",
    image: "/images/banners/banner3.png",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const banner = banners[current];

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

            <p className="mt-3 text-sm text-white/80">
              {banner.subtitle}
            </p>

            <Link
              href="/products"
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
              priority
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 ${
              current === index
                ? "h-2 w-8 rounded-full bg-[var(--primary)]"
                : "h-2 w-2 rounded-full bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
