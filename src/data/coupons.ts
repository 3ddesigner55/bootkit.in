import type { Coupon } from "@/types/coupon";

export const coupons: Coupon[] = [
  {
    id: "coupon-welcome50",
    code: "WELCOME50",
    title: "₹50 off on your first order",
    description: "Get ₹50 discount on orders above ₹299.",
    discountType: "FLAT",
    discountValue: 50,
    minimumOrder: 299,
    active: true,
    firstOrderOnly: true,
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
  {
    id: "coupon-bootkit10",
    code: "BOOTKIT10",
    title: "10% off",
    description: "Save 10% up to ₹100 on orders above ₹499.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumOrder: 499,
    maximumDiscount: 100,
    active: true,
    firstOrderOnly: false,
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
  {
    id: "coupon-save75",
    code: "SAVE75",
    title: "Flat ₹75 off",
    description: "Get ₹75 discount on orders above ₹699.",
    discountType: "FLAT",
    discountValue: 75,
    minimumOrder: 699,
    active: true,
    firstOrderOnly: false,
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
  {
    id: "coupon-freedelivery",
    code: "FREEDEL",
    title: "₹29 delivery discount",
    description: "Get ₹29 off on orders above ₹199.",
    discountType: "FLAT",
    discountValue: 29,
    minimumOrder: 199,
    active: true,
    firstOrderOnly: false,
    expiresAt: "2027-12-31T23:59:59.000Z",
  },
];

export function getActiveCoupons() {
  const now = Date.now();

  return coupons.filter(
    (coupon) =>
      coupon.active &&
      new Date(coupon.expiresAt).getTime() > now
  );
}

export function getCouponByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  return getActiveCoupons().find(
    (coupon) => coupon.code === normalizedCode
  );
}