"use client";

import { LayoutGrid } from "lucide-react";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { ReactNode, useState } from "react";

export default function HomeCategories() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    activeCategories: categories,
    hydrated,
  } = useAdminCategories();

  if (!hydrated) return null;

  return (
    <div className="sticky top-[72px] z-30 -mx-4 bg-[#F8FAF8] px-4 pt-2 pb-3">

  {/* Left Fade */}
  <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-[#F8FAF8] to-transparent" />

  {/* Right Fade */}
  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-[#F8FAF8] to-transparent" />

  <div className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide">
    

        <CategoryChip
          active={selectedCategory === "all"}
          icon={<LayoutGrid size={20} />}
          label="All"
          onClick={() => setSelectedCategory("all")}
        />

        {categories.map((category) => (

          <CategoryChip
            key={category.id}
            active={selectedCategory === category.slug}
            icon={
              <span className="text-xl">
                {category.icon}
              </span>
            }
            label={category.name}
            onClick={() =>
              setSelectedCategory(category.slug)
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
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[78px] shrink-0 flex-col items-center gap-1.5 rounded-[18px] px-1 py-2 transition ${
        active
          ? "bg-[var(--primary)] text-white shadow-lg scale-105"
          : "bg-white hover:bg-[#f3f8f4]"
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          active
            ? "bg-white/15"
            : "bg-[var(--surface-soft)]"
        }`}
      >
        {icon}
      </span>

      <span className="line-clamp-1 text-[10px] font-black">
        {label}
      </span>
    </button>
  );
}