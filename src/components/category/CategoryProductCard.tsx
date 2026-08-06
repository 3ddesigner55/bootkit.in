"use client";

import Image from "next/image";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/getProductImage";
import type { Product } from "@/types/product";

interface CategoryProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export default function CategoryProductCard({
  product,
  onClick,
}: CategoryProductCardProps) {
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

  return (
    <div
      onClick={() => onClick?.(product)}
      className="cursor-pointer rounded-2xl border border-[#EDF1EE] bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Product Image */}
      <div className="flex h-28 items-center justify-center rounded-xl bg-[#F7F8F7]">
        <Image
          src={
            product.image?.trim()
              ? product.image
              : getProductImage(product.name)
          }
          alt={product.name}
          width={84}
          height={84}
          className="object-contain"
        />
      </div>

      {/* Product Name */}
      <h3 className="mt-3 line-clamp-2 text-sm font-bold text-[var(--text-primary)]">
        {product.name}
      </h3>

      {/* Unit */}
      <p className="mt-1 text-[11px] text-gray-500">
        {product.unit.label}
      </p>

      {/* Price */}
      <p className="mt-2 text-base font-black text-[var(--primary)]">
        {formatPrice(product.price)}
      </p>

      {/* Add / Quantity */}
      {quantity === 0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem(product);
          }}
          className="mt-3 w-full rounded-xl bg-[var(--primary)] py-2 text-sm font-bold text-white transition hover:opacity-90"
        >
          ADD
        </button>
      ) : (
        <QuantitySelector
          className="mt-3 w-full justify-center"
          quantity={quantity}
          max={product.stock}
          onIncrease={() => increaseItem(product.id)}
          onDecrease={() => decreaseItem(product.id)}
        />
      )}
    </div>
  );
}