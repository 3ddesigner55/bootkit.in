export type CouponDiscountType = "PERCENTAGE" | "FLAT";

export type Coupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  active: boolean;
  firstOrderOnly: boolean;
  expiresAt: string;
};

export type AppliedCoupon = {
  coupon: Coupon;
  discountAmount: number;
};

export type CouponContextValue = {
  appliedCoupon: AppliedCoupon | null;
  hydrated: boolean;
  applyCoupon: (
    couponCode: string,
    subtotal: number,
    hasPreviousOrders?: boolean
  ) => {
    success: boolean;
    message: string;
  };
  removeCoupon: () => void;
  calculateDiscount: (
    coupon: Coupon,
    subtotal: number
  ) => number;
};