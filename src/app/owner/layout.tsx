import type { ReactNode } from "react";
import OwnerGuard from "@/components/owner/OwnerGuard";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[var(--background)]">
        {children}
      </div>
    </OwnerGuard>
  );
}
