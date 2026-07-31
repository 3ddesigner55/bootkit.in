import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export default function SectionHeading({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-4 flex items-end justify-between gap-4 sm:mb-6",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[21px] font-extrabold tracking-[-0.035em] text-[var(--text-primary)] sm:text-[26px]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)] sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="shrink-0 rounded-lg px-1 py-1 text-[13px] font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:text-sm"
        >
          {actionLabel}
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}