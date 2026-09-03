"use client";

import { Check, X } from "lucide-react";
import { type PointerEvent, useEffect, useRef } from "react";

import { SORT_OPTIONS } from "./filterData";
import useOverlayPresence from "./useOverlayPresence";

type SortBottomSheetProps = {
  isOpen: boolean;
  selectedSort: string;
  onClose: () => void;
  onSelect: (sort: string) => void;
};

export default function SortBottomSheet({
  isOpen,
  selectedSort,
  onClose,
  onSelect,
}: SortBottomSheetProps) {
  const swipeStartY = useRef<number | null>(null);
  const { isMounted, isVisible } = useOverlayPresence(isOpen);

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

  if (!isMounted) {
    return null;
  }

  const handleSortSelection = (sort: string) => {
    onSelect(sort);
    onClose();
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    swipeStartY.current = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const startY = swipeStartY.current;
    swipeStartY.current = null;

    if (startY !== null && event.clientY - startY > 80) {
      onClose();
    }
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
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-sort-title"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStartY.current = null;
        }}
        className={`w-full rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(27,56,38,0.18)] transition duration-[250ms] sm:mx-auto sm:max-w-xl ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-[#DDE6DF]" />
        <header className="flex items-center justify-between py-4">
          <h2
            id="category-sort-title"
            className="text-lg font-black text-[var(--text-primary)]"
          >
            Sort by
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sort options"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[#F3F7F4]"
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-1">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option === selectedSort;
            const inputId = `sort-${option}`;

            return (
              <label
                key={option}
                htmlFor={inputId}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3.5 text-sm font-bold transition ${
                  isSelected
                    ? "bg-[#EDF9F0] text-[var(--primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[#F7FAF8]"
                }`}
              >
                <span>{option}</span>
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <input
                    id={inputId}
                    type="radio"
                    name="category-sort"
                    value={option}
                    checked={isSelected}
                    onChange={() => handleSortSelection(option)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : "border-[#D9E5DC] bg-white"
                    }`}
                  >
                    {isSelected ? <Check size={13} className="text-white" /> : null}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
