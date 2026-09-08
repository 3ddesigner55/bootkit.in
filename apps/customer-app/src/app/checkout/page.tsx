"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Bike,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Home,
  Mic,
  PackageCheck,
  PhoneOff,
  Plus,
  Receipt,
  Search,
  Share2,
  ShoppingBag,
  TicketPercent,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useCart } from "@/hooks/useCart";
import { useAddresses } from "@/hooks/useAddresses";
import { useAccount } from "@/hooks/useAccount";
import { useCoupon } from "@/hooks/useCoupon";
import { useNotifications } from "@/hooks/useNotifications";
import { formatPrice, safeImageUrl } from "@/lib/utils";
import { generateOrderNumber, getStoredOrders, saveOrder } from "@/lib/orders";
import { products as allStoreProducts } from "@/data/products";
import CouponSelector from "@/components/coupon/CouponSelector";
import type { SavedAddress } from "@/types/address";
import type {
  AddressType,
  BootkitOrder,
  CheckoutAddress,
  PaymentMethod,
} from "@/types/order";
import type { Product } from "@/types/product";

const DELIVERY_FEE = 0; // Free delivery active as per screenshot
const HANDLING_CHARGE = 9;

const initialAddress: CheckoutAddress = {
  fullName: "",
  phone: "",
  houseNumber: "",
  street: "",
  area: "",
  landmark: "",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302025",
  addressType: "Home",
};

export default function CustomerCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAF8]">
          <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5 sm:px-6">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-5 w-28 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </header>
          <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
            <div className="h-44 animate-pulse rounded-2xl bg-white" />
            <div className="h-60 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      }
    >
      <CustomerCheckoutPageContent />
    </Suspense>
  );
}

function CustomerCheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from");

  const handleBack = () => {
    if (from === "orders") {
      router.push("/orders");
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const { profile } = useAccount();
  const {
    items,
    subtotal,
    totalItems,
    hydrated: cartHydrated,
    addItem,
    increaseItem,
    decreaseItem,
    getQuantity,
    clearCart,
  } = useCart();
  const {
    addresses,
    defaultAddress,
    hydrated: addressesHydrated,
    addAddress,
  } = useAddresses();
  const {
    appliedCoupon,
    hydrated: couponHydrated,
    removeCoupon,
  } = useCoupon();
  const { addNotification } = useNotifications();

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const hasPreviousOrders = getStoredOrders().length > 0;

  // Selected Address State
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState<CheckoutAddress>(initialAddress);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Delivery Instructions State
  const [isRecording, setIsRecording] = useState(false);
  const [avoidCalling, setAvoidCalling] = useState(false);
  const [dontRingBell, setDontRingBell] = useState(false);

  // GSTIN Modal State
  const [showGstinModal, setShowGstinModal] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstinName, setGstinName] = useState("");
  const [savedGstin, setSavedGstin] = useState<{ gstin: string; name: string } | null>(null);

  // Search Products Modal State (to add more items directly in checkout)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Coupon Drawer State
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);

  // Payment Drawer & Process State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync default address on load
  useEffect(() => {
    if (!addressesHydrated || selectedAddressId) return;

    const targetAddress =
      defaultAddress ||
      addresses.find((a) => a.isDefault) ||
      addresses[0];

    if (targetAddress) {
      setSelectedAddressId(targetAddress.id);
      setAddress({
        fullName: targetAddress.fullName,
        phone: targetAddress.phone,
        houseNumber: targetAddress.houseNumber,
        street: targetAddress.street,
        area: targetAddress.area ?? "",
        landmark: targetAddress.landmark || "",
        city: targetAddress.city,
        state: targetAddress.state,
        pincode: targetAddress.pincode,
        addressType: targetAddress.addressType,
      });
    } else {
      setAddress((prev) => ({
        ...prev,
        fullName: profile?.fullName || "Customer",
        phone: profile?.phone || "9876543210",
      }));
    }
  }, [addressesHydrated, defaultAddress, addresses, selectedAddressId, profile]);

  // UPI Timer Countdown
  useEffect(() => {
    if (!showPaymentModal || paymentMethod !== "UPI" || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [showPaymentModal, paymentMethod, timeLeft]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText("bootkit@ybl");
      setUpiCopied(true);
      showToast("UPI ID copied!");
      setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      setError("UPI ID could not be copied.");
    }
  };

  // Filter products for Search Modal
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allStoreProducts.slice(0, 10);
    }
    const q = searchQuery.toLowerCase().trim();
    return allStoreProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.categorySlug?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Calculations
  const totalMrp = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + (item.product.mrp || item.product.price) * item.quantity,
        0
      ),
    [items]
  );

  const itemSavings = Math.max(totalMrp - subtotal, 0);
  const deliverySavings = 30; // ₹30 Free Delivery benefit
  const totalSavings = itemSavings + deliverySavings + couponDiscount;

  const totalAmount = Math.max(
    subtotal + DELIVERY_FEE + HANDLING_CHARGE - couponDiscount,
    0
  );

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

  const addressString = [
    address.houseNumber,
    address.street,
    address.area,
    address.city,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handleApplySavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      houseNumber: saved.houseNumber,
      street: saved.street,
      area: saved.area ?? "",
      landmark: saved.landmark || "",
      city: saved.city,
      state: saved.state,
      pincode: saved.pincode,
      addressType: saved.addressType,
    });
    setShowAddressModal(false);
    showToast("Delivery address updated");
  };

  const handleAddNewAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const houseNumber = formData.get("houseNumber") as string;
    const street = formData.get("street") as string;
    const area = formData.get("area") as string;
    const city = formData.get("city") as string;
    const pincode = formData.get("pincode") as string;
    const state = formData.get("state") as string;
    const addressType = (formData.get("addressType") as AddressType) || "Home";

    if (!houseNumber || !street || !pincode) {
      setError("Please fill all required address fields.");
      return;
    }

    const newSaved = await addAddress({
      fullName: address.fullName || profile?.fullName || "Customer",
      phone: address.phone || profile?.phone || "9876543210",
      houseNumber,
      street,
      area,
      landmark: "",
      city: city || "Jaipur",
      state: state || "Rajasthan",
      pincode,
      addressType,
      isDefault: addresses.length === 0,
    });

    handleApplySavedAddress(newSaved);
    setShowNewAddressForm(false);
  };

  const handleSaveGstin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!gstin.trim() || gstin.trim().length < 8) {
      showToast("Please enter a valid GSTIN number");
      return;
    }
    setSavedGstin({ gstin: gstin.trim(), name: gstinName.trim() });
    setShowGstinModal(false);
    showToast("GSTIN details added!");
  };

  const handlePlaceOrder = () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!address.houseNumber && !selectedAddressId) {
      setShowPaymentModal(false);
      setShowAddressModal(true);
      setError("Please provide a delivery address.");
      return;
    }

    if (paymentMethod === "UPI" && !paymentSubmitted) {
      setError("Please click 'I Have Paid' after scanning the QR code.");
      return;
    }

    if (paymentMethod === "UPI" && upiTransactionId.trim().length < 6) {
      setError("Please enter a valid UPI Transaction / UTR number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const now = new Date().toISOString();
      const orderNumber = generateOrderNumber();

      const order: BootkitOrder = {
        id: crypto.randomUUID(),
        orderNumber,
        items,
        address: {
          ...address,
          fullName: address.fullName || profile?.fullName || "Customer",
          phone: address.phone || profile?.phone || "9876543210",
          houseNumber: address.houseNumber.trim(),
          street: address.street.trim(),
          area: address.area?.trim() ?? "",
          landmark: address.landmark?.trim() ?? "",
          city: address.city.trim() || "Jaipur",
          state: address.state.trim() || "Rajasthan",
          pincode: address.pincode.trim() || "302025",
        },
        paymentMethod,
        paymentStatus:
          paymentMethod === "UPI" ? "Verification Pending" : "Pending",
        status: "Placed",
        itemTotal: subtotal,
        deliveryFee: DELIVERY_FEE,
        totalAmount,
        savings: totalSavings,
        offerCode: appliedCoupon?.coupon.code,
        offerDiscount: couponDiscount,
        upiTransactionId:
          paymentMethod === "UPI" ? upiTransactionId.trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };

      saveOrder(order);

      addNotification({
        type: "ORDER",
        title: "Order placed successfully",
        message: `Your order #${orderNumber} has been placed for ${formatPrice(
          totalAmount
        )}.`,
        href: `/orders/${orderNumber}`,
      });

      removeCoupon();
      clearCart();

      router.push(`/order-success?order=${encodeURIComponent(orderNumber)}`);
    } catch {
      setSubmitting(false);
      setError("Order could not be created. Please try again.");
    }
  };

  if (!cartHydrated || !addressesHydrated || !couponHydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="h-5 w-28 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </header>
        <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
          <div className="h-44 animate-pulse rounded-2xl bg-white" />
          <div className="h-60 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700"
            >
              <ArrowLeft size={19} />
            </button>
            <h1 className="text-lg font-black text-gray-900">Checkout</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-green-50 text-[#16A34A]">
            <PackageCheck size={32} />
          </div>
          <h2 className="mt-4 text-lg font-black text-gray-900">
            Your cart is empty
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Add items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-2xl bg-[#16A34A] px-6 py-2.5 text-xs font-black text-white hover:bg-[#15803D]"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1E293B]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transform animate-bounce rounded-full bg-[#16A34A] px-5 py-2.5 text-xs font-bold text-white shadow-lg">
          ✓ {toastMessage}
        </div>
      )}

      {/* Clean App Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
              Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Top Search Button to Add More Items */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchModal(true);
              }}
              aria-label="Search and add more items"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 active:scale-95"
            >
              <Search size={19} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "BootKiT Order",
                    url: window.location.href,
                  });
                }
              }}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Checkout Flow */}
      <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 space-y-4 pb-36">
        {/* 1. Products in Order Card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#16A34A]" />
              <span className="text-xs font-black text-gray-900">
                Delivery in 6 mins
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchModal(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"
            >
              <Plus size={14} />
              <span>Add more items</span>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const rawImg =
                item.product.thumbnail ||
                item.product.image ||
                (Array.isArray(item.product.images) && item.product.images[0]) ||
                (Array.isArray((item.product as any).gallery) &&
                  (item.product as any).gallery[0]) ||
                "";
              const imgSrc = safeImageUrl(rawImg);

              const unitLabel =
                typeof item.product.unit === "object"
                  ? item.product.unit?.label
                  : item.product.unit || "";

              return (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between py-2.5 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAFC] p-1">
                      {/* Product Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgSrc}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-bold text-gray-900 sm:text-sm">
                        {item.product.name}
                      </p>
                      {unitLabel && (
                        <p className="text-[10px] text-gray-500 font-medium">
                          {unitLabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center rounded-lg border border-[#16A34A] bg-green-50 px-2 py-0.5 text-xs font-black text-[#16A34A]">
                      <button
                        type="button"
                        onClick={() => decreaseItem(item.product.id)}
                        className="px-1 py-0.5 hover:opacity-75"
                      >
                        -
                      </button>
                      <span className="px-1.5">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseItem(item.product.id)}
                        className="px-1 py-0.5 hover:opacity-75"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-14 text-right text-xs font-black text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Free Delivery & Coupon Offers Card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-black text-[#2563EB]">
                  Yay! You got FREE Delivery
                </p>
                <p className="text-[10px] font-medium text-gray-500 flex items-center gap-0.5">
                  No coupon needed <ChevronRight size={11} />
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => setShowCouponDrawer(true)}
              className="flex w-full items-center justify-between text-xs font-bold text-gray-800 hover:text-[#16A34A] transition"
            >
              <div className="flex items-center gap-1.5">
                <TicketPercent size={15} className="text-[#16A34A]" />
                <span>
                  {appliedCoupon
                    ? `Coupon Applied: ${appliedCoupon.coupon.code} (-${formatPrice(couponDiscount)})`
                    : "See all coupons"}
                </span>
              </div>
              <ChevronRight size={15} className="text-gray-400" />
            </button>
          </div>
        </section>

        {/* 3. Bill Details Card (Exact Screenshot Match) */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-black text-gray-900">Bill details</h2>

            {/* Items total */}
            <div className="flex items-center justify-between text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-gray-700" />
                <span>Items total</span>
                {itemSavings > 0 && (
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#2563EB]">
                    Saved {formatPrice(itemSavings)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {itemSavings > 0 && (
                  <span className="line-through text-gray-400">
                    {formatPrice(totalMrp)}
                  </span>
                )}
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* Delivery charge */}
            <div className="flex items-center justify-between text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2">
                <Bike size={15} className="text-gray-700" />
                <span className="border-b border-dotted border-gray-400">
                  Delivery charge
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="line-through text-gray-400">₹30</span>
                <span className="font-bold text-[#2563EB]">FREE</span>
              </div>
            </div>

            {/* Handling charge */}
            <div className="flex items-center justify-between text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-gray-700" />
                <span className="border-b border-dotted border-gray-400">
                  Handling charge
                </span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatPrice(HANDLING_CHARGE)}
              </span>
            </div>

            {/* Coupon discount (if applied) */}
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-xs font-medium text-[#16A34A]">
                <span>Coupon discount ({appliedCoupon?.coupon.code})</span>
                <span className="font-bold">-{formatPrice(couponDiscount)}</span>
              </div>
            )}

            {/* Grand total */}
            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-black text-gray-900 border-b border-dotted border-gray-900">
                Grand total
              </span>
              <span className="text-base font-black text-gray-900">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Blue Savings Wave / Strip Banner */}
          <div className="bg-[#EEF4FF] p-3.5 border-t border-blue-100">
            <div className="flex items-center justify-between text-xs font-black text-[#2563EB]">
              <span>Your total savings</span>
              <span className="text-sm">{formatPrice(totalSavings)}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-[#3B82F6]">
              Includes ₹30 savings through free delivery
            </p>
          </div>
        </section>

        {/* 4. Add GSTIN Card (Opens Center Popup Modal) */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={() => {
              setGstin(savedGstin?.gstin || "");
              setGstinName(savedGstin?.name || "");
              setShowGstinModal(true);
            }}
            className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-gray-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] font-bold text-base">
                %
              </div>
              <div>
                <p className="text-xs font-black text-gray-900">
                  {savedGstin ? `GSTIN: ${savedGstin.gstin}` : "Add GSTIN"}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {savedGstin
                    ? savedGstin.name || "GST invoice enabled for this order"
                    : "Claim GST input credit up to 18% on your order"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A]">
              {savedGstin ? <span>Edit</span> : <ChevronRight size={18} className="text-gray-400" />}
            </div>
          </button>
        </section>

        {/* 5. Delivery Instructions Card */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-3">
          <h2 className="text-sm font-black text-gray-900">
            Delivery instructions
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Option 1: Record */}
            <button
              type="button"
              onClick={() => setIsRecording((r) => !r)}
              className={`flex flex-col items-start justify-between rounded-xl border p-2.5 text-left h-22 transition ${
                isRecording
                  ? "border-[#16A34A] bg-green-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-black text-[#16A34A]">
                <Mic size={14} />
                <span>Record</span>
              </div>
              <span className="text-[10px] font-medium text-gray-600 leading-tight">
                Press here and hold
              </span>
            </button>

            {/* Option 2: Avoid calling */}
            <button
              type="button"
              onClick={() => setAvoidCalling((v) => !v)}
              className={`flex flex-col items-start justify-between rounded-xl border p-2.5 text-left h-22 transition ${
                avoidCalling
                  ? "border-[#16A34A] bg-green-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <PhoneOff
                  size={16}
                  className={avoidCalling ? "text-[#16A34A]" : "text-gray-700"}
                />
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                    avoidCalling
                      ? "border-[#16A34A] bg-[#16A34A] text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {avoidCalling && "✓"}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-800 leading-tight">
                Avoid calling
              </span>
            </button>

            {/* Option 3: Don't ring the bell */}
            <button
              type="button"
              onClick={() => setDontRingBell((v) => !v)}
              className={`flex flex-col items-start justify-between rounded-xl border p-2.5 text-left h-22 transition ${
                dontRingBell
                  ? "border-[#16A34A] bg-green-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-base leading-none">🔕</span>
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                    dontRingBell
                      ? "border-[#16A34A] bg-[#16A34A] text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {dontRingBell && "✓"}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-800 leading-tight">
                Don&apos;t ring the bell
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* 6. Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200/90 bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-xl">
        <div className="mx-auto max-w-2xl space-y-2.5">
          {/* Address Line Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Home size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-900">
                  Delivering to {address.addressType || "Home"}
                </p>
                <p className="truncate text-[11px] font-medium text-gray-500">
                  {addressString || "Set your delivery location"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddressModal(true)}
              className="shrink-0 text-xs font-black text-[#16A34A] hover:underline"
            >
              Change
            </button>
          </div>

          {/* Select Payment Method Button */}
          <button
            type="button"
            onClick={() => {
              if (!address.houseNumber && !selectedAddressId) {
                setShowAddressModal(true);
              } else {
                setShowPaymentModal(true);
              }
            }}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#16A34A] px-4 text-sm font-black text-white shadow-lg shadow-green-600/20 transition hover:bg-[#15803D] active:scale-[0.99]"
          >
            Select Payment Method
          </button>
        </div>
      </div>

      {/* Center Modal for Adding GSTIN */}
      {showGstinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] font-bold text-sm">
                  %
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Add GSTIN Details
                  </h3>
                  <p className="text-[10px] font-medium text-gray-500">
                    Claim tax input credit for business orders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGstinModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGstin} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  GSTIN Number *
                </label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="15-digit GSTIN (e.g. 08ABHCS8002R1ZQ)"
                  maxLength={15}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Registered Business Name
                </label>
                <input
                  type="text"
                  value={gstinName}
                  onChange={(e) => setGstinName(e.target.value)}
                  placeholder="Legal Business / Company Name"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-xs font-medium outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                {savedGstin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSavedGstin(null);
                      setGstin("");
                      setGstinName("");
                      setShowGstinModal(false);
                      showToast("GSTIN removed.");
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowGstinModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#16A34A] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#15803D]"
                >
                  Save GSTIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Center Search Modal to Search & Add More Items */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg animate-in fade-in zoom-in-95 rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header & Search Bar */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900">
                  Add more items to order
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 text-gray-400"
                />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search milk, fruits, snacks, drinks..."
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-9 text-xs font-medium outline-none focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#16A34A]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm font-bold text-gray-800">
                    No products found
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Try searching for another product name
                  </p>
                </div>
              ) : (
                searchResults.map((product) => {
                  const qtyInCart = getQuantity(product.id);
                  const rawImg =
                    product.thumbnail ||
                    product.image ||
                    (Array.isArray(product.images) && product.images[0]) ||
                    "";
                  const imgSrc = safeImageUrl(rawImg);
                  const unitLabel =
                    typeof product.unit === "object"
                      ? product.unit?.label
                      : product.unit || "";

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAFC] p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder.png";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-xs font-bold text-gray-900">
                            {product.name}
                          </p>
                          {unitLabel && (
                            <p className="text-[10px] text-gray-500 font-medium">
                              {unitLabel}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.mrp > product.price && (
                              <span className="text-[10px] line-through text-gray-400">
                                {formatPrice(product.mrp)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Add Button or Stepper */}
                      <div className="shrink-0">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center rounded-xl border border-[#16A34A] bg-green-50 px-2.5 py-1 text-xs font-black text-[#16A34A]">
                            <button
                              type="button"
                              onClick={() => decreaseItem(product.id)}
                              className="px-1.5 py-0.5 hover:opacity-75"
                            >
                              -
                            </button>
                            <span className="px-2">{qtyInCart}</span>
                            <button
                              type="button"
                              onClick={() => increaseItem(product.id)}
                              className="px-1.5 py-0.5 hover:opacity-75"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              addItem(product);
                              showToast(`Added ${product.name}`);
                            }}
                            className="flex items-center gap-1 rounded-xl bg-[#16A34A] px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-[#15803D] active:scale-95"
                          >
                            <Plus size={14} />
                            <span>ADD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Done CTA Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-700">
                <span>{totalItems} items in cart</span> •{" "}
                <span className="font-black text-gray-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="rounded-xl bg-[#16A34A] px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#15803D]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-gray-900">
                Select Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setShowNewAddressForm(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {!showNewAddressForm ? (
              <div className="mt-4 space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleApplySavedAddress(addr)}
                      className={`flex cursor-pointer items-start justify-between rounded-2xl border p-3.5 transition ${
                        isSelected
                          ? "border-[#16A34A] bg-green-50/40"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-[#16A34A] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Home size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">
                            {addr.addressType}
                          </p>
                          <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                            {addr.houseNumber}, {addr.street}, {addr.area},{" "}
                            {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2
                          size={18}
                          className="shrink-0 text-[#16A34A]"
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#16A34A] bg-green-50/50 text-xs font-black text-[#16A34A] hover:bg-green-100"
                >
                  <Plus size={15} />
                  Add New Address
                </button>
              </div>
            ) : (
              /* Add New Address Form */
              <form
                onSubmit={handleAddNewAddressSubmit}
                className="mt-4 space-y-3 text-xs"
              >
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    House / Flat / Shop Number *
                  </label>
                  <input
                    name="houseNumber"
                    required
                    placeholder="e.g. Flat 402, House 229"
                    className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Street / Colony / Area *
                  </label>
                  <input
                    name="street"
                    required
                    placeholder="e.g. Sanik Nagar, Main Road"
                    className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Area / Ward *
                    </label>
                    <input
                      name="area"
                      required
                      defaultValue="Jagatpura"
                      placeholder="e.g. Jagatpura"
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      name="pincode"
                      required
                      defaultValue="302025"
                      placeholder="6-digit pincode"
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      name="city"
                      defaultValue="Jaipur"
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      name="state"
                      defaultValue="Rajasthan"
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 font-bold text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#16A34A] py-2.5 font-bold text-white shadow-sm hover:bg-[#15803D]"
                  >
                    Save & Deliver Here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Coupon Modal Drawer */}
      {showCouponDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-gray-900">
                Coupons & Offers
              </h3>
              <button
                type="button"
                onClick={() => setShowCouponDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <CouponSelector
                subtotal={subtotal}
                hasPreviousOrders={hasPreviousOrders}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Selection Modal Drawer */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Select Payment Method
                </h3>
                <p className="text-[11px] font-medium text-gray-500">
                  Total Payable: {formatPrice(totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {/* COD Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  paymentMethod === "COD"
                    ? "border-[#16A34A] bg-green-50/40 ring-2 ring-[#16A34A]/20"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Pay cash when your order arrives
                    </p>
                  </div>
                </div>
                {paymentMethod === "COD" && (
                  <CheckCircle2 size={18} className="text-[#16A34A]" />
                )}
              </button>

              {/* UPI Scan & Pay Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  paymentMethod === "UPI"
                    ? "border-[#16A34A] bg-green-50/40 ring-2 ring-[#16A34A]/20"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#16A34A]">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">
                      UPI · Scan & Pay
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Pay instantly via GPay, PhonePe, Paytm QR
                    </p>
                  </div>
                </div>
                {paymentMethod === "UPI" && (
                  <CheckCircle2 size={18} className="text-[#16A34A]" />
                )}
              </button>

              {/* UPI Details Box */}
              {paymentMethod === "UPI" && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-gray-200">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400">
                        UPI ID
                      </p>
                      <p className="text-xs font-black text-gray-900">
                        bootkit@ybl
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
                    >
                      {upiCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-gray-200">
                    <div className="mb-2 flex items-center justify-between w-full text-[11px] font-bold">
                      <span className="text-gray-500">QR expires in:</span>
                      <span className="text-red-600 font-mono">
                        {formattedTime}
                      </span>
                    </div>
                    <QRCodeSVG
                      value={`upi://pay?pa=bootkit@ybl&pn=BootKiT&am=${totalAmount.toFixed(
                        2
                      )}&cu=INR&tn=BootKiT%20Order`}
                      size={160}
                      level="M"
                      includeMargin
                    />
                    <p className="mt-2 text-[10px] font-bold text-gray-500">
                      Scan with any UPI App · Exact: {formatPrice(totalAmount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentSubmitted(true);
                      showToast("Payment recorded. Enter UTR number below.");
                    }}
                    className="h-10 w-full rounded-xl bg-[#16A34A] text-xs font-black text-white hover:bg-[#15803D]"
                  >
                    I Have Paid
                  </button>

                  {paymentSubmitted && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Enter UPI UTR / Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={upiTransactionId}
                        onChange={(e) => setUpiTransactionId(e.target.value)}
                        placeholder="12-digit UTR Number"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium outline-none focus:border-[#16A34A]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Place Order CTA Button */}
            <div className="mt-5 pt-3 border-t">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="flex h-12 w-full items-center justify-between rounded-2xl bg-[#16A34A] px-5 text-white shadow-lg shadow-green-600/20 transition hover:bg-[#15803D] active:scale-[0.99] disabled:opacity-60"
              >
                <span className="text-xs font-black uppercase tracking-wider">
                  {submitting
                    ? "Placing Order..."
                    : paymentMethod === "COD"
                    ? "Place Order (COD)"
                    : "Confirm & Place Order"}
                </span>
                <span className="text-sm font-black">
                  {formatPrice(totalAmount)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
