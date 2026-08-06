"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/types/cart";

function getCartItemImage(item: CartItem) {
  const galleryImage = item.product.images?.find(
    (image) => typeof image === "string" && image.trim() !== ""
  );

  if (galleryImage) {
    return galleryImage;
  }

  return typeof item.product.image === "string" && item.product.image.trim() !== ""
    ? item.product.image
    : null;
}

export default function MobileCartBar() {
  const pathname = usePathname();
  const { items, totalItems, hydrated } = useCart();
  const shouldHide =
    pathname === "/cart" || pathname.startsWith("/checkout");

  if (!hydrated || items.length === 0 || shouldHide) {
    return null;
  }

  const visibleItems = items.slice(0, 3);
  const remainingItems = items.length - visibleItems.length;
  const itemLabel = totalItems === 1 ? "1 item" : `${totalItems} items`;

  return (
    <Link
      href="/cart"
      className="fixed bottom-[calc(78px+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-[50px] w-fit min-w-[180px] max-w-[270px] -translate-x-1/2 items-center rounded-full bg-[var(--primary)] px-2.5 text-white shadow-[0_10px_24px_rgba(15,66,42,0.22)] transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex shrink-0 -space-x-2">
          {visibleItems.map((item) => {
            const image = getCartItemImage(item);

            return (
              <span
                key={`${item.product.id}-${item.variantId ?? "base"}`}
                className="relative flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#F4F7F4]"
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="38px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="text-lg">{item.product.fallbackIcon}</span>
                )}
              </span>
            );
          })}

          {remainingItems > 0 ? (
            <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 border-white bg-[#EAF8EE] text-[11px] font-black text-[var(--primary)]">
              +{remainingItems}
            </span>
          ) : null}
        </span>

       <span className="min-w-[72px] flex-1">
  <span className="block whitespace-nowrap text-sm font-bold leading-4 text-white">
    View cart
  </span>

  <span className="mt-0.5 block text-[10px] font-medium text-white/75">
    {itemLabel}
  </span>
</span>
      </span>

      
    </Link>
  );
}
