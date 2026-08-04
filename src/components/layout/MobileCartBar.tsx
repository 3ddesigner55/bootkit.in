"use client";

import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export default function MobileCartBar() {
  const pathname = usePathname(); const { totalItems, subtotal, hydrated } = useCart();
  if (!hydrated || totalItems === 0 || pathname === "/cart" || pathname.startsWith("/checkout")) return null;
  return <Link href="/cart" className="fixed inset-x-3 bottom-[78px] z-40 flex h-14 items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#1f7a50,#10472d)] px-4 text-white shadow-[0_12px_28px_rgba(15,66,42,.28)] lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-inner"><ShoppingBag size={18} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-black">View cart · {totalItems} {totalItems === 1 ? "item" : "items"}</span><span className="block text-[10px] text-white/70">Ready for checkout</span></span><span className="flex items-center gap-1 text-sm font-black">{formatPrice(subtotal)} <ChevronRight size={17} /></span></Link>;
}
