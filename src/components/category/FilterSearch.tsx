"use client";

import { Search } from "lucide-react";

type FilterSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function FilterSearch({
  value,
  onChange,
}: FilterSearchProps) {
  return (
    <label className="mx-4 mt-4 flex h-11 items-center gap-2.5 rounded-xl border border-[#E8EFEB] bg-[#F8FAF8] px-3">
      <Search size={17} className="shrink-0 text-[var(--text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search brands"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />
    </label>
  );
}
