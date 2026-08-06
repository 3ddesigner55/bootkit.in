"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function FloatingCart() {
  const { items, totalItems, hydrated } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [displayItems, setDisplayItems] = useState<CartItem[]>([]);
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [isCartContentPulsing, setIsCartContentPulsing] = useState(false);

  const shouldShow = hydrated && items.length > 0;

  useEffect(() => {
    if (shouldShow) {
      setDisplayItems(items);
      setIsMounted(true);

      const animationFrame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }

    setIsVisible(false);

    const exitTimer = window.setTimeout(() => {
      setIsMounted(false);
      setDisplayItems([]);
    }, 250);

    return () => window.clearTimeout(exitTimer);
  }, [items, shouldShow]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsNavigationVisible(
        !(currentScrollY > lastScrollY && currentScrollY > 100)
      );
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    setIsCartContentPulsing(false);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsCartContentPulsing(true);
    });
    const pulseTimer = window.setTimeout(() => {
      setIsCartContentPulsing(false);
    }, 180);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(pulseTimer);
    };
  }, [items, shouldShow, totalItems]);

  if (!isMounted) {
    return null;
  }

  const visibleThumbnails =
  displayItems.length > 4
    ? displayItems.slice(0, 3)
    : displayItems.slice(0, 3);

const remainingItems = Math.max(displayItems.length - 3, 0);
  const itemLabel = totalItems === 1 ? "1 item" : `${totalItems} items`;

  return (
    <div
      className={`pointer-events-none fixed bottom-[calc(78px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[240px] -translate-x-1/2 transition duration-300 ${
        isVisible && isNavigationVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
    >
      <Link
        href="/cart"
        className="pointer-events-auto flex h-[52px] w-[235px] items-center rounded-full bg-[var(--primary)] px-3 shadow-[0_10px_24px_rgba(22,101,52,.22)]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`flex shrink-0 -space-x-2 transition-transform duration-[180ms] ${
              isCartContentPulsing ? "scale-[1.04]" : "scale-100"
            }`}
          >
            {visibleThumbnails.map((item) => {
              const image = getCartItemImage(item);

              return (
                <span
                  key={`${item.product.id}-${item.variantId ?? "base"}`}
                  className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#F4F7F4]"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="text-lg">{item.product.fallbackIcon}</span>
                  )}
                </span>
              );
            })}

            {displayItems.length > 3 ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#EAF8EE] text-[11px] font-black text-[var(--primary)]">
                +{remainingItems}
              </span>
            ) : null}
          </div>

          <span className="min-w-0">
            <span className="block text-sm font-black text-white">View cart</span>
            <span
              className={`mt-0.5 block text-[11px] font-semibold text-white/75 transition-transform duration-[180ms] ${
                isCartContentPulsing ? "scale-105" : "scale-100"
              }`}
            >
              {itemLabel}
            </span>
          </span>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-[0_4px_12px_rgba(15,72,35,0.18)]">
          <ArrowRight size={16} strokeWidth={2.5} />
        </span>
      </Link>
    </div>
  );
}
