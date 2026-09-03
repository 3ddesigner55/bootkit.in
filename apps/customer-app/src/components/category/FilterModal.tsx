"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import FilterOptions from "./FilterOptions";
import FilterSearch from "./FilterSearch";
import FilterSidebar from "./FilterSidebar";
import {
  FILTER_SECTIONS,
  type FilterId,
  type SelectedFilters,
} from "./filterData";
import useOverlayPresence from "./useOverlayPresence";

type FilterModalProps = {
  isOpen: boolean;
  activeFilterId: FilterId;
  selectedFilters: SelectedFilters;
  onClose: () => void;
  onApply: (filters: SelectedFilters) => void;
  onActiveFilterChange: (filterId: FilterId) => void;
  onFilterChange: (filterId: FilterId, option: string) => void;
  onClear: () => void;
};

export default function FilterModal({
  isOpen,
  activeFilterId,
  selectedFilters,
  onClose,
  onApply,
  onActiveFilterChange,
  onFilterChange,
  onClear,
}: FilterModalProps) {
  const [brandQuery, setBrandQuery] = useState("");
  const { isMounted, isVisible } = useOverlayPresence(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setBrandQuery("");
  }, [activeFilterId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const activeSection = useMemo(
    () => FILTER_SECTIONS.find((section) => section.id === activeFilterId),
    [activeFilterId]
  );
  const selectedFilterChips = FILTER_SECTIONS.flatMap((section) =>
    (selectedFilters[section.id] ?? []).map((option) => ({
      id: `${section.id}-${option}`,
      label: `${section.label}: ${option}`,
    }))
  );

  if (!isMounted || !activeSection) {
    return null;
  }

  const handleSectionChange = (filterId: FilterId) => {
    onActiveFilterChange(filterId);
    setBrandQuery("");
  };

  const handleOptionChange = (option: string) => {
    onFilterChange(activeSection.id, option);
  };

  const handleClearFilters = () => {
    onClear();
    setBrandQuery("");
  };

  const handleApply = () => {
    onApply(selectedFilters);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end bg-black/30 transition-opacity duration-[250ms] ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex w-full flex-col items-center sm:mb-6 sm:max-w-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--text-primary)] shadow-[0_8px_22px_rgba(25,50,34,0.18)] transition duration-[250ms] hover:bg-[#F7FAF8] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <X size={21} />
        </button>

        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-filter-title"
          className={`flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_42px_rgba(25,50,34,0.18)] transition duration-[250ms] sm:rounded-[28px] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <header className="shrink-0 border-b border-[#EEF2EF] bg-white px-4 pb-3 pt-4">
            <h2
              id="category-filter-title"
              className="text-lg font-black text-[var(--text-primary)]"
            >
              Filters
            </h2>

            {activeSection.searchable ? (
              <FilterSearch value={brandQuery} onChange={setBrandQuery} />
            ) : null}

            {selectedFilterChips.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {selectedFilterChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="shrink-0 rounded-full bg-[#EAF8EE] px-2.5 py-1.5 text-[11px] font-bold text-[var(--primary)]"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="flex min-h-0 flex-1">
            <FilterSidebar
              sections={FILTER_SECTIONS}
              activeFilterId={activeFilterId}
              selectedFilters={selectedFilters}
              onSelect={handleSectionChange}
            />

            <div className="min-w-0 flex-1 overflow-y-auto bg-white">
              <div className="border-b border-[#F3F5F3] px-5 pb-3 pt-4">
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  {activeSection.label}
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
                  {activeSection.mode === "multiple"
                    ? "Select all that apply"
                    : "Select one option"}
                </p>
              </div>

              <FilterOptions
                section={activeSection}
                selectedOptions={selectedFilters[activeSection.id] ?? []}
                onChange={handleOptionChange}
                searchQuery={activeSection.searchable ? brandQuery : undefined}
              />
            </div>
          </div>

          <footer className="flex shrink-0 gap-3 border-t border-[#EEF2EF] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-12 flex-1 rounded-xl border border-[#DCE7DF] text-sm font-black text-[var(--text-secondary)] transition hover:bg-[#F7FAF8]"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-12 flex-1 rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-[0_8px_18px_rgba(44,143,70,0.2)] transition hover:bg-green-700"
            >
              Apply
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
