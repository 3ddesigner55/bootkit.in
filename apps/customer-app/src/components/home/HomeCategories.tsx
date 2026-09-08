"use client";

import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  getHeaderNavigation,
  type HeaderNavigationItem,
} from "@/services/headerNavigation.service";

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
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
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

const DEFAULT_HEADER_COLLECTIONS: HeaderNavigationItem[] = [
  {
    slug: "all",
    label: "All",
    icon: "/icons/categories/all.svg",
    active: true,
    sortOrder: 0,
  },
  {
    slug: "beauty",
    label: "Beauty",
    icon: "/icons/categories/Beauty.svg",
    active: true,
    sortOrder: 1,
  },
  {
    slug: "electronics",
    label: "Electronics",
    icon: "/icons/categories/electronics.svg",
    active: true,
    sortOrder: 2,
  },
  {
    slug: "pharmacy",
    label: "Pharmacy",
    icon: "/icons/categories/pharmacy.svg",
    active: true,
    sortOrder: 3,
  },
  {
    slug: "decor",
    label: "Decor",
    icon: "/icons/categories/decor.svg",
    active: true,
    sortOrder: 4,
  },
  {
    slug: "kids",
    label: "Kids",
    icon: "/icons/categories/kids.svg",
    active: true,
    sortOrder: 5,
  },
  {
    slug: "gifting",
    label: "Gifting",
    icon: "/icons/categories/gifting.svg",
    active: true,
    sortOrder: 6,
  },
];

export default function HomeCategories({
  selected = "all",
  className = "",
}: {
  selected?: string;
  className?: string;
} = {}) {
  const [selectedCategory, setSelectedCategory] = useState(selected);
  const [headerItems, setHeaderItems] = useState<HeaderNavigationItem[]>(DEFAULT_HEADER_COLLECTIONS);

  useEffect(() => {
    setSelectedCategory(selected);
  }, [selected]);

  useEffect(() => {
    let cancelled = false;

    void getHeaderNavigation()
      .then((items) => {
        if (!cancelled && Array.isArray(items) && items.length > 0) {
          const hasAll = items.some((i) => i.slug === "all");
          const merged = hasAll
            ? items
            : [
                {
                  slug: "all",
                  label: "All",
                  icon: "/icons/categories/all.svg",
                  active: true,
                  sortOrder: 0,
                },
                ...items,
              ];
          setHeaderItems(merged);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeaderItems(DEFAULT_HEADER_COLLECTIONS);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCollections = useMemo(
    () =>
      headerItems
        .filter((item) => item.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [headerItems],
  );

  return (
    <div
      className={`sticky top-[72px] z-30 -mx-4 bg-transparent px-4 pt-2 pb-3 backdrop-blur-md ${className}`}
    >
      {/* Left Fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      {/* Right Fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide">
        {visibleCollections.map((category) => (
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
