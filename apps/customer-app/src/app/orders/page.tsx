"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  HelpCircle,
  MoreVertical,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CustomerAuthGuard from "@/components/auth/CustomerAuthGuard";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import { formatPrice } from "@/lib/utils";
import { getStoredOrders, rateStoredOrder } from "@/lib/orders";
import TaxInvoiceModal from "@/components/orders/TaxInvoiceModal";
import type { BootkitOrder } from "@/types/order";

export default function OrdersPage() {
  const router = useRouter();
  const { addItems } = useCart();
  const { addNotification } = useNotifications();

  const [orders, setOrders] = useState<BootkitOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuOrder, setActiveMenuOrder] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<BootkitOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<BootkitOrder | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getStoredOrders());
    setHydrated(true);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleReorder = (order: BootkitOrder) => {
    if (!order.items || order.items.length === 0) return;

    addItems(order.items);
    addNotification({
      type: "ORDER",
      title: "Items reordered",
      message: `${order.items.length} items added to your cart.`,
      href: "/cart",
    });

    showToast("Items added to cart! Redirecting to cart...");
    setTimeout(() => {
      router.push("/cart?from=orders");
    }, 500);
  };

  const openRatingModal = (order: BootkitOrder) => {
    setRatingOrder(order);
    setSelectedStars(order.rating?.stars || 5);
    setSelectedTags(order.rating?.tags || []);
    setRatingComment(order.rating?.feedback || "");
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingSubmit = () => {
    if (!ratingOrder) return;

    const updated = rateStoredOrder(ratingOrder.orderNumber, {
      stars: selectedStars,
      feedback: ratingComment,
      tags: selectedTags,
    });

    if (updated) {
      setOrders(getStoredOrders());
      showToast(`Thank you! Order #${ratingOrder.orderNumber} rated successfully.`);
    }

    setRatingOrder(null);
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();

    return orders.filter((order) => {
      const orderMatch = order.orderNumber.toLowerCase().includes(q);
      const totalMatch = order.totalAmount.toString().includes(q);
      const itemMatch = order.items.some((item) =>
        item.product.name.toLowerCase().includes(q)
      );
      const dateMatch = new Date(order.createdAt)
        .toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .toLowerCase()
        .includes(q);

      return orderMatch || totalMatch || itemMatch || dateMatch;
    });
  }, [orders, searchQuery]);

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-[#F8FAF8] text-[#1E293B]">
        {/* Toast popup */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform animate-bounce rounded-full bg-[#16A34A] px-5 py-2.5 text-xs font-bold text-white shadow-lg">
            ✓ {toastMessage}
          </div>
        )}

        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/account")}
              aria-label="Back to account"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                Order History
              </h1>
              <p className="text-[11px] font-medium text-gray-500">
                {orders.length} {orders.length === 1 ? "order" : "orders"} placed
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
          {/* Search Bar */}
          <div className="relative mb-5">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your orders"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {!hydrated ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#16A34A]">
                <ShoppingBag size={32} />
              </div>
              <h2 className="mt-4 text-lg font-black text-gray-900">
                {searchQuery ? "No matching orders" : "No orders yet"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {searchQuery
                  ? `No orders found matching "${searchQuery}"`
                  : "Your placed orders will show up here."}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                  Clear search
                </button>
              ) : (
                <Link
                  href="/"
                  className="mt-5 rounded-2xl bg-[#16A34A] px-6 py-2.5 text-xs font-black text-white hover:bg-[#15803D]"
                >
                  Start Shopping
                </Link>
              )}
            </div>
          ) : (
            /* Order Cards List */
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const createdAt = new Date(order.createdAt);
                const formattedDate = createdAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                // Format delivery title
                let deliveryTitle = "Order Placed";
                if (order.status === "Delivered") {
                  const mins = order.deliveryMinutes || 6;
                  deliveryTitle = `Arrived in ${mins} minutes`;
                } else if (order.status === "Cancelled") {
                  deliveryTitle = "Order Cancelled";
                } else if (order.status === "Out for Delivery") {
                  deliveryTitle = "Out for delivery now";
                } else {
                  deliveryTitle = order.status;
                }

                return (
                  <article
                    key={order.id || order.orderNumber}
                    className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-5"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Green Check Badge */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                            order.status === "Cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-[#E8F8EE] text-[#16A34A]"
                          }`}
                        >
                          {order.status === "Cancelled" ? (
                            <X size={20} strokeWidth={2.5} />
                          ) : (
                            <Check size={20} strokeWidth={2.5} />
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                            {deliveryTitle}
                          </h2>
                          <p className="mt-0.5 text-xs font-medium text-gray-500">
                            {formatPrice(order.totalAmount)} • {formattedDate}
                          </p>
                        </div>
                      </div>

                      {/* 3-dots Menu Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuOrder(
                              activeMenuOrder === order.orderNumber
                                ? null
                                : order.orderNumber
                            )
                          }
                          aria-label="Order actions"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* 3-dots Dropdown Menu */}
                        {activeMenuOrder === order.orderNumber && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuOrder(null)}
                            />
                            <div className="absolute right-0 top-9 z-50 w-44 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                              <Link
                                href={`/orders/${order.orderNumber}`}
                                onClick={() => setActiveMenuOrder(null)}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <FileText size={15} className="text-gray-400" />
                                View details
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuOrder(null);
                                  setInvoiceOrder(order);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              >
                                  <CheckCircle2
                                  size={15}
                                  className="text-gray-400"
                                />
                                Download invoice
                              </button>
                              <a
                                href="https://wa.me/919999999999"
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActiveMenuOrder(null)}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <HelpCircle
                                  size={15}
                                  className="text-gray-400"
                                />
                                Need help?
                              </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Product Thumbnails Row */}
                  <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {order.items.map((item, idx) => {
                      const img =
                        item.product.thumbnail ||
                        item.product.image ||
                        item.product.images?.[0] ||
                        "";

                      return (
                        <div
                          key={`${item.product.id}-${idx}`}
                          title={`${item.product.name} (x${item.quantity})`}
                          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAFC] p-1.5 sm:h-18 sm:w-18"
                        >
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

                          {item.quantity > 1 && (
                            <span className="absolute bottom-1 right-1 rounded-md bg-gray-900/80 px-1 py-0.2 text-[9px] font-black text-white">
                              {item.quantity}x
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {order.items.length > 5 && (
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 hover:bg-gray-100"
                      >
                        +{order.items.length - 5}
                      </Link>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-800 transition hover:bg-gray-50 active:scale-98 sm:text-sm"
                    >
                      <RotateCcw size={14} className="text-gray-500" />
                      Reorder
                    </button>

                    <button
                      type="button"
                      onClick={() => openRatingModal(order)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] py-2.5 text-xs font-bold text-white shadow-sm shadow-green-600/20 transition hover:bg-[#15803D] active:scale-98 sm:text-sm"
                    >
                      <Star size={14} className="fill-amber-300 text-amber-300" />
                      {order.rating ? `Rated (${order.rating.stars}★)` : "Rate order"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Rate Order Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Rate your order
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Order #{ratingOrder.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRatingOrder(null)}
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
                onClick={() => setRatingOrder(null)}
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

      {/* Tax Invoice Modal */}
      {invoiceOrder && (
        <TaxInvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
    </CustomerAuthGuard>
  );
}