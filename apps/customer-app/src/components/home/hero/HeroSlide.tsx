"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroSlideProps {
  title: string;
  subtitle: string;
  image: string;
}

export default function HeroSlide({
  title,
  subtitle,
  image,
}: HeroSlideProps) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0F5D2F] via-[#16783E] to-[#22A559] p-6 text-white shadow-[0_18px_50px_rgba(18,90,52,.22)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(18,90,52,.35)]">

      <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />

     <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-lime-300/20 blur-2xl" />

      <div className="grid grid-cols-[1fr_150px] items-center gap-3">

        <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFE9A8] px-3 py-1 text-[11px] font-bold text-[#7A5200]">

  ⚡ 30% OFF TODAY

</div>

          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur">
            BootKit Premium
          </span>

          <h2 className="mt-4 whitespace-pre-line text-[32px] font-black leading-tight">
            {title}
          </h2>

          <p className="mt-3 text-sm text-white/80">
            {subtitle}
          </p>

          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-[var(--primary)]">
            Shop Now
            <ArrowRight size={18} />
          </Link>

        </div>

        <div className="relative flex h-[220px] items-end justify-center">

          <Image
  src={image}
  alt={title}
  width={210}
  height={210}
  priority
  className="animate-float object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-all duration-700"
/>
<div className="absolute bottom-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--primary)] shadow-md">

  ⚡ Delivery in 10 mins

</div>
        </div>

      </div>

    </div>
  );
}