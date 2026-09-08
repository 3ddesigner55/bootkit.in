"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CartRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const from = searchParams.get("from");
    const target = from ? `/checkout?from=${encodeURIComponent(from)}` : "/checkout";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16A34A] border-t-transparent" />
        <p className="text-xs font-bold text-gray-500">Redirecting to checkout...</p>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAF8]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16A34A] border-t-transparent" />
        </div>
      }
    >
      <CartRedirect />
    </Suspense>
  );
}

