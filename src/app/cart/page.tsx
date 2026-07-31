"use client";

import { useCoupon } from "@/hooks/useCoupon";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

const FREE_DELIVERY_MINIMUM = 499;
const DELIVERY_FEE = 29;

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    hydrated,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();

  const {
  appliedCoupon,
  hydrated: couponHydrated,
} = useCoupon();

const couponDiscount =
  appliedCoupon?.discountAmount ?? 0;

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const totalMrp = items.reduce(
    (total, item) => total + item.product.mrp * item.quantity,
    0
  );

  const savings = Math.max(totalMrp - subtotal, 0);

  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_MINIMUM ? 0 : DELIVERY_FEE;

  const finalTotal = Math.max(
  subtotal + deliveryFee - couponDiscount,
  0
);

  const amountForFreeDelivery = Math.max(
    FREE_DELIVERY_MINIMUM - subtotal,
    0
  );

 if (!hydrated || !couponHydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-8">
          <div className="h-72 animate-pulse rounded-[24px] border border-[var(--border)] bg-white" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="Back to home"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--primary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[30px]">
                  Your cart
                </h1>

                <p className="mt-0.5 text-xs text-[var(--text-muted)] sm:text-sm">
                  {totalItems} {totalItems === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--danger)] transition hover:bg-red-50"
              >
                Clear cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <section className="flex min-h-[460px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 py-12 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
                <ShoppingBag size={36} />
              </span>

              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                Your cart is empty
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Add groceries, fresh produce and daily essentials to continue
                shopping.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
              >
                Start shopping
              </Link>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
                    <Clock3 size={18} className="text-[var(--primary)]" />
                    Delivery in 10–20 minutes
                  </div>

                  {amountForFreeDelivery > 0 ? (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--text-secondary)]">
                          Add {formatPrice(amountForFreeDelivery)} more for free
                          delivery
                        </span>

                        <span className="font-bold text-[var(--primary)]">
                          {Math.min(
                            Math.round(
                              (subtotal / FREE_DELIVERY_MINIMUM) * 100
                            ),
                            100
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all"
                          style={{
                            width: `${Math.min(
                              (subtotal / FREE_DELIVERY_MINIMUM) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-[var(--success)]">
                      Free delivery unlocked
                    </p>
                  )}
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {items.map(({ product, quantity, variantId, variantName }) => (
                    <article
                      key={`${product.id}-${variantId ?? "default"}`}
                      className="flex gap-3 p-4 sm:gap-4 sm:p-5"
                    >
                      <Link
                        href={`/product/${product.slug}`}
                        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-soft)] sm:h-28 sm:w-28"
                      >
                        {product.image && !failedImages[product.id] ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="112px"
                            className="object-contain p-3"
                            onError={() =>
                              setFailedImages((current) => ({
                                ...current,
                                [product.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <span className="text-[46px]" aria-hidden="true">
                            {product.fallbackIcon}
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {product.brand}
                        </p>

                        <Link href={`/product/${product.slug}`}>
                          <h2 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-[var(--text-primary)] sm:text-base">
                            {product.name}
                          </h2>
                        </Link>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {variantName || product.unit.label}
                        </p>

                        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-base font-black text-[var(--text-primary)]">
                              {formatPrice(product.price * quantity)}
                            </p>

                            {product.mrp > product.price && (
                              <p className="mt-0.5 text-[10px] text-[var(--text-muted)] line-through">
                                {formatPrice(product.mrp * quantity)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <QuantitySelector
                              quantity={quantity}
                              max={product.stock}
                              onIncrease={() => increaseItem(product.id, variantId)}
                              onDecrease={() => decreaseItem(product.id, variantId)}
                            />

                            <button
                              type="button"
                              onClick={() => removeItem(product.id, variantId)}
                              aria-label={`Remove ${product.name}`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-[var(--danger)]"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="lg:sticky lg:top-[104px] lg:self-start">
                <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                  <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--text-primary)]">
                    Bill details
                  </h2>

                  <div className="mt-5">
 
</div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--text-secondary)]">
                        Item total
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-secondary)]">
                          Product savings
                        </span>

                        {couponDiscount > 0 && (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[var(--text-secondary)]">
      Coupon discount
    </span>

    <span className="font-bold text-[var(--success)]">
      -{formatPrice(couponDiscount)}
    </span>
  </div>
)}

                        <span className="font-bold text-[var(--success)]">
                          -{formatPrice(savings)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--text-secondary)]">
                        Delivery fee
                      </span>

                      {deliveryFee === 0 ? (
                        <span className="font-bold text-[var(--success)]">
                          FREE
                        </span>
                      ) : (
                        <span className="font-semibold text-[var(--text-primary)]">
                          {formatPrice(deliveryFee)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="my-5 border-t border-dashed border-[var(--border-strong)]" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-black text-[var(--text-primary)]">
                      To pay
                    </span>
                    <span className="text-xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  {savings > 0 && (
                    <div className="mt-4 rounded-xl bg-[var(--primary-light)] px-3 py-2.5 text-xs font-bold text-[var(--primary)]">
                      You save {formatPrice(savings)} on this order
                    </div>
                  )}

                  <Link
                    href="/checkout"
                    className="mt-5 flex h-[52px] items-center justify-between rounded-2xl bg-[var(--primary)] px-5 text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
                  >
                    <span>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                        Total
                      </span>
                      <span className="block text-sm font-black">
                        {formatPrice(finalTotal)}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5 text-sm font-black">
                      Proceed
                      <ChevronRight size={18} />
                    </span>
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
