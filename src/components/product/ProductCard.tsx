"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart, Star } from "lucide-react";
import { useState } from "react";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, percentageOff } from "@/lib/utils";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const {
    hydrated: cartHydrated,
    getQuantity,
    addItem,
    increaseItem,
    decreaseItem,
  } = useCart();

  const {
    hydrated: wishlistHydrated,
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const quantity = cartHydrated
    ? getQuantity(product.id)
    : 0;

  const liked = wishlistHydrated
    ? isWishlisted(product.id)
    : false;

  const discount = percentageOff(
    product.mrp,
    product.price
  );

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] sm:p-4">
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="block overflow-hidden rounded-[16px] bg-[var(--surface-soft)]"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden">
            {product.image && !imageFailed ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
                className="object-contain p-5 transition duration-300 group-hover:scale-105"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span
                className="text-[62px]"
                aria-hidden="true"
              >
                {product.fallbackIcon}
              </span>
            )}
          </div>
        </Link>

        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-[var(--primary)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white">
            {discount}% off
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          disabled={!wishlistHydrated}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--text-secondary)] shadow-sm backdrop-blur transition hover:text-[var(--danger)] disabled:opacity-50"
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
            className={
              liked ? "text-[var(--danger)]" : ""
            }
          />
        </button>

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-bold text-[var(--text-secondary)] shadow-sm backdrop-blur">
          <Clock3
            size={11}
            className="text-[var(--primary)]"
          />
          {product.deliveryMinutes} min
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {product.brand}
        </p>

        <Link
          href={`/product/${product.slug}`}
          className="mt-1"
        >
          <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            {product.unit.label}
          </span>

          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]">
            <Star
              size={12}
              fill="currentColor"
              className="text-[var(--accent)]"
            />
            {product.rating}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black tracking-[-0.025em] text-[var(--text-primary)] sm:text-base">
              {formatPrice(product.price)}
            </p>

            {product.mrp > product.price && (
              <p className="mt-0.5 text-[10px] font-medium text-[var(--text-muted)] line-through">
                {formatPrice(product.mrp)}
              </p>
            )}
          </div>

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product)}
              disabled={
                !cartHydrated || product.stock <= 0
              }
              className="h-10 min-w-[76px] rounded-xl border border-[var(--primary)] px-4 text-xs font-black uppercase tracking-[0.06em] text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:text-[var(--text-muted)]"
            >
              {product.stock > 0 ? "Add" : "Out"}
            </button>
          ) : (
            <QuantitySelector
              quantity={quantity}
              max={product.stock}
              onIncrease={() =>
                increaseItem(product.id)
              }
              onDecrease={() =>
                decreaseItem(product.id)
              }
            />
          )}
        </div>
      </div>
    </article>
  );
}