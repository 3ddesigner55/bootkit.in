import { ReactNode } from "react";

type InfoCardProps = {
  title: string;
  children: ReactNode;
};

export default function InfoCard({
  title,
  children,
}: InfoCardProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      <div className="mt-4 leading-7 text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}