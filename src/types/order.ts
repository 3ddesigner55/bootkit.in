import type { CartItem } from "@/types/cart";

export type AddressType = "Home" | "Office" | "Other";

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
};

export type PaymentMethod = "COD" | "UPI" | "CARD" | "NET_BANKING" | "WALLET";

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Packing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Verification Pending"
  | "Failed";

export type BootkitOrder = {
  id: string;
  orderNumber: string;
  items: CartItem[];
  address: CheckoutAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  itemTotal: number;
  deliveryFee: number;
  totalAmount: number;
  savings: number;
  offerCode?: string;
  offerDiscount?: number;
  upiTransactionId?: string;
  createdAt: string;
  updatedAt: string;
};
