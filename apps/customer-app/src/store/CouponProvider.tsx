"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCouponByCode } from "@/data/coupons";
import type {
  AppliedCoupon,
  Coupon,
  CouponContextValue,
} from "@/types/coupon";

export const CouponContext =
  createContext<CouponContextValue | null>(null);

const STORAGE_KEY = "bootkit_applied_coupon_v1";

function readStoredCoupon(): AppliedCoupon | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppliedCoupon>;

    if (
      !parsed.coupon ||
      typeof parsed.coupon.code !== "string" ||
      typeof parsed.discountAmount !== "number"
    ) {
      return null;
    }

    return parsed as AppliedCoupon;
  } catch {
    return null;
  }
}

export default function CouponProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCoupon | null>(null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAppliedCoupon(readStoredCoupon());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      if (!appliedCoupon) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appliedCoupon)
      );
    } catch {
      // Storage failure should not break checkout.
    }
  }, [appliedCoupon, hydrated]);

  const calculateDiscount = useCallback(
    (coupon: Coupon, subtotal: number) => {
      if (coupon.discountType === "FLAT") {
        return Math.min(coupon.discountValue, subtotal);
      }

      const percentageDiscount =
        (subtotal * coupon.discountValue) / 100;

      if (coupon.maximumDiscount) {
        return Math.min(
          percentageDiscount,
          coupon.maximumDiscount
        );
      }

      return percentageDiscount;
    },
    []
  );

  const applyCoupon = useCallback(
    (
      couponCode: string,
      subtotal: number,
      hasPreviousOrders = false
    ) => {
      const coupon = getCouponByCode(couponCode);

      if (!coupon) {
        return {
          success: false,
          message: "Invalid or expired coupon code.",
        };
      }

      if (subtotal < coupon.minimumOrder) {
        return {
          success: false,
          message: `Add ₹${coupon.minimumOrder - subtotal} more to use this coupon.`,
        };
      }

      if (coupon.firstOrderOnly && hasPreviousOrders) {
        return {
          success: false,
          message: "This coupon is valid only on the first order.",
        };
      }

      const discountAmount = Math.round(
        calculateDiscount(coupon, subtotal)
      );

      setAppliedCoupon({
        coupon,
        discountAmount,
      });

      return {
        success: true,
        message: `${coupon.code} applied successfully.`,
      };
    },
    [calculateDiscount]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const value = useMemo<CouponContextValue>(
    () => ({
      appliedCoupon,
      hydrated,
      applyCoupon,
      removeCoupon,
      calculateDiscount,
    }),
    [
      appliedCoupon,
      hydrated,
      applyCoupon,
      removeCoupon,
      calculateDiscount,
    ]
  );

  return (
    <CouponContext.Provider value={value}>
      {children}
    </CouponContext.Provider>
  );
}