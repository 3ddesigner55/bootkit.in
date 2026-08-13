"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAccount } from "@/hooks/useAccount";
import Container from "@/components/ui/Container";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { hydrated, session } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  const hasAdminAccess =
    Boolean(session?.accessToken) &&
    (session?.role === "ADMIN" || session?.role === "OWNER");

  useEffect(() => {
    if (hydrated && !hasAdminAccess) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasAdminAccess, hydrated, pathname, router]);

  if (!hydrated) return null;
  if (hasAdminAccess) return <>{children}</>;
  return <Container className="py-16"><section className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 text-center"><h1 className="text-xl font-black">Admin access required</h1><p className="mt-2 text-sm text-[var(--text-muted)]">इस page के लिए admin role चाहिए।</p><Link href={`/login?next=${encodeURIComponent(pathname)}`} className="mt-5 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-white">Login</Link></section></Container>;
}
