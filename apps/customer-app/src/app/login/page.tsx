"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/hooks/useAccount";

export default function LoginRedirectPage() {
  const router = useRouter();
  const { session, hydrated } = useAccount();

  useEffect(() => {
    if (!hydrated) return;

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get("next");

      if (session) {
        const target = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/phone-login")
          ? next
          : "/";
        router.replace(target);
      } else {
        const phoneLoginUrl = next
          ? `/phone-login?next=${encodeURIComponent(next)}`
          : "/phone-login";
        router.replace(phoneLoginUrl);
      }
    }
  }, [hydrated, session, router]);

  return null;
}