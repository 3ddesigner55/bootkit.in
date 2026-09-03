"use client";

import type { FilterId, FilterSection, SelectedFilters } from "./filterData";

type FilterSidebarProps = {
  sections: FilterSection[];
  activeFilterId: FilterId;
  selectedFilters: SelectedFilters;
  onSelect: (filterId: FilterId) => void;
};

export default function FilterSidebar({
  sections,
  activeFilterId,
  selectedFilters,
  onSelect,
}: FilterSidebarProps) {
  return (
    <aside className="w-[112px] shrink-0 overflow-y-auto border-r border-[#EDF1EE] bg-[#F8FAF8]">
      <p className="px-4 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
        Type
      </p>
      <div className="pb-4">
        {sections.map((section) => {
          const isActive = section.id === activeFilterId;
          const selectedCount = selectedFilters[section.id]?.length ?? 0;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`relative flex w-full flex-col gap-0.5 px-4 py-3 text-left text-xs font-bold transition ${
                isActive
                  ? "bg-white text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[#F2F6F3]"
              }`}
            >
              {isActive ? (
                <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-[var(--primary)]" />
              ) : null}
              <span>{section.label}</span>
              {selectedCount > 0 ? (
                <span className="text-[10px] font-black text-[var(--primary)]">
                  {selectedCount} selected
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
