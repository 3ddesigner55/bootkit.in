"use client";

import React, { memo } from "react";
import Image from "next/image";

interface CategorySidebarItemProps {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  active: boolean;
  onSelect: (slug: string) => void;
}

const CategorySidebarItem = memo(function CategorySidebarItem({
  name,
  slug,
  icon,
  image,
  active,
  onSelect,
}: CategorySidebarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slug)}
      className={`relative flex w-full flex-col items-center border-b border-[#ECEFEC] px-2 py-4 transition ${
        active ? "bg-[#F5F7F5]" : "bg-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[var(--primary)]" />
      )}

      <div
        className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
          active ? "bg-[#E9F8EE]" : "bg-white"
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
        ) : icon ? (
          icon
        ) : (
          <span className="sr-only">Category image unavailable</span>
        )}
      </div>

      <span
        className={`text-center text-[11px] font-bold leading-4 ${
          active ? "text-[var(--primary)]" : "text-gray-600"
        }`}
      >
        {name}
      </span>
    </button>
  );
});

interface CategorySidebarProps {
  selected: string;
  onSelect: (slug: string) => void;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
  }>;
}

export default function CategorySidebar({
  selected,
  onSelect,
  categories = [],
}: CategorySidebarProps) {
  return (
    <aside className="h-full overflow-y-auto scrollbar-hide bg-white">
      {categories.map((category) => (
        <CategorySidebarItem
          key={category.id}
          id={category.id}
          name={category.name}
          slug={category.slug}
          icon={category.icon}
          image={category.image}
          active={selected === category.slug}
          onSelect={onSelect}
        />
      ))}
    </aside>
  );
}
