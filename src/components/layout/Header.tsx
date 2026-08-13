"use client";

import { usePathname } from "next/navigation";
import DesktopHeader from "@/components/layout/DesktopHeader";
import MobileHeader from "@/components/layout/MobileHeader";

export default function Header() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
      <DesktopHeader />
      <MobileHeader />
    </div>
  );
}
