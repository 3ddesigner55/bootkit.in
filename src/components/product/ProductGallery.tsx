"use client";

import ProductImageViewer from "./ProductImageViewer";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { safeImageUrl } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/product";

type Props = {
  product: Product;
  selectedVariant?: ProductVariant;
};

export default function ProductGallery({ product, selectedVariant }: Props) {
  const images = useMemo(() => {
    const list: string[] = [];

    if (Array.isArray(selectedVariant?.images)) {
      list.push(...selectedVariant.images.filter((img) => img.trim() !== "").map(safeImageUrl));
    }

    if (selectedVariant?.image?.trim()) {
      list.push(safeImageUrl(selectedVariant.image));
    }

    if (Array.isArray(product.images)) {
      list.push(
        ...product.images
          .filter((img) => typeof img === "string" && img.trim() !== "")
          .map(safeImageUrl)
      );
    }

    if (
      typeof product.image === "string" &&
      product.image.trim() !== ""
    ) {
      list.push(safeImageUrl(product.image));
    }

    if (
      typeof product.thumbnail === "string" &&
      product.thumbnail.trim() !== ""
    ) {
      const safeThumb = safeImageUrl(product.thumbnail);
      if (!list.includes(safeThumb)) {
        list.push(safeThumb);
      }
    }

    if (list.length === 0) {
      list.push("/images/placeholder.png");
    }

    return Array.from(new Set(list));
  }, [product, selectedVariant]);

  const [selected, setSelected] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelected(0);
    setFailed({});
  }, [selectedVariant?.id]);

  const currentImage = images[selected] || "/images/placeholder.png";

  return (
    <div>
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-[24px] bg-[var(--surface-soft)]">
        <div
          className="group relative aspect-square cursor-zoom-in"
          onClick={() => images.length && setViewerOpen(true)}
        >
          {images.length > 0 && !failed[selected] ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              priority
              unoptimized={currentImage.startsWith("/")}
              sizes="(max-width:1024px)100vw,50vw"
              className="object-contain p-8 transition duration-300 group-hover:scale-110"
              onError={() =>
                setFailed((prev) => ({
                  ...prev,
                  [selected]: true,
                }))
              }
            />
          ) : (
            <Image
              src="/images/placeholder.png"
              alt={product.name}
              fill
              priority
              unoptimized
              sizes="(max-width:1024px)100vw,50vw"
              className="object-contain p-8"
            />
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelected(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                selected === index
                  ? "border-[var(--primary)]"
                  : "border-[var(--border)]"
              }`}
            >
              {!failed[index] ? (
                <Image
                  src={img}
                  alt=""
                  fill
                  unoptimized={img.startsWith("/")}
                  sizes="80px"
                  className="object-contain p-2"
                  onError={() =>
                    setFailed((prev) => ({
                      ...prev,
                      [index]: true,
                    }))
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">
                  {product.fallbackIcon || "📦"}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <ProductImageViewer
        images={images}
        current={selected}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onChange={setSelected}
      />
    </div>
  );
}
