type AdminStatusTone = "success" | "danger" | "warning" | "info" | "neutral";

type AdminStatusBadgeProps = {
  label: string;
  tone?: AdminStatusTone;
  className?: string;
};

const toneClasses: Record<AdminStatusTone, string> = {
  success: "bg-green-50 text-[var(--success)]",
  danger: "bg-red-50 text-[var(--danger)]",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-[var(--surface-soft)] text-[var(--text-muted)]",
};

export default function AdminStatusBadge({
  label,
  tone = "neutral",
  className = "",
}: AdminStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${toneClasses[tone]} ${className}`}>
      {label}
    </span>
  );
}

export type { AdminStatusTone };
