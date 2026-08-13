"use client";

import Link from "next/link";
import { getCategories } from "@/services/category.service";
import type { CustomerCategory } from "@/services/customerApi.types";
import { ReactNode, useEffect, useState } from "react";

export default function HomeCategories({
  selected = "all",
  className = "",
}: {
  selected?: string;
  className?: string;
} = {}) {
  const [selectedCategory, setSelectedCategory] = useState(selected);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedCategory(selected);
  }, [selected]);
  const permanentCategories = [
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

  useEffect(() => {
    let cancelled = false;

    void getCategories()
      .then((nextCategories) => {
        if (!cancelled) {
          setCategories(nextCategories);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
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
  }, []);

  if (!hydrated) return null;

  return (
    <div
      className={`sticky top-[72px] z-30 -mx-4 bg-transparent px-4 pt-2 pb-3 backdrop-blur-md ${className}`}
    >
      {/* Left Fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      {/* Right Fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-transparent" />

      <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide">
        {permanentCategories.map((category) => (
          <CategoryChip
            key={category.slug}
            active={selectedCategory === category.slug}
            icon={
              <img
                src={category.icon}
                alt=""
                className="h-7 w-7 object-contain"
              />
            }
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

function CategoryChip({
  active,
  icon,
  label,
  href,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
          active ? "bg-[var(--primary)] text-white" : "bg-transparent"
        }`}
      >
        {icon}
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
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
