type AdminFilterOption<T extends string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

type AdminFilterBarProps<T extends string> = {
  options: AdminFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
};

export default function AdminFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Filters",
  className = "",
}: AdminFilterBarProps<T>) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            aria-pressed={active}
            className={`h-9 rounded-lg px-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type { AdminFilterOption };
