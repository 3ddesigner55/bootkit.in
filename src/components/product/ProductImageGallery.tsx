"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Product, ProductVariant } from "@/types/product";

type ProductImageGalleryProps = {
  product: Product;
  selectedVariant?: ProductVariant;
};

function getGalleryImages(product: Product, selectedVariant?: ProductVariant) {
  const imageCandidates = [
    ...(selectedVariant?.images ?? []),
    selectedVariant?.image,
    ...(product.images ?? []),
    product.image,
  ];

  return imageCandidates.filter(
    (image, index, images) =>
      typeof image === "string" &&
      image.trim() !== "" &&
      images.indexOf(image) === index
  );
}

export default function ProductImageGallery({
  product,
  selectedVariant,
}: ProductImageGalleryProps) {
  const galleryImages = useMemo(
    () => getGalleryImages(product, selectedVariant),
    [product, selectedVariant]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id, selectedVariant?.id]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const startX = dragStartX.current;
    dragStartX.current = null;

    if (startX === null || galleryImages.length < 2) {
      return;
    }

    const distance = event.clientX - startX;

    if (Math.abs(distance) < 40) {
      return;
    }

    setActiveImageIndex((currentIndex) => {
      if (distance < 0) {
        return Math.min(currentIndex + 1, galleryImages.length - 1);
      }

      return Math.max(currentIndex - 1, 0);
    });
  };

  return (
    <section className="bg-white">
      <div
        className="relative aspect-square touch-pan-y overflow-hidden bg-white"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartX.current = null;
        }}
      >
        {galleryImages.length > 0 ? (
          <div
            className="flex h-full transition-transform duration-[250ms] ease-out"
            style={{
              width: `${galleryImages.length * 100}%`,
              transform: `translateX(-${
                (activeImageIndex * 100) / galleryImages.length
              }%)`,
            }}
          >
            {galleryImages.map((image) => (
              <div
                key={image}
                className="relative h-full shrink-0"
                style={{ width: `${100 / galleryImages.length}%` }}
              >
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  priority={activeImageIndex === 0}
                  sizes="(max-width: 640px) 100vw, 640px"
                  className="object-contain p-8"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[112px]">
            {product.fallbackIcon}
          </div>
        )}
      </div>

      {galleryImages.length > 1 ? (
        <div className="flex justify-center gap-1.5 py-3">
          {galleryImages.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeImageIndex}
              onClick={() => setActiveImageIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === activeImageIndex
                  ? "w-5 bg-[var(--primary)]"
                  : "w-1.5 bg-[#DCE6DF]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
