"use client";

import Image from "next/image";


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
      {categories.map((category) => {
        const active = selected === category.slug;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.slug)}
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
              {category.image ? (
                <Image
                  src={category.image}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              ) : category.icon ? (
                category.icon
              ) : (
                <span className="sr-only">Category image unavailable</span>
              )}
            </div>

            <span
              className={`text-center text-[11px] font-bold leading-4 ${
                active ? "text-[var(--primary)]" : "text-gray-600"
              }`}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
