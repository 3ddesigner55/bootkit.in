import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export default function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = "",
}: AdminEmptyStateProps) {
  return (
    <section
      className={`flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center ${className}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={26} />
      </span>
      <h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
