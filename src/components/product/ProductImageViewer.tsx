"use client";

import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  current: number;
  open: boolean;
  onClose: () => void;
  onChange: (index: number) => void;
};

export default function ProductImageViewer({
  images,
  current,
  open,
  onClose,
  onChange,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-20 rounded-full bg-white p-3"
      >
        <X size={22} />
      </button>

      {current > 0 && (
        <button
          onClick={() => onChange(current - 1)}
          className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3"
        >
          <ChevronLeft />
        </button>
      )}

      {current < images.length - 1 && (
        <button
          onClick={() => onChange(current + 1)}
          className="absolute right-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3"
        >
          <ChevronRight />
        </button>
      )}

      <div className="relative flex h-full items-center justify-center">
        <div className="relative h-[85vh] w-[90vw]">
          <Image
            src={images[current]}
            alt=""
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
      </div>
    </div>
  );
}