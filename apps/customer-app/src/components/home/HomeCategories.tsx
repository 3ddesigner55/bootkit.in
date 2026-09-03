"use client";

import Link from "next/link";
import React, { memo, useEffect, useState } from "react";

export interface CategoryTabItem {
  slug: string;
  label: string;
  icon: string;
}

const PERMANENT_CATEGORIES: CategoryTabItem[] = [
  {
    slug: "all",
    label: "All",
    icon: "/icons/categories/all.svg",
  },
  {
    slug: "beauty",
    label: "Beauty",
    icon: "/icons/categories/Beauty.svg",
  },
  {
    slug: "electronics",
    label: "Electronics",
    icon: "/icons/categories/electronics.svg",
  },
  {
    slug: "pharmacy",
    label: "Pharmacy",
    icon: "/icons/categories/pharmacy.svg",
  },
  {
    slug: "decor",
    label: "Decor",
    icon: "/icons/categories/decor.svg",
  },
  {
    slug: "kids",
    label: "Kids",
    icon: "/icons/categories/kids.svg",
  },
  {
    slug: "gifting",
    label: "Gifting",
    icon: "/icons/categories/gifting.svg",
  },
];

interface CategoryChipProps {
  active: boolean;
  iconSrc: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

const CategoryChip = memo(function CategoryChip({
  active,
  iconSrc,
  label,
  href,
  onClick,
}: CategoryChipProps) {
  const content = (
    <>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
          active ? "bg-[var(--primary)] text-white" : "bg-transparent"
        }`}
      >
        <img
          src={iconSrc}
          alt=""
          loading="eager"
          decoding="async"
          className="h-7 w-7 object-contain"
        />
      </span>

      <span className="line-clamp-1 text-[11px] font-semibold">{label}</span>
    </>
  );

  const className = `flex w-[68px] shrink-0 flex-col items-center gap-1 transition ${
    active ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
});

export default function HomeCategories({
  selected = "all",
  className = "",
}: {
  selected?: string;
  className?: string;
} = {}) {
  const [selectedCategory, setSelectedCategory] = useState(selected);

  useEffect(() => {
    setSelectedCategory(selected);
  }, [selected]);

  return (
    <div
      className={`sticky top-[72px] z-30 -mx-4 bg-transparent px-4 pt-2 pb-3 backdrop-blur-md ${className}`}
    >
      {/* Left Fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      {/* Right Fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide">
        {PERMANENT_CATEGORIES.map((category) => (
          <CategoryChip
            key={category.slug}
            active={selectedCategory === category.slug}
            iconSrc={category.icon}
            label={category.label}
            href={
              category.slug === "all"
                ? selected === "all"
                  ? undefined
                  : "/"
                : `/category/${category.slug}`
            }
            onClick={
              category.slug === "all" && selected === "all"
                ? () => setSelectedCategory("all")
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
