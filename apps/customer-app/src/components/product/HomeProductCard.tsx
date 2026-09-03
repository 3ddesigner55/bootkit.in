"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import QuantitySelector from "@/components/ui/QuantitySelector";
import Image from "next/image";
import { Heart, Link } from "lucide-react";
import type { Product } from "@/types/product";
import {
  formatPrice,
  percentageOff,
} from "@/lib/utils";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  product: Product;
}

export default function HomeProductCard({
  product,
}: Props) {
  const [imageError, setImageError] =
    useState(false);
    const {
  hydrated,
  getQuantity,
  addItem,
  increaseItem,
  decreaseItem,
} = useCart();

const quantity = hydrated
  ? getQuantity(product.id)
  : 0;

  const {
  hydrated: wishlistHydrated,
  isWishlisted,
  toggleWishlist,
} = useWishlist();

const liked = wishlistHydrated
  ? isWishlisted(product.id)
  : false;

  const discount = percentageOff(
  product.mrp,
  product.price
);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      {/* Wishlist */}
      <div className="relative">
        <button
  type="button"
  onClick={() => toggleWishlist(product)}
  disabled={!wishlistHydrated}
  className="absolute right-1 top-1 z-10 rounded-full bg-white p-1 shadow"
>
  <Heart
    size={14}
    fill={liked ? "currentColor" : "none"}
    className={
      liked ? "text-red-500" : "text-gray-500"
    }
  />
</button>

{discount > 0 && (
  <span className="absolute left-1 top-1 rounded bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
    {discount}% OFF
  </span>
)}

        <Link href={`/product/${product.slug}`}>
          <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50">
            {product.image && !imageError ? (
              <Image
                src={product.image}
                alt={product.name}
                width={80}
                height={80}
                className="object-contain"
                onError={() =>
                  setImageError(true)
                }
              />
            ) : (
              <span className="text-4xl">
                {product.fallbackIcon}
              </span>
            )}
          </div>
        </Link>
      </div>
      {/* Image Dots */}
<div className="mt-2 flex justify-center gap-1">
  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
  <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
  <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
</div>

      {/* Unit + ADD */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {product.unit.label}
        </span>

        {quantity === 0 ? (
  <button
    onClick={() => addItem(product)}
    className="rounded-md border border-green-600 px-2 py-1 text-[10px] font-bold text-green-600"
  >
    ADD
  </button>
) : (
  <QuantitySelector
    quantity={quantity}
    max={product.stock}
    onIncrease={() => increaseItem(product.id)}
    onDecrease={() => decreaseItem(product.id)}
    className="h-7"
  />
)}
      </div>

      {/* Price */}
      <p className="mt-2 text-sm font-bold">
        {formatPrice(product.price)}
      </p>
      {discount > 0 && (
  <p className="text-[10px] font-bold text-green-600">
    {discount}% OFF
  </p>
)}

      {/* Product Name */}
      <Link href={`/product/${product.slug}`}>
        <h3 className="mt-1 line-clamp-2 text-[11px] font-medium leading-4">
          {product.name}
        </h3>
      </Link>

      {/* Rating */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
        <span>⭐ {product.rating}</span>

        <span>⚡ {product.deliveryMinutes} min</span>
      </div>
    </div>
  );
}
