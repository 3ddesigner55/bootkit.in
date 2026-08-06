"use client";

import { ChevronDown } from "lucide-react";

const filters = [
  "Filters",
  "Sort",
  "Type",
  "Brand",
  "Price",
  "placemant",
];

export default function CategoryFilters() {
  return (
    <div className="border-b border-[#ECEFEC] bg-white">
      <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">

        {filters.map((item) => (

          <button
            key={item}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-[#E6EAE7] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--primary)]"
          >

            <span>{item}</span>

            <ChevronDown size={15} />

          </button>

        ))}

      </div>
    </div>
  );
}