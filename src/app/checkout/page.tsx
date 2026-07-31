"use client";

import CouponSelector from "@/components/coupon/CouponSelector";
import { useCoupon } from "@/hooks/useCoupon";
import { getStoredOrders } from "@/lib/orders";
import SavedAddressSelector from "@/components/checkout/SavedAddressSelector";
import { useAddresses } from "@/hooks/useAddresses";
import type { SavedAddress } from "@/types/address";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminDeliveryAreas } from "@/hooks/useAdminDeliveryAreas";
import type { ReactNode } from "react";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { generateOrderNumber, saveOrder } from "@/lib/orders";
import type {
  AddressType,
  BootkitOrder,
  CheckoutAddress,
  PaymentMethod,
} from "@/types/order";



const FREE_DELIVERY_MINIMUM = 499;
const DELIVERY_FEE = 29;

const initialAddress: CheckoutAddress = {
  fullName: "",
  phone: "",
  houseNumber: "",
  street: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  addressType: "Home",
};
type CheckoutStep = 1 | 2 | 3;

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    subtotal,
    totalItems,
    hydrated,
    clearCart,
  } = useCart();
  const {
  addresses,
  defaultAddress,
  hydrated: addressesHydrated,
} = useAddresses();


const {
  appliedCoupon,
  hydrated: couponHydrated,
  removeCoupon,
} = useCoupon();

const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  

const { addNotification } = useNotifications();
const {
  serviceablePincodes,
  getDeliveryAreasByPincode,
} = useAdminDeliveryAreas();

const [selectedAddressId, setSelectedAddressId] = useState("");
const [checkoutStep, setCheckoutStep] =
  useState<CheckoutStep>(1);

  const [address, setAddress] =
    useState<CheckoutAddress>(initialAddress);


    


  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("COD");

  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);


  
  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText("bootkit@ybl");
      setUpiCopied(true);

      window.setTimeout(() => {
        setUpiCopied(false);
      }, 2000);
    } catch {
      setError("UPI ID could not be copied.");
    }
  };
  const PAYMENT_TIME = 10 * 60;
const [timeLeft, setTimeLeft] = useState(PAYMENT_TIME);
const [paymentSubmitted, setPaymentSubmitted] = useState(false);
const [paymentStatus, setPaymentStatus] = useState<
  "idle" | "submitted"
>("idle");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasPreviousOrders = getStoredOrders().length > 0;

const availableDeliveryAreas = useMemo(
  () =>
    getDeliveryAreasByPincode(
      address.pincode
    ),
  [
    address.pincode,
    getDeliveryAreasByPincode,
  ]
);

  const applySavedAddress = (savedAddress: SavedAddress) => {
  setSelectedAddressId(savedAddress.id);

  setAddress({
  fullName: savedAddress.fullName,
  phone: savedAddress.phone,
  houseNumber: savedAddress.houseNumber,
  street: savedAddress.street,
  area: savedAddress.area ?? "",
  landmark: savedAddress.landmark,
  city: savedAddress.city,
  state: savedAddress.state,
  pincode: savedAddress.pincode,
  addressType: savedAddress.addressType,
});

  setError("");
};
useEffect(() => {
  if (
    !addressesHydrated ||
    !defaultAddress ||
    selectedAddressId
  ) {
    return;
  }

  setSelectedAddressId(defaultAddress.id);

  setAddress({
  fullName: defaultAddress.fullName,
  phone: defaultAddress.phone,
  houseNumber: defaultAddress.houseNumber,
  street: defaultAddress.street,
  area: defaultAddress.area ?? "",
  landmark: defaultAddress.landmark,
  city: defaultAddress.city,
  state: defaultAddress.state,
  pincode: defaultAddress.pincode,
  addressType: defaultAddress.addressType,
}); 
}, [
  addressesHydrated,
  defaultAddress,
  selectedAddressId,
]);

useEffect(() => {
  if (paymentMethod !== "UPI" || timeLeft <= 0) {
    return;
  }

  const timer = window.setInterval(() => {
    setTimeLeft((current) => {
      if (current <= 1) {
        window.clearInterval(timer);
        return 0;
      }

      return current - 1;
    });
  }, 1000);

  return () => {
    window.clearInterval(timer);
  };
}, [paymentMethod, timeLeft]);

const formattedTime = `${Math.floor(timeLeft / 60)
  .toString()
  .padStart(2, "0")}:${(timeLeft % 60)
  .toString()
  .padStart(2, "0")}`;


  const totalMrp = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.product.mrp * item.quantity,
        0
      ),
    [items]
  );

  const savings = Math.max(totalMrp - subtotal, 0);

  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_MINIMUM
      ? 0
      : DELIVERY_FEE;

  const totalAmount = Math.max(
  subtotal + deliveryFee - couponDiscount,
  0
);

const selectAddressType = (type: AddressType) => {
  setAddress((current) => ({
    ...current,
    addressType: type,
  }));

  setSelectedAddressId("");
};


    const updateAddress = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "phone") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    if (name === "pincode") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 6);

      const matchingAreas =
        getDeliveryAreasByPincode(nextValue);

      setAddress((current) => {
        const areaStillAvailable =
          matchingAreas.some(
            (area) =>
              area.area === current.area
          );

        return {
          ...current,
          pincode: nextValue,
          area: areaStillAvailable
            ? current.area
            : "",
          city:
            matchingAreas[0]?.city ??
            (nextValue.length === 6
              ? ""
              : current.city),
          state:
            matchingAreas.length > 0
              ? "Rajasthan"
              : nextValue.length === 6
                ? ""
                : current.state,
        };
      });
    } else {
      setAddress((current) => ({
        ...current,
        [name]: nextValue,
      }));
    }

    setSelectedAddressId("");
    setError("");
  };
  
  

  const validateAddressStep = () => {
    if (!items.length) {
      return "Your cart is empty.";
    }

    if (
      !address.fullName?.trim() ||
      address.fullName.trim().length < 2
    ) {
      return "Please enter the customer name.";
    }

    if (!/^[6-9]\d{9}$/.test(address.phone ?? "")) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (!address.houseNumber?.trim()) {
      return "Please enter house, flat or shop number.";
    }

    if (!address.street?.trim()) {
      return "Please enter street, colony or village.";
    }

    if (!address.area?.trim()) {
      return "Please enter or select your area or ward.";
    }

    if (!address.city?.trim()) {
      return "Please enter your city.";
    }

    if (!address.state?.trim()) {
      return "Please enter your state.";
    }

    if (!/^\d{6}$/.test(address.pincode ?? "")) {
      return "Please enter a valid 6-digit pincode.";
    }

    if (!serviceablePincodes.includes(address.pincode)) {
      return "BootKiT is currently not delivering to this pincode.";
    }

    return "";
  };

  const continueToPayment = () => {
    const validationError = validateAddressStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setCheckoutStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const validateCheckout = () => {
    const addressError = validateAddressStep();

    if (addressError) {
      return addressError;
    }

    if (paymentMethod === "UPI") {
      if (timeLeft <= 0) {
        return "The payment QR has expired. Please generate a new QR.";
      }

      if (!paymentSubmitted) {
        return "Please complete the UPI payment first.";
      }

      if (upiTransactionId.trim().length < 8) {
        return "Please enter a valid UPI transaction or UTR number.";
      }
    }


    return "";
  };

  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (checkoutStep !== 2) {
      continueToPayment();
      return;
    }

    const validationError = validateCheckout();

    if (validationError) {
      setError(validationError);
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
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          houseNumber: address.houseNumber.trim(),
          street: address.street.trim(),
          area: address.area?.trim() ?? "",
          landmark: address.landmark?.trim() ?? "",
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
        },
        paymentMethod,
        paymentStatus:
          paymentMethod === "UPI"
            ? "Verification Pending"
            : "Pending",
        status: "Placed",
        itemTotal: subtotal,
        deliveryFee,
        totalAmount,
        savings: savings + couponDiscount,
        offerCode: appliedCoupon?.coupon.code,
        offerDiscount: couponDiscount,
        upiTransactionId:
          paymentMethod === "UPI"
            ? upiTransactionId.trim()
            : undefined,
        createdAt: now,
        updatedAt: now,
      };

      saveOrder(order);

      addNotification({
        type: "ORDER",
        title: "Order placed successfully",
        message: `Your order ${orderNumber} has been placed for ${formatPrice(
          totalAmount
        )}.`,
        href: `/orders/${orderNumber}`,
      });

      removeCoupon();
      clearCart();

      router.push(
        `/order-success?order=${encodeURIComponent(orderNumber)}`
      );
    } catch {
      setSubmitting(false);
      setError(
        "Order could not be created. Please try again."
      );
    }
  };

if (
  !hydrated ||
  !addressesHydrated ||
  !couponHydrated
) {

    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-8">
          <div className="h-[480px] animate-pulse rounded-[28px] border border-[var(--border)] bg-white" />
        </Container>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-8">
          <section className="flex min-h-[460px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
            <PackageCheck
              size={42}
              className="text-[var(--primary)]"
            />

            <h1 className="mt-5 text-2xl font-black text-[var(--text-primary)]">
              No items available for checkout
            </h1>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Add products to your cart before placing an order.
            </p>

            <Link
              href="/"
              className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-bold text-white"
            >
              Continue shopping
            </Link>
          </section>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/cart"
              aria-label="Back to cart"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[25px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
                Secure checkout
              </h1>

              <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                {totalItems} {totalItems === 1 ? "item" : "items"} in
                your order
              </p>
            </div>
          </div>
<CheckoutProgress currentStep={checkoutStep} />
          <form
  onSubmit={placeOrder}
  className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]"
>
            
            <div className="space-y-5">

              {checkoutStep === 1 && (
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex items-center gap-3">
                  
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                    <MapPin size={20} />
                  </span>

                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)]">
                      Delivery address
                    </h2>

                    <p className="text-xs text-[var(--text-muted)]">
                      Enter the complete delivery details
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  
  <SavedAddressSelector
    addresses={addresses}
    selectedAddressId={selectedAddressId}
    onSelect={applySavedAddress}
  />

</div>

{selectedAddressId ? (
  <div className="mt-5">
    <button
      type="button"
      onClick={() => {
        setSelectedAddressId("");
        setAddress(initialAddress);
        setError("");
      }}
      className="flex h-12 w-full items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary-light)] px-4 text-sm font-black text-[var(--primary)] transition hover:bg-green-100"
    >
      + Add another address
    </button>

    <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
      Add a new Home, Office or Other delivery address
    </p>
  </div>
) : (
  <>
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--border)]" />

      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">
        Add delivery address
      </span>

      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Customer name"
        name="fullName"
        value={address.fullName}
        onChange={updateAddress}
        placeholder="Enter full name"
        required
      />

      <Field
        label="Mobile number"
        name="phone"
        value={address.phone}
        onChange={updateAddress}
        placeholder="10-digit mobile number"
        inputMode="numeric"
        required
      />

      <Field
        label="House / Flat / Shop"
        name="houseNumber"
        value={address.houseNumber}
        onChange={updateAddress}
        placeholder="House no. or flat no."
        required
      />

      <Field
        label="Street / Colony / Village"
        name="street"
        value={address.street}
        onChange={updateAddress}
        placeholder="Street or area name"
        required
      />

           <Field
        label="Pincode"
        name="pincode"
        value={address.pincode}
        onChange={updateAddress}
        placeholder="6-digit pincode"
        inputMode="numeric"
        required
      />

      {availableDeliveryAreas.length > 0 ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
            Area / Ward
            <span className="ml-1 text-[var(--danger)]">*</span>
          </span>

          <select
            value={address.area}
            required
            onChange={(event) => {
              const selectedArea =
                availableDeliveryAreas.find(
                  (area) =>
                    area.area === event.target.value
                );

              setAddress((current) => ({
                ...current,
                area: event.target.value,
                city:
                  selectedArea?.city ??
                  current.city,
                state: selectedArea
                  ? "Rajasthan"
                  : current.state,
              }));

              setSelectedAddressId("");
              setError("");
            }}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
          >
            <option value="">
              Select area or ward
            </option>

            {availableDeliveryAreas.map(
              (deliveryArea) => (
                <option
                  key={deliveryArea.id}
                  value={deliveryArea.area}
                >
                  {deliveryArea.area}
                </option>
              )
            )}
          </select>
        </label>
      ) : (
        <Field
          label="Area / Ward"
          name="area"
          value={address.area}
          onChange={updateAddress}
          placeholder="Enter area or ward"
          required
        />
      )}

      <Field
        label="City"
        name="city"
        value={address.city}
        onChange={updateAddress}
        placeholder="City auto-filled"
        readOnly={
          availableDeliveryAreas.length > 0
        }
        required
      />

      <Field
        label="State"
        name="state"
        value={address.state}
        onChange={updateAddress}
        placeholder="State auto-filled"
        readOnly={
          availableDeliveryAreas.length > 0
        }
        required
      />

      <Field
        label="Landmark"
        name="landmark"
        value={address.landmark}
        onChange={updateAddress}
        placeholder="Nearby landmark (optional)"
      />
    </div>

    <div className="mt-5">
      <p className="text-xs font-bold text-[var(--text-secondary)]">
        Save address as
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {(["Home", "Office", "Other"] as AddressType[]).map(
          (type) => (
            <button
              key={type}
              type="button"
              onClick={() => selectAddressType(type)}
              className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                address.addressType === type
                  ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <Home size={15} />
              {type}
            </button>
          )
        )}
      </div>
    </div>

                 <div className="mt-5 rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
                 Current serviceable pincodes:{" "}
                 <span className="font-bold text-[var(--primary)]">
                  {serviceablePincodes.join(", ")}
              </span>
              </div>
             </>
             )}
{error && checkoutStep === 1 && (
  <div
    role="alert"
    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
  >
    {error}
  </div>
)}

<button
  type="button"
  onClick={continueToPayment}
  className="mt-6 flex h-[52px] w-full items-center justify-between rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
>
  <span>Continue to payment</span>
  <ChevronRight size={20} />
</button>
             
             
              </section>
              
)}
              {checkoutStep === 2 && (
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
      <CreditCard size={20} />
    </span>
    

    <div>
      <h2 className="text-lg font-black text-[var(--text-primary)]">
        Payment method
      </h2>


      <p className="text-xs text-[var(--text-muted)]">
        Choose how you want to pay
      </p>
    </div>
  </div>


</div>


                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <PaymentOption
                    active={paymentMethod === "COD"}
                    icon={<Banknote size={21} />}
                    title="Cash on Delivery"
                    description="Pay when your order arrives"
                    onClick={() => {
  setPaymentMethod("COD");
  setPaymentSubmitted(false);
  setPaymentStatus("idle");
  setUpiTransactionId("");
  setTimeLeft(PAYMENT_TIME);
  setError("");
}}
                  />

                  <PaymentOption
                    active={paymentMethod === "UPI"}
                    icon={<CreditCard size={21} />}
                    title="Manual UPI"
                    description="Pay using any UPI app"
                    onClick={() => {
  setPaymentMethod("UPI");
  setPaymentSubmitted(false);
  setPaymentStatus("idle");
  setUpiTransactionId("");
  setTimeLeft(PAYMENT_TIME);
  setError("");
}}
                  />

                  <PaymentOption
                    active={paymentMethod === "CARD"}
                    icon={<CreditCard size={21} />}
                    title="Card payment"
                    description="Credit or debit card"
                    onClick={() => { setPaymentMethod("CARD"); setPaymentSubmitted(false); setPaymentStatus("idle"); setError(""); }}
                  />

                  <PaymentOption
                    active={paymentMethod === "NET_BANKING"}
                    icon={<Building2 size={21} />}
                    title="Net banking"
                    description="Pay through your bank"
                    onClick={() => { setPaymentMethod("NET_BANKING"); setPaymentSubmitted(false); setPaymentStatus("idle"); setError(""); }}
                  />

                  <PaymentOption
                    active={paymentMethod === "WALLET"}
                    icon={<Wallet size={21} />}
                    title="Wallet"
                    description="Use a supported wallet"
                    onClick={() => { setPaymentMethod("WALLET"); setPaymentSubmitted(false); setPaymentStatus("idle"); setError(""); }}
                  />
                </div>

                {(["CARD", "NET_BANKING", "WALLET"] as PaymentMethod[]).includes(paymentMethod) && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                    <p className="font-black">Secure payment handoff</p>
                    <p className="mt-1">Order place करने के बाद payment provider की सुरक्षित window खुलेगी। Card number, PIN या bank credentials BootKiT में store नहीं किए जाते।</p>
                  </div>
                )}

                {paymentMethod === "UPI" && (
                  <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      Send payment to
                    </p>

                   <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3">
  <div className="min-w-0">
    <p className="text-xs text-[var(--text-secondary)]">UPI ID</p>
    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
      bootkit@ybl
    </p>
  </div>

  <button
    type="button"
    onClick={copyUpiId}
    className="shrink-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
  >
    {upiCopied ? "Copied" : "Copy"}
  </button>
</div>

<div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5">
  <span className="text-xs font-bold text-amber-900">
    {timeLeft > 0 ? "QR expires in" : "QR expired"}
  </span>

  {timeLeft > 0 ? (
    <span className="text-sm font-black text-red-600">
      {formattedTime}
    </span>
  ) : (
    <button
      type="button"
      onClick={() => {
        setTimeLeft(PAYMENT_TIME);
        setError("");
      }}


      className="rounded-lg bg-[var(--primary)] px-3 py-2 text-[11px] font-black text-white"
    >
      Generate New QR
    </button>
  )}
</div>

  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4">
    <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-sm">
      <span className="text-4xl" aria-hidden="true">▦</span>
      <span className="mt-3 text-xs font-black text-[var(--text-primary)]">bootkit@ybl</span>
      <span className="mt-1 text-[10px] text-[var(--text-muted)]">UPI payment</span>
    </div>
  </div>

  <p className="mt-3 text-center text-[11px] leading-5 text-[var(--text-muted)]">
    Scan this QR using any UPI app and pay exactly{" "}
    <span className="font-black text-[var(--text-primary)]">
      {formatPrice(totalAmount)}
    </span>
  </p>
</div>
<button
  type="button"
  onClick={() => {
  setPaymentSubmitted(true);
  setPaymentStatus("submitted");
}}

  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
>
  
  I Have Paid
</button>
                    <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
                      After payment, enter the UTR or transaction ID
                      below. The order will be verified manually.
                    </p>

                    {paymentSubmitted && (
  <>
    <p className="mt-4 text-xs font-semibold text-[var(--text-secondary)]">
      Enter your UTR / Transaction ID
    </p>

    <input
      value={upiTransactionId}
      onChange={(event) => {
        setUpiTransactionId(event.target.value);
        setError("");
      }}
      placeholder="Enter UTR / Transaction ID"
      className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
    />
  </>
)}
{paymentStatus === "submitted" && (
  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-amber-600" />

      <span className="text-sm font-bold text-amber-800">
        Verification Pending
      </span>
    </div>

    <p className="mt-2 text-xs leading-5 text-amber-700">
      We have received your payment request. Your UTR will be verified,
      and your order will be confirmed after successful verification.
    </p>
  </div>
)}
                  </div>
                )}


<div className="mt-2">
  <CouponSelector
    subtotal={subtotal}
    hasPreviousOrders={hasPreviousOrders}
  />
</div>



<div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">

<div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-lg font-black text-[var(--text-primary)]">
      Order Items
    </h2>

    <span className="text-xs font-bold text-[var(--text-muted)]">
      {totalItems} Items
    </span>
  </div>

  <div className="space-y-4">
    {items.map((item) => (
      <div
        key={item.product.id}
        className="flex items-center gap-3 border-b border-[var(--border)] pb-4 last:border-b-0 last:pb-0"
      >
        <span
          role="img"
          aria-label={item.product.name}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-3xl"
        >
          {item.product.fallbackIcon}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">
            {item.product.name}
          </h3>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Qty : {item.quantity}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-[var(--text-primary)]">
            {formatPrice(item.product.price * item.quantity)}
          </p>

          {item.product.mrp > item.product.price && (
            <p className="text-xs text-[var(--text-muted)] line-through">
              {formatPrice(item.product.mrp * item.quantity)}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
</div>



<h2 className="mb-5 text-lg font-black text-[var(--text-primary)]">
    Order Total
  </h2>

 <h3 className="text-sm font-black text-[var(--text-primary)]">
  Bill Details
</h3>

  <div className="mt-4 space-y-3 text-sm">
    {savings > 0 && (
      <SummaryRow
        label="Product discount"
        value={`-${formatPrice(savings)}`}
        success
      />
    )}

        {couponDiscount > 0 && (
      <SummaryRow
        label={`Offer discount (${appliedCoupon?.coupon.code})`}
        value={`-${formatPrice(couponDiscount)}`}
        success
      />
    )}

    <SummaryRow
      label="Delivery fee"
      value={
        deliveryFee === 0
          ? "FREE"
          : formatPrice(deliveryFee)
      }
      success={deliveryFee === 0}
    />
  </div>

  <div className="my-4 border-t border-dashed border-[var(--border-strong)]" />

  <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[var(--text-primary)]">
      Final amount
    </span>

    <span className="text-xl font-black text-[var(--text-primary)]">
      {formatPrice(totalAmount)}
    </span>
   </div>
</div>



<button
  type="submit"
  disabled={
    submitting ||
    (paymentMethod === "UPI" &&
      (!paymentSubmitted ||
        upiTransactionId.trim().length < 8))
  }
  className="mt-5 flex h-[54px] w-full items-center justify-between rounded-2xl bg-[var(--primary)] px-5 text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
>
  <span>
    <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
      {submitting
        ? "Creating order..."
        : paymentMethod === "UPI"
          ? "Submit order"
          : "Place order"}
    </span>

    <span className="block text-sm font-black">
      {formatPrice(totalAmount)}
    </span>
  </span>

  {submitting ? (
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  ) : (
    <ChevronRight size={20} />
  )}
</button>

<div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
  <div className="flex items-center gap-2">
    <ShieldCheck
      size={18}
      className="text-blue-700"
    />

    <span className="font-bold text-blue-800">
      100% Secure Checkout
    </span>
  </div>

  <p className="mt-2 text-xs leading-5 text-blue-700">
    BootKiT does not store your UPI PIN or bank credentials.
  </p>
</div>

              </section>
              )}
            </div>
          
            
<aside className="lg:sticky lg:top-24 h-fit">
  
  <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">

    <h2 className="text-lg font-black">
      Order Summary
    </h2>

    <div className="mt-5 space-y-3 text-sm">

      <SummaryRow
        label={`Items (${totalItems})`}
        value={formatPrice(subtotal)}
      />

      {savings > 0 && (
        <SummaryRow
          label="Product Discount"
          value={`-${formatPrice(savings)}`}
          success
        />
      )}

      {couponDiscount > 0 && (
        <SummaryRow
          label="Offer Discount"
          value={`-${formatPrice(couponDiscount)}`}
          success
        />
      )}

      <SummaryRow
        label="Delivery"
        value={
          deliveryFee === 0
            ? "FREE"
            : formatPrice(deliveryFee)
        }
        success={deliveryFee === 0}
      />

    </div>

    <div className="my-5 border-t border-dashed border-[var(--border)]" />

    <div className="flex items-center justify-between">
      <span className="text-base font-black">
        Total
      </span>

      <span className="text-2xl font-black">
        {formatPrice(totalAmount)}
      </span>
    </div>

    <div className="mt-5 rounded-xl bg-green-50 p-3 text-xs text-green-700">
      You save{" "}
      <span className="font-black">
        {formatPrice(savings + couponDiscount)}
      </span>{" "}
      on this order.
    </div>

  </div>
</aside>


          </form>
        </Container>
      </main>
    </div>
  );
}


type FieldProps = {
  readOnly?: boolean;
  label: string;
  name: keyof CheckoutAddress;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email"
    | "decimal"
    | "search"
    | "url";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function Field({
  label,
  name,
  value,
  placeholder,
  required,
  inputMode = "text",
  readOnly = false,
  onChange,
}: FieldProps) {

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--danger)]">*</span>
        )}
      </span>

      <input
      readOnly={readOnly}
        type="text"
        name={name}
       value={value ?? ""}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={onChange}
        className=" read-only:bg-[var(--surface-soft)] read-only:text-[var(--text-secondary)] h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}

type PaymentOptionProps = {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

function PaymentOption({
  active,
  icon,
  title,
  description,
  onClick,
}: PaymentOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[var(--primary)] bg-[var(--primary-light)]"
          : "border-[var(--border)] hover:border-[var(--border-strong)]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[var(--text-primary)]">
          {title}
        </span>

        <span className="mt-0.5 block text-[10px] leading-4 text-[var(--text-muted)]">
          {description}
        </span>
      </span>

      {active && (
        <CheckCircle2
          size={19}
          className="shrink-0 text-[var(--primary)]"
        />
      )}
    </button>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  success?: boolean;
};

function SummaryRow({
  label,
  value,
  success = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--text-secondary)]">
        {label}
      </span>

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
