"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

export default function OwnerGuard({ children }: { children: ReactNode }) {
  const { hydrated, session } = useAccount();
  if (!hydrated) return null;
  if (session?.role === "OWNER") return <>{children}</>;
  return <Container className="py-16"><section className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 text-center"><h1 className="text-xl font-black">Owner access required</h1><p className="mt-2 text-sm text-[var(--text-muted)]">इस page को केवल store owner manage कर सकता है।</p><Link href="/login" className="mt-5 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-white">Login</Link></section></Container>;
}
