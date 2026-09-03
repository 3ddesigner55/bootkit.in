"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAccount } from "@/hooks/useAccount";
import { Loader2 } from "lucide-react";

export default function CustomerAuthGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { session, hydrated } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !session) {
      router.replace(`/phone-login?next=${encodeURIComponent(pathname)}`);
    }
  }, [session, hydrated, pathname, router]);

  if (!hydrated) {
    return (
      fallback || (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
        </div>
      )
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
