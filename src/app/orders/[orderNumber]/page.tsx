"use client";

import { cancelStoredOrder } from "@/lib/orders";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  RotateCcw,
  XCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { getOrderByNumber } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { BootkitOrder } from "@/types/order";

const orderSteps: BootkitOrder["status"][] = [
  "Placed",
  "Confirmed",
  "Packing",
  "Out for Delivery",
  "Delivered",
];

export default function OrderDetailsPage() {
  const router = useRouter();
const { addItems } = useCart();
const { addNotification } = useNotifications();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);

  const [order, setOrder] = useState<BootkitOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const cancelOrder = () => {
  if (!order) return;

  const confirmed = window.confirm(
    `Cancel order ${order.orderNumber}?`
  );

  if (!confirmed) return;

  const updatedOrder = cancelStoredOrder(order.orderNumber);

  if (!updatedOrder) return;

  setOrder(updatedOrder);

  addNotification({
    type: "ORDER",
    title: "Order cancelled",
    message: `Your order ${order.orderNumber} has been cancelled.`,
    href: `/orders/${order.orderNumber}`,
  });
};

const reorderItems = () => {
  if (!order) return;

  addItems(order.items);

  addNotification({
    type: "ORDER",
    title: "Items added to cart",
    message: `${order.items.length} products from order ${order.orderNumber} were added to your cart.`,
    href: "/cart",
  });

  router.push("/cart");
};

  useEffect(() => {
    setOrder(getOrderByNumber(orderNumber) ?? null);
    setHydrated(true);
  }, [orderNumber]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="print:hidden">
  <Header />
</div>

        <Container className="py-8">
          <div className="h-[560px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
       <div className="print:hidden">
  <Header />
</div>

        <Container className="py-8">
          <section className="flex min-h-[440px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center">
            <Package size={42} className="text-[var(--primary)]" />

            <h1 className="mt-5 text-2xl font-black text-[var(--text-primary)]">
              Order not found
            </h1>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This order is not available on this device.
            </p>

            <Link
              href="/orders"
              className="mt-6 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white"
            >
              View all orders
            </Link>
          </section>
        </Container>
      </div>
    );
  }

   const currentStep = orderSteps.indexOf(order.status);
  const createdAt = new Date(order.createdAt);

  const totalMrp = order.items.reduce(
    (total, item) =>
      total + item.product.mrp * item.quantity,
    0
  );

  const productDiscount = Math.max(
    totalMrp - order.itemTotal,
    0
  );

  const offerDiscount = order.offerDiscount ?? 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
       <Container className="py-5 sm:py-8">
          <div className="mb-6 flex items-center gap-3 print:hidden">
            <Link
              href="/orders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Order details
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                {order.orderNumber}
              </p>
            </div>
          </div>

<section className="mb-5 hidden border-b border-[var(--border)] pb-5 print:block">
  <div className="flex items-start justify-between gap-6">
    <div>
      <h1 className="text-3xl font-black text-black">
        BootKiT Invoice
      </h1>

      <p className="mt-1 text-sm text-gray-600">
        Fast local delivery
      </p>
    </div>

    <div className="text-right text-sm text-gray-700">
      <p>
        <span className="font-bold">Invoice No:</span>{" "}
        {order.orderNumber}
      </p>

      <p className="mt-1">
        <span className="font-bold">Date:</span>{" "}
        {createdAt.toLocaleDateString("en-IN")}
      </p>
    </div>
  </div>
</section>

          <div className="grid gap-5 print:block lg:grid-cols-[minmax(0,1fr)_370px]">
            <div className="space-y-5">
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      Current status
                    </p>

                    <h2 className="mt-1 text-xl font-black text-[var(--primary)]">
                      {order.status}
                    </h2>
                  </div>

                  <div className="text-right">
                    <p className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <CalendarDays size={14} />
                      {createdAt.toLocaleDateString("en-IN")}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Clock3 size={14} />
                      {createdAt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {order.status !== "Cancelled" ? (
                  <div className="mt-7 grid grid-cols-5 gap-1">
                    {orderSteps.map((step, index) => {
                      const completed = index <= currentStep;

                      return (
                        <div key={step} className="min-w-0 text-center">
                          <div className="flex items-center">
                            <div
                              className={`h-1 flex-1 ${
                                index === 0
                                  ? "bg-transparent"
                                  : completed
                                    ? "bg-[var(--primary)]"
                                    : "bg-[var(--surface-muted)]"
                              }`}
                            />

                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                                completed
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                  : "border-[var(--border-strong)] bg-white text-[var(--text-muted)]"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 size={15} />
                              ) : (
                                <span className="text-[10px] font-black">
                                  {index + 1}
                                </span>
                              )}
                            </span>

                            <div
                              className={`h-1 flex-1 ${
                                index === orderSteps.length - 1
                                  ? "bg-transparent"
                                  : index < currentStep
                                    ? "bg-[var(--primary)]"
                                    : "bg-[var(--surface-muted)]"
                              }`}
                            />
                          </div>

                          <p className="mt-2 truncate text-[9px] font-bold text-[var(--text-secondary)] sm:text-[10px]">
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    This order has been cancelled.
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-black text-[var(--text-primary)]">
                    <Package size={19} className="text-[var(--primary)]" />
                    Ordered items
                  </h2>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {order.items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-4">
  <span
    role="img"
    aria-label={product.name}
    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-3xl"
  >
    {product.fallbackIcon}
  </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {product.brand}
                        </p>

                        <h3 className="mt-1 line-clamp-2 text-sm font-black text-[var(--text-primary)]">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {product.unit.label} · Qty {quantity}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-[var(--text-primary)]">
                          {formatPrice(product.price * quantity)}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          {formatPrice(product.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <h2 className="flex items-center gap-2 text-lg font-black text-[var(--text-primary)]">
                  <MapPin size={19} className="text-[var(--primary)]" />
                  Delivery address
                </h2>

                <div className="mt-4 rounded-2xl bg-[var(--surface-soft)] p-4">
                  <p className="text-sm font-black text-[var(--text-primary)]">
                    {order.address.fullName}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[var(--primary)]">
                    {order.address.addressType}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {order.address.houseNumber}, {order.address.street},{" "}
                    {order.address.area}
                    {order.address.landmark
                      ? `, ${order.address.landmark}`
                      : ""}
                    <br />
                    {order.address.city}, {order.address.state} -{" "}
                    {order.address.pincode}
                  </p>

                  <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                    +91 {order.address.phone}
                  </p>
                </div>
              </section>
            </div>

            <aside className="space-y-5 print:mt-5 lg:sticky lg:top-[104px] lg:self-start">
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <h2 className="flex items-center gap-2 text-lg font-black text-[var(--text-primary)]">
                  <ReceiptText
                    size={19}
                    className="text-[var(--primary)]"
                  />
                  Bill summary
                </h2>

                <div className="mt-5 space-y-3 text-sm">
                                    <BillRow
                    label="Item total"
                    value={formatPrice(totalMrp)}
                  />

                  {productDiscount > 0 && (
                    <BillRow
                      label="Product discount"
                      value={`-${formatPrice(productDiscount)}`}
                      success
                    />
                  )}

                  {offerDiscount > 0 && (
                    <BillRow
                      label={
                        order.offerCode
                          ? `Offer discount (${order.offerCode})`
                          : "Offer discount"
                      }
                      value={`-${formatPrice(offerDiscount)}`}
                      success
                    />
                  )}

                  <BillRow
  label="Delivery fee"
  value={
    order.deliveryFee === 0
      ? "FREE"
      : formatPrice(order.deliveryFee)
  }
  success={order.deliveryFee === 0}
/>
                </div>

                <div className="my-5 border-t border-dashed border-[var(--border-strong)]" />

                <div className="flex items-center justify-between">
                  <span className="font-black text-[var(--text-primary)]">
                    {order.paymentMethod === "COD"
  ? "Order total"
  : "Total paid"}
                  </span>

                  <span className="text-xl font-black text-[var(--text-primary)]">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <h2 className="text-lg font-black text-[var(--text-primary)]">
                  Payment
                </h2>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)]">
                    {order.paymentMethod === "COD" ? (
                      <Banknote size={20} />
                    ) : (
                      <CreditCard size={20} />
                    )}
                  </span>

                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : "Manual UPI"}
                    </p>

                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>

                {order.upiTransactionId && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      UPI transaction ID
                    </p>

                    <p className="mt-1 break-all text-xs font-black text-[var(--text-primary)]">
                      {order.upiTransactionId}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-[var(--text-muted)]">
                  <ShieldCheck
                    size={14}
                    className="text-[var(--primary)]"
                  />
                  Order data is stored locally on this device
                </div>
              </section>
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] print:hidden">
  <h2 className="text-lg font-black text-[var(--text-primary)]">
    Order actions
  </h2>

  <button
    type="button"
    onClick={reorderItems}
    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white"
  >
    <RotateCcw size={17} />
    Reorder items
  </button>

<button
  type="button"
  onClick={() => window.print()}
  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white text-sm font-black text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
>
  <ReceiptText size={17} />
  Download invoice
</button>

  {order.status === "Placed" && (
    <button
      type="button"
      onClick={cancelOrder}
      className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-black text-[var(--danger)]"
    >
      <XCircle size={17} />
      Cancel order
    </button>
  )}

  {order.status !== "Placed" &&
    order.status !== "Cancelled" && (
      <p className="mt-3 text-center text-[10px] leading-4 text-[var(--text-muted)]">
        This order can no longer be cancelled from the app.
      </p>
    )}
</section>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}

function BillRow({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--text-secondary)]">{label}</span>

      <span
        className={`font-bold ${
          success
            ? "text-[var(--success)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
