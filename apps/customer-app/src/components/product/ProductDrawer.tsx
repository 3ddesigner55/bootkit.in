"use client";

import Image from "next/image";
import { X, Clock3, Star } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductDrawerProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export default function ProductDrawer({
  open,
  product,
  onClose,
}: ProductDrawerProps) {
  if (!open || !product) return null;

  const galleryImages = (product.images ?? []).filter(
    (image) => typeof image === "string" && image.trim() !== ""
  );
  const imageSource =
    galleryImages[0] ??
    (typeof product.image === "string" && product.image.trim() !== ""
      ? product.image
      : null);

  return (
    <>
      {/* Overlay */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
      />

      {/* Bottom Sheet */}

      <div className="fixed inset-x-0 bottom-0 z-[100] h-[85vh] rounded-t-[32px] bg-white shadow-2xl">

        {/* Handle */}

        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-14 rounded-full bg-gray-300" />
        </div>

        {/* Header */}

        <div className="flex items-center justify-between border-b px-5 py-4">

          <h2 className="text-lg font-black">
            Product Details
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2"
          >
            <X size={20} />
          </button>

        </div>

        {/* Content */}

        <div className="overflow-y-auto p-6">

          <div className="flex justify-center">

            <div className="flex h-60 w-60 items-center justify-center rounded-3xl bg-[#f7f8fa]">

              {imageSource ? (
                <Image
                  src={imageSource}
                  alt={product.name}
                  width={220}
                  height={220}
                  className="object-contain"
                />
              ) : (
                <span className="text-7xl">{product.fallbackIcon}</span>
              )}

            </div>

          </div>

          <h1 className="mt-6 text-2xl font-black">

            {product.name}

          </h1>

          <div className="mt-3 flex items-center gap-4">

            <span className="flex items-center gap-1">

              <Star
                size={16}
                fill="currentColor"
                className="text-yellow-500"
              />

              {product.rating}

            </span>

            <span className="flex items-center gap-1">

              <Clock3 size={15} />

              {product.deliveryMinutes} min

            </span>

          </div>

          <div className="mt-6">

            <p className="text-3xl font-black text-[var(--primary)]">

              ₹{product.price}

            </p>

            {product.mrp > product.price && (

              <p className="mt-1 text-gray-400 line-through">

                ₹{product.mrp}

              </p>

            )}

          </div>

          <div className="mt-8">

            <h3 className="text-lg font-bold">

              Description

            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">

              {product.description}

            </p>

          </div>

        </div>

      </div>

    </>
  );
}
