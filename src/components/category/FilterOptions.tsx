"use client";

import { Check } from "lucide-react";

import type { FilterSection } from "./filterData";

type FilterOptionsProps = {
  section: FilterSection;
  selectedOptions: string[];
  onChange: (option: string) => void;
  searchQuery?: string;
};

export default function FilterOptions({
  section,
  selectedOptions,
  onChange,
  searchQuery = "",
}: FilterOptionsProps) {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleOptions = section.options.filter((option) =>
    option.toLocaleLowerCase().includes(normalizedQuery)
  );

  if (visibleOptions.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm font-semibold text-[var(--text-muted)]">
        No brands found
      </div>
    );
  }

  return (
    <div className="space-y-1 p-3">
      {visibleOptions.map((option) => {
        const isSelected = selectedOptions.includes(option);
        const isSingleSelect = section.mode === "single";
        const inputId = `${section.id}-${option}`;

        return (
          <label
            key={option}
            htmlFor={inputId}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3.5 text-sm font-bold transition ${
              isSelected
                ? "bg-[#EDF9F0] text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[#F7FAF8]"
            }`}
          >
            <span>{option}</span>
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                id={inputId}
                type={isSingleSelect ? "radio" : "checkbox"}
                name={section.id}
                value={option}
                checked={isSelected}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <span
                className={`flex h-5 w-5 items-center justify-center border transition ${
                  isSingleSelect ? "rounded-full" : "rounded-md"
                } ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[#D9E5DC] bg-white"
                }`}
              >
                {isSingleSelect ? (
                  <span
                    className={`h-2 w-2 rounded-full bg-white transition ${
                      isSelected ? "scale-100" : "scale-0"
                    }`}
                  />
                ) : (
                  <Check
                    size={13}
                    className={`text-white transition ${
                      isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                )}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
