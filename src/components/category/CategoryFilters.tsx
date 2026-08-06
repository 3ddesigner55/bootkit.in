"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import FilterModal from "./FilterModal";
import SortBottomSheet from "./SortBottomSheet";
import {
  FILTER_SECTIONS,
  SORT_OPTIONS,
  type FilterId,
  type SelectedFilters,
} from "./filterData";

type CategoryFiltersProps = {
  onApply?: (filters: SelectedFilters) => void;
  onFiltersChange?: (filters: SelectedFilters) => void;
  onSortChange?: (sort: string) => void;
};

function getFilterCount(filters: SelectedFilters) {
  return Object.values(filters).reduce(
    (count, values) => count + values.length,
    0
  );
}

export default function CategoryFilters({
  onApply,
  onFiltersChange,
  onSortChange,
}: CategoryFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<FilterId>("brand");
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [selectedSort, setSelectedSort] = useState<string>(SORT_OPTIONS[0]);

  const filterCount = getFilterCount(selectedFilters);

  const openFilterModal = (filterId: FilterId) => {
    setActiveFilterId(filterId);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (filters: SelectedFilters) => {
    onApply?.(filters);
  };

  const handleFilterChange = (
    filterId: FilterId,
    option: string
  ) => {
    const filter = FILTER_SECTIONS.find((item) => item.id === filterId);

    if (!filter) {
      return;
    }

    const currentOptions = selectedFilters[filterId] ?? [];
    const nextOptions =
      filter.mode === "single"
        ? [option]
        : currentOptions.includes(option)
          ? currentOptions.filter((item) => item !== option)
          : [...currentOptions, option];
    const nextFilters = {
      ...selectedFilters,
      [filterId]: nextOptions,
    };

    setSelectedFilters(nextFilters);
    onFiltersChange?.(nextFilters);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    onFiltersChange?.({});
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    onSortChange?.(sort);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-white px-3 py-2 shadow-[0_2px_10px_rgba(27,56,38,0.04)]">
        <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => openFilterModal("brand")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition duration-200 ${
              filterCount > 0
                ? "border-[var(--primary)] bg-[#EAF8EE] text-[var(--primary)]"
                : "border-[#EEF2EF] bg-white text-[var(--text-secondary)] hover:border-[#CFE7D7] hover:bg-[#F7FAF8]"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>{filterCount > 0 ? `Filters (${filterCount})` : "Filters"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSortSheetOpen(true)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition duration-200 ${
              selectedSort !== SORT_OPTIONS[0]
                ? "border-[var(--primary)] bg-[#EAF8EE] text-[var(--primary)]"
                : "border-[#EEF2EF] bg-white text-[var(--text-secondary)] hover:border-[#CFE7D7] hover:bg-[#F7FAF8]"
            }`}
          >
            <span>Sort</span>
            <ChevronDown size={14} />
          </button>

          {FILTER_SECTIONS.map((filter) => {
            const selectedCount = selectedFilters[filter.id]?.length ?? 0;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => openFilterModal(filter.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition duration-200 ${
                  selectedCount > 0
                    ? "border-[var(--primary)] bg-[#EAF8EE] text-[var(--primary)]"
                    : "border-[#EEF2EF] bg-white text-[var(--text-secondary)] hover:border-[#CFE7D7] hover:bg-[#F7FAF8]"
                }`}
              >
                <span>
                  {selectedCount > 0
                    ? `${filter.label} (${selectedCount})`
                    : filter.label}
                </span>
                <ChevronDown size={14} />
              </button>
            );
          })}
        </div>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        activeFilterId={activeFilterId}
        selectedFilters={selectedFilters}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onActiveFilterChange={setActiveFilterId}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <SortBottomSheet
        isOpen={isSortSheetOpen}
        selectedSort={selectedSort}
        onClose={() => setIsSortSheetOpen(false)}
        onSelect={handleSortChange}
      />
    </>
  );
}
