"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  quantity: number;
  max?: number;
  onIncrease: () => void;
  onDecrease: () => void;
  className?: string;
};

export default function QuantitySelector({
  quantity,
  max = 99,
  onIncrease,
  onDecrease,
  className,
}: QuantitySelectorProps) {
  const cannotDecrease = quantity <= 1;
  const cannotIncrease = quantity >= max;

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center overflow-hidden rounded-xl border border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={cannotDecrease}
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={15} strokeWidth={2.5} />
      </button>

      <span
        aria-live="polite"
        className="flex min-w-8 items-center justify-center text-xs font-black"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={cannotIncrease}
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}