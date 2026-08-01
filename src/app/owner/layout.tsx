import type { ReactNode } from "react";
import OwnerGuard from "@/components/owner/OwnerGuard";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return <OwnerGuard>{children}</OwnerGuard>;
}
