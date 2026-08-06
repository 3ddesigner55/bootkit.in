"use client";

import { X } from "lucide-react";
import Image from "next/image";

import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/getProductImage";

import type { Product } from "@/types/product";

interface ProductBottomSheetProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export default function ProductBottomSheet({
  open,
  product,
  onClose,
}: ProductBottomSheetProps) {
  const {
    hydrated,
    getQuantity,
    addItem,
    increaseItem,
    decreaseItem,
  } = useCart();

  if (!open || !product) return null;

  const quantity = hydrated
    ? getQuantity(product.id)
    : 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[120] h-[88vh] rounded-t-[32px] bg-white shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-14 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">

          <div>
            <h2 className="text-lg font-black">
              Product Details
            </h2>

            <p className="text-xs text-gray-500">
              Fresh • Fast Delivery
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}
        <div className="h-[calc(88vh-82px)] overflow-y-auto p-5">

          <div className="flex justify-center">

            <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-[#F7F8F7]">

              <Image
                src={
                  product.image?.trim()
                    ? product.image
                    : getProductImage(product.name)
                }
                alt={product.name}
                width={180}
                height={180}
                className="object-contain"
              />

            </div>

          </div>

          <h1 className="mt-6 text-xl font-black">
            {product.name}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {product.unit.label}
          </p>

          <p className="mt-4 text-2xl font-black text-[var(--primary)]">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <div className="mt-6">
              <h3 className="mb-2 font-bold">
                Description
              </h3>

              <div className="text-sm text-gray-600">
                {product.description}
              </div>
            </div>
          )}

          <div className="mt-8">

            {quantity === 0 ? (

              <button
                onClick={() => addItem(product)}
                className="w-full rounded-2xl bg-[var(--primary)] py-4 text-base font-bold text-white"
              >
                ADD TO CART
              </button>

            ) : (

              <QuantitySelector
                className="w-full justify-center"
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

      </div>
    </>
  );
}