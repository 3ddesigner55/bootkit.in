import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
};

export default function AdminPageHeader({
  title,
  description,
  eyebrow = "Local admin",
  backHref = "/admin",
  backLabel = "Back to admin dashboard",
  action,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div className={`mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <ArrowLeft size={19} />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
