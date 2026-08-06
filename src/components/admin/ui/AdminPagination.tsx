import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

export default function AdminPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
  className = "",
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  return (
    <div className={`mt-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 ${className}`}>
      <p className="text-xs font-bold text-[var(--text-muted)]">
        Page {safePage} of {safeTotalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={safePage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={safePage === safeTotalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
