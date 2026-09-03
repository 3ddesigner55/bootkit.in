"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useState } from "react";

import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, percentageOff } from "@/lib/utils";
import type { Product } from "@/types/product";

type WishlistCompactCardProps = {
  product: Product;
};

export default function WishlistCompactCard({
  product,
}: WishlistCompactCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { hydrated: cartHydrated, getQuantity, addItem, increaseItem, decreaseItem } =
    useCart();
  const { hydrated: wishlistHydrated, isWishlisted, toggleWishlist } = useWishlist();

  const quantity = cartHydrated ? getQuantity(product.id) : 0;
  const liked = wishlistHydrated ? isWishlisted(product.id) : false;
  const discount = percentageOff(product.mrp, product.price);
  const image = product.images?.find(Boolean) || product.image;

  return (
    <article className="relative flex h-[216px] min-w-0 flex-col overflow-hidden rounded-[18px] bg-white p-2 pb-3 shadow-[0_3px_12px_rgba(25,50,34,0.08)]">
      {discount > 0 ? (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.04em] text-white">
          {discount}% off
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        disabled={!wishlistHydrated}
        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--text-secondary)] shadow-[0_2px_8px_rgba(25,50,34,0.12)] transition hover:text-[var(--danger)] disabled:opacity-50"
      >
        <Heart
          size={14}
          fill={liked ? "currentColor" : "none"}
          className={liked ? "text-[var(--danger)]" : ""}
        />
      </button>

      <Link
        href={`/product/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="flex h-[68px] shrink-0 items-center justify-center"
      >
        {image && !imageFailed ? (
          <span className="relative h-[66px] w-[66px]">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="66px"
              className="object-contain"
              onError={() => setImageFailed(true)}
            />
          </span>
        ) : (
          <span className="text-4xl" aria-hidden="true">
            {product.fallbackIcon}
          </span>
        )}
      </Link>

      <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        {product.brand}
      </p>

      <Link href={`/product/${product.slug}`} className="mt-0.5">
        <h2 className="line-clamp-2 min-h-8 text-[11px] font-extrabold leading-4 text-[var(--text-primary)]">
          {product.name}
        </h2>
      </Link>

      <p className="mt-0.5 text-[10px] font-medium text-[var(--text-muted)]">
        {product.unit.label}
      </p>

      <div className="mt-auto">
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF7E0] px-1.5 py-0.5 text-[9px] font-bold text-[var(--text-secondary)]">
          <Star size={9} fill="currentColor" className="text-[#F59E0B]" />
          {product.rating}
        </span>

        <div className="mt-1 flex items-start justify-between gap-1">
          <span className="min-w-0">
            <span className="block text-base font-black leading-4 tracking-[-0.03em] text-[var(--text-primary)]">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price ? (
              <span className="block text-[10px] leading-3 text-[var(--text-muted)] line-through">
                {formatPrice(product.mrp)}
              </span>
            ) : null}
          </span>

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product)}
              disabled={!cartHydrated || product.stock <= 0}
              className="mt-[-7px] h-[30px] w-16 shrink-0 rounded-[15px] bg-[var(--primary)] text-[10px] font-black uppercase tracking-[0.04em] text-white transition active:scale-95 disabled:opacity-50"
            >
              {product.stock > 0 ? "Add" : "Out"}
            </button>
          ) : (
            <QuantitySelector
              quantity={quantity}
              max={product.stock}
              onIncrease={() => increaseItem(product.id)}
              onDecrease={() => decreaseItem(product.id)}
              className="h-7 rounded-[14px] [&_button]:w-5 [&_svg]:h-3 [&_svg]:w-3 [&_span]:min-w-6 [&_span]:text-[10px]"
            />
          )}
        </div>
      </div>
    </article>
  );
}
