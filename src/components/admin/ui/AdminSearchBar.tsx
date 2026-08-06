import { Search } from "lucide-react";
import type { ChangeEventHandler } from "react";

type AdminSearchBarProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export default function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  className = "",
  disabled = false,
}: AdminSearchBarProps) {
  return (
    <label
      className={`flex h-11 min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 focus-within:border-[var(--primary)] ${className}`}
    >
      <span className="sr-only">{label}</span>
      <Search size={17} className="shrink-0 text-[var(--text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed"
      />
    </label>
  );
}
