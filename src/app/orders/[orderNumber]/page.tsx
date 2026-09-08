"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Download,
  MessageSquare,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteStoredOrder,
  getOrderByNumber,
  rateStoredOrder,
} from "@/lib/orders";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import { formatPrice } from "@/lib/utils";
import ProductDrawer from "@/components/product/ProductDrawer";
import TaxInvoiceModal from "@/components/orders/TaxInvoiceModal";
import type { BootkitOrder } from "@/types/order";
import type { Product } from "@/types/product";

export default function OrderDetailsPage() {
  const router = useRouter();
  const { addItems } = useCart();
  const { addNotification } = useNotifications();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber || "");

  const [order, setOrder] = useState<BootkitOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (orderNumber) {
      const found = getOrderByNumber(orderNumber);
      setOrder(found ?? null);
      if (found?.rating) {
        setSelectedStars(found.rating.stars || 5);
        setSelectedTags(found.rating.tags || []);
        setRatingComment(found.rating.feedback || "");
      }
    }
    setHydrated(true);
  }, [orderNumber]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyOrderId = () => {
    if (!order) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      showToast("Order ID copied to clipboard!");
    }
  };

  const handleDeleteOrder = () => {
    if (!order) return;
    const confirmed = window.confirm(`Delete order #${order.orderNumber}?`);
    if (!confirmed) return;

    deleteStoredOrder(order.orderNumber);
    showToast("Order deleted.");
    setTimeout(() => {
      router.push("/orders");
    }, 400);
  };

  const reorderItems = () => {
    if (!order || !order.items || order.items.length === 0) return;

    addItems(order.items);
    addNotification({
      type: "ORDER",
      title: "Items reordered",
      message: `${order.items.length} items from order #${order.orderNumber} added to your cart.`,
      href: "/checkout",
    });

    showToast("Items added to cart! Redirecting to checkout...");
    setTimeout(() => {
      router.push("/checkout?from=orders");
    }, 400);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingSubmit = () => {
    if (!order) return;

    const updated = rateStoredOrder(order.orderNumber, {
      stars: selectedStars,
      feedback: ratingComment,
      tags: selectedTags,
    });

    if (updated) {
      setOrder(updated);
      showToast("Thank you for your rating!");
    }

    setShowRatingModal(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <Link
              href="/orders"
              aria-label="Back to orders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            >
              <ArrowLeft size={19} />
            </Link>
            <div className="h-5 w-32 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </header>
        <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <Link
              href="/orders"
              aria-label="Back to orders"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            >
              <ArrowLeft size={19} />
            </Link>
            <h1 className="text-lg font-black tracking-tight text-gray-900">
              Order not found
            </h1>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-gray-500">
            This order could not be found or has been removed.
          </p>
          <Link
            href="/orders"
            className="mt-4 inline-block rounded-2xl bg-[#16A34A] px-6 py-2.5 text-xs font-black text-white hover:bg-[#15803D]"
          >
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = new Date(order.createdAt);
  const formattedTime = createdAt.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedDate = createdAt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

  const totalMrp = order.items.reduce(
    (total, item) => total + (item.product.mrp || item.product.price) * item.quantity,
    0
  );
  const productDiscount = Math.max(totalMrp - order.itemTotal, 0);
  const handlingCharge = (order as { handlingCharge?: number }).handlingCharge ?? 9;

  const addressString = [
    order.address?.houseNumber,
    order.address?.street,
    order.address?.area,
    order.address?.city,
    order.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1E293B]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transform animate-bounce rounded-full bg-[#16A34A] px-5 py-2.5 text-xs font-bold text-white shadow-lg">
          ✓ {toastMessage}
        </div>
      )}

      {/* Top Header Bar with Back and Delete/Trash icons */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/orders"
            aria-label="Back to orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 active:scale-95"
          >
            <ArrowLeft size={20} />
          </Link>

          <button
            type="button"
            onClick={handleDeleteOrder}
            aria-label="Delete order"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
          >
            <Trash2 size={19} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 space-y-4 pb-32">
        {/* Order Summary & Status Header */}
        <div className="pt-1">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Order summary
          </h1>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-500">
              {order.status === "Delivered"
                ? `Arrived at ${formattedTime}`
                : `Order placed at ${formattedTime}`}
            </p>

            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#16A34A] transition hover:underline"
            >
              <span>Download Invoice</span>
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Items Section */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {order.items.length}{" "}
            {order.items.length === 1 ? "item" : "items"} in this order
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] divide-y divide-gray-100">
            {order.items.map((item, idx) => {
              const img =
                item.product.thumbnail ||
                item.product.image ||
                item.product.images?.[0] ||
                "";
              const unitLabel =
                typeof item.product.unit === "object"
                  ? item.product.unit?.label
                  : item.product.unit || "";

              return (
                <div
                  key={`${item.product.id}-${idx}`}
                  onClick={() => setSelectedProduct(item.product)}
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 p-3.5 text-left transition hover:bg-gray-50/80 active:bg-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAFC] p-1">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={item.product.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className="hidden h-full w-full items-center justify-center text-xl"
                        style={{ display: img ? "none" : "flex" }}
                      >
                        {item.product.fallbackIcon || "🛍️"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-bold text-gray-900 sm:text-sm">
                        {item.product.name}
                      </p>
                      {unitLabel && (
                        <p className="text-[11px] font-medium text-gray-500">
                          {unitLabel}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs font-bold text-gray-800">
                        {formatPrice(item.product.price * item.quantity)} •{" "}
                        {item.quantity} {item.quantity === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="shrink-0 text-gray-400" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Rating Card */}
        <section className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Star size={20} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">
                How were your ordered items?
              </p>
              <p className="text-[11px] font-medium text-gray-500">
                {order.rating
                  ? `You rated this order ${order.rating.stars} ★`
                  : "Rate your items & delivery experience"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRatingModal(true)}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            {order.rating ? "Edit rating" : "Rate now"}
          </button>
        </section>

        {/* Bill Details Card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <h2 className="mb-3 text-sm font-black text-gray-900">
            Bill details
          </h2>

          <div className="space-y-2 text-xs font-medium text-gray-600">
            <div className="flex justify-between">
              <span>MRP</span>
              <span className="text-gray-900">{formatPrice(totalMrp)}</span>
            </div>

            {productDiscount > 0 && (
              <div className="flex justify-between text-[#16A34A] font-semibold">
                <span>Product discount</span>
                <span>- {formatPrice(productDiscount)}</span>
              </div>
            )}

            {order.offerDiscount ? (
              <div className="flex justify-between text-[#16A34A] font-semibold">
                <span>Coupon discount</span>
                <span>- {formatPrice(order.offerDiscount)}</span>
              </div>
            ) : null}

            <div className="flex justify-between">
              <span>Handling charge</span>
              <span className="text-gray-900">+ {formatPrice(handlingCharge)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery charges</span>
              {order.deliveryFee === 0 ? (
                <span className="font-bold text-[#16A34A]">FREE</span>
              ) : (
                <span className="text-gray-900">
                  {formatPrice(order.deliveryFee)}
                </span>
              )}
            </div>

            <div className="border-t border-gray-100 pt-2.5 flex justify-between text-sm font-black text-gray-900">
              <span>Bill total</span>
              <span className="text-base">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* Order Details Card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
          <h2 className="text-sm font-black text-gray-900">
            Order details
          </h2>

          <div className="space-y-2.5 text-xs">
            {/* Order ID */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Order id</span>
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <span>#{order.orderNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  aria-label="Copy order number"
                  className="rounded p-1 text-[#16A34A] hover:bg-green-50"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Payment</span>
              <span className="font-bold text-gray-900">
                {(order.paymentMethod as string) === "COD" || (order.paymentMethod as string) === "cash"
                  ? "Cash on Delivery"
                  : "Paid Online"}
              </span>
            </div>

            {/* Deliver To */}
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500 font-medium shrink-0">Deliver to</span>
              <span className="font-medium text-right text-gray-900 line-clamp-2">
                {order.address?.fullName ? `${order.address.fullName}, ` : ""}
                {addressString || "Delivery address"}
              </span>
            </div>

            {/* Order Placed */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Order placed</span>
              <span className="font-medium text-gray-700">
                placed on {formattedDate}, {formattedTime}
              </span>
            </div>
          </div>
        </section>

        {/* Chat with us / Need Help Card */}
        <a
          href={`https://wa.me/919999999999?text=Hi%20BootKiT%20Support,%20I%20need%20help%20with%20order%20%23${order.orderNumber}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#16A34A]">
              <MessageSquare size={19} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">
                Chat with us
              </p>
              <p className="text-[11px] font-medium text-gray-500">
                About any issues related to your order
              </p>
            </div>
          </div>

          <ChevronRight size={18} className="shrink-0 text-gray-400" />
        </a>
      </main>

      {/* Sticky Bottom Action Bar - Repeat Order */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200/80 bg-white/95 p-3 backdrop-blur-md sm:p-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={reorderItems}
            className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#16A34A] py-3.5 px-4 text-center text-white shadow-lg shadow-green-600/20 transition hover:bg-[#15803D] active:scale-[0.99]"
          >
            <span className="text-sm font-black tracking-wide leading-tight sm:text-base">
              Repeat Order
            </span>
            <span className="mt-0.5 text-[10px] font-bold tracking-wider opacity-90 uppercase">
              VIEW CART ON NEXT STEP
            </span>
          </button>
        </div>
      </div>

      {/* Product Preview Drawer */}
      <ProductDrawer
        open={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Tax Invoice Modal */}
      {showInvoice && (
        <TaxInvoiceModal
          order={order}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Rate your order
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Order #{order.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stars */}
            <div className="my-6 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  className="transition hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= selectedStars
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Tags */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                What did you like?
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "⚡ Fast delivery",
                  "🍎 Fresh items",
                  "📦 Good packaging",
                  "🛵 Polite rider",
                  "💯 Accurate order",
                ].map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-[#16A34A] text-white"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Leave feedback about your delivery (optional)..."
                rows={3}
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:border-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRatingSubmit}
                className="flex-1 rounded-xl bg-[#16A34A] py-3 text-xs font-bold text-white shadow-sm shadow-green-600/20 hover:bg-[#15803D]"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
