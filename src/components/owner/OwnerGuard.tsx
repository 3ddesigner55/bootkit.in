"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAccount } from "@/hooks/useAccount";
import Container from "@/components/ui/Container";

export default function OwnerGuard({ children }: { children: ReactNode }) {
  const { hydrated, session } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  const hasOwnerAccess =
    Boolean(session?.accessToken) && session?.role === "OWNER";

  useEffect(() => {
    if (hydrated && !hasOwnerAccess) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasOwnerAccess, hydrated, pathname, router]);

  if (!hydrated) {
    return null;
  }

  if (hasOwnerAccess) {
    return <>{children}</>;
  }

  return (
    <Container className="py-16">
      <section className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 text-center shadow-[var(--shadow-sm)]">
        <h1 className="text-xl font-black text-[var(--foreground)]">Owner Access Required</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This section is strictly restricted to verified platform Owners.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="mt-5 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-white"
        >
          Sign In as Owner
        </Link>
      </section>
    </Container>
  );
}
