"use client";

import { useAdminCategories } from "@/hooks/useAdminCategories";

interface CategorySidebarProps {
  selected: string;
  onSelect: (slug: string) => void;
}

export default function CategorySidebar({
  selected,
  onSelect,
}: CategorySidebarProps) {
  const {
    activeCategories,
    hydrated,
  } = useAdminCategories();

  if (!hydrated) {
    return null;
  }

  return (
    <aside className="h-full overflow-y-auto bg-[#F5F7F5] border-r border-[#E8ECE8]">

      {activeCategories.map((category) => {
        const active = selected === category.slug;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.slug)}
            className={`relative flex w-full flex-col items-center border-b border-[#ECEFEC] px-2 py-4 transition ${
              active
                ? "bg-white"
                : "bg-[#F5F7F5]"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[var(--primary)]" />
            )}

            <div
              className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                active
                  ? "bg-[#E9F8EE]"
                  : "bg-white"
              }`}
            >
              {category.icon}
            </div>

            <span
              className={`text-center text-[11px] font-bold leading-4 ${
                active
                  ? "text-[var(--primary)]"
                  : "text-gray-600"
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