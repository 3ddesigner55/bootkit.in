"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronRight,
  Copy,
  Gift,
  ShoppingBag,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { getActiveCoupons } from "@/data/coupons";
import { formatPrice } from "@/lib/utils";
import type { Coupon } from "@/types/coupon";

export default function OffersPage() {
  const coupons = getActiveCoupons();
  const [copiedCode, setCopiedCode] = useState("");

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      window.setTimeout(() => {
        setCopiedCode("");
      }, 1800);
    } catch {
      setCopiedCode("");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Offers & coupons
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Save more on your BootKiT orders
              </p>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[28px] bg-[var(--primary)] px-5 py-7 text-white shadow-[var(--shadow-md)] sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white/15">
                <Gift size={27} />
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/65">
                  BootKiT savings
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Great deals for every order
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-white/75 sm:text-sm">
                  Copy a coupon code and apply it from your Cart or Checkout
                  page.
                </p>
              </div>
            </div>

            <Link
              href="/cart"
              className="relative mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-black px-4 text-xs font-black text-[var(--primary)]"
            >
              <ShoppingBag size={16} />
              Open cart
              <ChevronRight size={15} />
            </Link>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                  Available coupons
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {coupons.length} active offers
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                <Sparkles size={18} />
              </span>
            </div>

            {coupons.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    copied={copiedCode === coupon.code}
                    onCopy={() => copyCoupon(coupon.code)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[var(--border-strong)] bg-white px-5 text-center">
                <TicketPercent
                  size={36}
                  className="text-[var(--text-muted)]"
                />

                <h3 className="mt-4 text-lg font-black text-[var(--text-primary)]">
                  No active offers
                </h3>

                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  New offers will appear here.
                </p>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              How to use a coupon
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Instruction
                number="1"
                title="Copy coupon"
                description="Choose an available offer and copy its code."
              />

              <Instruction
                number="2"
                title="Open cart"
                description="Add eligible products and go to your cart."
              />

              <Instruction
                number="3"
                title="Apply code"
                description="Enter the code and confirm the discounted total."
              />
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}

function CouponCard({
  coupon,
  copied,
  onCopy,
}: {
  coupon: Coupon;
  copied: boolean;
  onCopy: () => void;
}) {
  const discountText =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% OFF`
      : `${formatPrice(coupon.discountValue)} OFF`;

  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-4 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
          <BadgePercent size={23} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--success)]">
            {discountText}
          </p>

          <h3 className="mt-1 text-base font-black text-[var(--text-primary)]">
            {coupon.title}
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">
            {coupon.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[9px] font-bold text-[var(--text-secondary)]">
              Min. order {formatPrice(coupon.minimumOrder)}
            </span>

            {coupon.maximumDiscount && (
              <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[9px] font-bold text-[var(--text-secondary)]">
                Max saving {formatPrice(coupon.maximumDiscount)}
              </span>
            )}

            {coupon.firstOrderOnly && (
              <span className="rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-[9px] font-black text-[var(--warning)]">
                First order only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-4">
        <span className="rounded-lg border border-dashed border-[var(--primary)] bg-white px-3 py-2 text-xs font-black tracking-[0.1em] text-[var(--primary)]">
          {coupon.code}
        </span>

        <button
          type="button"
          onClick={onCopy}
          className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${
            copied
              ? "bg-green-50 text-[var(--success)]"
              : "bg-[var(--primary)] text-white"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </article>
  );
}

function Instruction({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-soft)] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-xs font-black text-white">
        {number}
      </span>

      <div>
        <p className="text-sm font-black text-[var(--text-primary)]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}