import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminPrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  loading?: boolean;
};

export default function AdminPrimaryButton({
  children,
  icon,
  loading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}: AdminPrimaryButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
