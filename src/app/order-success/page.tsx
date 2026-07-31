"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  ReceiptText,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { formatPrice } from "@/lib/utils";
import { getStoredOrders } from "@/lib/orders";
import type { BootkitOrder } from "@/types/order";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const [order, setOrder] = useState<BootkitOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedOrder =
      getStoredOrders().find(
        (item) => item.orderNumber === orderNumber
      ) ?? null;

    setOrder(storedOrder);
    setHydrated(true);
  }, [orderNumber]);

  if (!hydrated) {
    return <SuccessLoading />;
  }

  const isUpiOrder = order?.paymentMethod === "UPI";

  const paymentStatus = isUpiOrder
    ? order?.paymentStatus || "Verification Pending"
    : "Cash on Delivery";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
                <Container className="py-6 sm:py-12">
          <CheckoutSuccessProgress />

          <section className="mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
            <div className="bg-[var(--primary-light)] px-5 py-9 text-center sm:px-8 sm:py-11">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-md)]">
                <CheckCircle2 size={42} strokeWidth={2.4} />
              </span>

              <h1 className="mt-6 text-[28px] font-black tracking-[-0.045em] text-[var(--text-primary)] sm:text-[38px]">
                Order placed successfully
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                {isUpiOrder
                  ? "Your order has been received. Payment verification is currently pending."
                  : "Your BootKiT order has been received and will be confirmed shortly."}
              </p>
            </div>

            <div className="p-4 sm:p-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Order number
                </p>

                <p className="mt-2 break-all text-xl font-black text-[var(--primary)]">
                  {orderNumber || "Order created"}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={<Clock3 size={21} />}
                  label="Estimated delivery"
                  value="10–20 minutes"
                />

                <InfoCard
                  icon={<PackageCheck size={21} />}
                  label="Order status"
                  value={order?.status || "Placed"}
                />

                <InfoCard
                  icon={<CreditCard size={21} />}
                  label="Payment"
                  value={paymentStatus}
                />

                <InfoCard
                  icon={<ReceiptText size={21} />}
                  label="Total amount"
                  value={
                    order
                      ? formatPrice(order.totalAmount)
                      : "Order saved"
                  }
                />
              </div>

              {isUpiOrder && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <p className="text-sm font-black text-amber-900">
                        Payment verification pending
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Your submitted UTR will be checked before the
                        payment is marked as verified.
                      </p>

                      {order?.upiTransactionId && (
                        <p className="mt-2 text-xs font-bold text-amber-900">
                          UTR: {order.upiTransactionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {order?.address && (
                <div className="mt-4 rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                      <MapPin size={19} />
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--text-primary)]">
                        Delivery address
                      </p>

                      <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                        {order.address.fullName}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                        {order.address.houseNumber},{" "}
                        {order.address.street},{" "}
                        {order.address.area}
                        {order.address.landmark
                          ? `, ${order.address.landmark}`
                          : ""}
                      </p>

                      <p className="text-xs leading-5 text-[var(--text-secondary)]">
                        {order.address.city},{" "}
                        {order.address.state} -{" "}
                        {order.address.pincode}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                        Mobile: {order.address.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {orderNumber && (
  <Link
    href={`/orders/${encodeURIComponent(orderNumber)}`}
    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-black text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
  >
    <ReceiptText size={17} />
    View invoice
  </Link>
)}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={
                    orderNumber
                      ? `/orders/${encodeURIComponent(orderNumber)}`
                      : "/orders"
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--primary-hover)]"
                >
                  Track order
                  <ChevronRight size={18} />
                </Link>

                <Link
                  href="/"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-black text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                >
                  <Home size={17} />
                  Continue shopping
                </Link>
              </div>

              <Link
                href="/orders"
                className="mt-3 flex h-11 w-full items-center justify-center text-xs font-black text-[var(--primary)]"
              >
                View all orders
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}

function CheckoutSuccessProgress() {
  const steps = [
    {
      number: 1,
      label: "Delivery Address",
      completed: true,
    },
    {
      number: 2,
      label: "Payment",
      completed: true,
    },
    {
      number: 3,
      label: "Success",
      completed: false,
    },
  ];

  return (
    <section className="mx-auto mb-6 max-w-2xl rounded-2xl border border-[var(--border)] bg-white px-4 py-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const active = step.number === 3;

          return (
            <div
              key={step.number}
              className="flex flex-1 items-start"
            >
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                    step.completed || active
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  {step.completed ? "✓" : step.number}
                </div>

                <span
                  className={`mt-2 text-center text-[10px] font-bold sm:text-xs ${
                    step.completed || active
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-2 mt-[17px] h-0.5 flex-1 bg-[var(--primary)]" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoCard({
  icon,
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[var(--text-muted)]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-black text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function SuccessLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <Container className="py-8 sm:py-14">
        <div className="mx-auto h-[620px] max-w-2xl animate-pulse rounded-[30px] border border-[var(--border)] bg-white" />
      </Container>
    </div>
  );
}