import DeliveryArea from '../models/deliveryArea.model';
import Store from '../models/store.model';
import SystemSettings from '../models/systemSettings.model';
import TaxProfile from '../models/taxProfile.model';
import Coupon from '../models/coupon.model';
import CouponRedemption from '../models/couponRedemption.model';
import Product from '../models/product.model';
import Address from '../models/address.model';
import Wallet from '../models/wallet.model';

export type CalculationQuoteInput = {
  storeId: string;
  pincode: string;
  addressId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    sellingPrice?: number; // optionally override for admin preview
  }>;
  couponCode?: string;
  useWallet?: boolean;
  userId: string;
};

export type OrderCalculationResult = {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  walletDebit: number;
  grandTotal: number;
  couponDiscount: number;
  appliedCoupon?: string;
  deliveryConfigVersion?: number;
  taxProfileVersion?: string;
  itemDetails: Array<{
    product: string;
    quantity: number;
    price: number;
    total: number;
    tax: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
};

export async function calculateOrderTotal(input: CalculationQuoteInput): Promise<OrderCalculationResult> {
  const store = await Store.findById(input.storeId);
  if (!store || store.deletedAt) {
    throw new Error('Store not found.');
  }

  // Check if store is operationally available
  if (store.operationalStatus === 'TEMPORARILY_OFFLINE') {
    throw new Error('This store is temporarily offline and not accepting new orders.');
  }

  // 1. Resolve delivery settings & service area
  let minOrderVal = store.minimumOrderAmount || 0;
  let deliveryFee = 0;
  let freeDeliveryThresh = 0;
  let configVersion = 1;

  // Query DeliveryArea pincode mapping
  const area = await DeliveryArea.findOne({ store: store._id, pincode: input.pincode, active: true, deletedAt: null });
  if (area) {
    minOrderVal = area.minimumOrderAmountOverride !== undefined ? area.minimumOrderAmountOverride : minOrderVal;
    deliveryFee = area.deliveryFee;
    freeDeliveryThresh = minOrderVal; // default free delivery threshold matches minOrder
  } else {
    // Fallback to active SystemSettings config
    const globalSettings = await SystemSettings.findOne({ scope: 'DELIVERY', status: 'PUBLISHED' });
    if (globalSettings) {
      minOrderVal = globalSettings.value.minimumOrderValue || 0;
      deliveryFee = globalSettings.value.baseDeliveryFee || 0;
      freeDeliveryThresh = globalSettings.value.freeDeliveryThreshold || 0;
      configVersion = globalSettings.configVersion;
    }
  }

  // 2. Resolve items & compute subtotal
  let subtotal = 0;
  const itemDetails: OrderCalculationResult['itemDetails'] = [];

  for (const item of input.items) {
    const product = await Product.findOne({ _id: item.productId, active: true, deletedAt: null });
    if (!product) {
      throw new Error(`Product not found or inactive: ${item.productId}`);
    }
    const price = item.sellingPrice !== undefined ? item.sellingPrice : product.sellingPrice;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    // Resolve GST/Tax profile
    let taxProfile = await TaxProfile.findOne({ _id: product.taxProfile, active: true, deletedAt: null });
    if (!taxProfile && product.category) {
      taxProfile = await TaxProfile.findOne({ category: product.category, active: true, deletedAt: null });
    }
    if (!taxProfile) {
      taxProfile = await TaxProfile.findOne({ active: true, deletedAt: null });
    }

    let taxAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (taxProfile) {
      const rate = taxProfile.taxRate;
      if (taxProfile.priceMode === 'TAX_EXCLUSIVE') {
        taxAmount = Math.round((itemTotal * rate) / 100);
      } else {
        taxAmount = Math.round(itemTotal - (itemTotal / (1 + rate / 100)));
      }

      // State 공급지 판단 supply state matching
      let isIntraState = true;
      if (input.addressId) {
        const address = await Address.findById(input.addressId);
        if (address && address.state.toLowerCase() !== store.state.toLowerCase()) {
          isIntraState = false;
        }
      }

      if (isIntraState) {
        cgst = Math.round(taxAmount * taxProfile.intraStateSplitRatio || taxAmount * 0.5);
        sgst = taxAmount - cgst;
      } else {
        igst = taxAmount;
      }
    }

    itemDetails.push({
      product: product._id.toString(),
      quantity: item.quantity,
      price,
      total: itemTotal,
      tax: taxAmount,
      cgst,
      sgst,
      igst,
    });
  }

  // Validate minimum order limit
  if (subtotal < minOrderVal) {
    throw new Error(`Order subtotal (₹${(subtotal / 100).toFixed(2)}) is below the minimum required order amount (₹${(minOrderVal / 100).toFixed(2)}).`);
  }

  // 3. Coupon eligibility check
  let couponDiscount = 0;
  let appliedCoupon: string | undefined;

  if (input.couponCode) {
    const codeUpper = input.couponCode.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: codeUpper, active: true, deletedAt: null });
    if (!coupon || coupon.startDate > new Date() || coupon.endDate < new Date()) {
      throw new Error('Invalid or expired coupon code.');
    }
    if (subtotal < coupon.minOrderValue) {
      throw new Error(`Coupon requires a minimum order value of ₹${(coupon.minOrderValue / 100).toFixed(2)}.`);
    }

    // Verify customer redemptions
    const redemptionCount = await CouponRedemption.countDocuments({ coupon: coupon._id, customer: input.userId, status: 'REDEEMED' });
    if (redemptionCount >= coupon.perCustomerLimit) {
      throw new Error('Coupon usage limit reached for this customer.');
    }

    // Calculate coupon discount
    if (coupon.discountType === 'FLAT') {
      couponDiscount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE') {
      couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FREE_DELIVERY') {
      couponDiscount = deliveryFee;
    }

    couponDiscount = Math.min(couponDiscount, subtotal);
    appliedCoupon = coupon.code;
  }

  // 4. Delivery Fee determination
  const merchandiseTotal = subtotal - couponDiscount;
  let finalDeliveryCharge = deliveryFee;
  if (merchandiseTotal >= freeDeliveryThresh) {
    finalDeliveryCharge = 0;
  }

  // Adjust coupon if free delivery discount was selected
  if (input.couponCode) {
    const coupon = await Coupon.findOne({ code: input.couponCode.toUpperCase().trim() });
    if (coupon && coupon.discountType === 'FREE_DELIVERY') {
      couponDiscount = finalDeliveryCharge;
      finalDeliveryCharge = 0;
    }
  }

  // 5. Aggregate Taxes
  const totalTax = itemDetails.reduce((sum, item) => sum + item.tax, 0);
  const cgstTotal = itemDetails.reduce((sum, item) => sum + item.cgst, 0);
  const sgstTotal = itemDetails.reduce((sum, item) => sum + item.sgst, 0);
  const igstTotal = itemDetails.reduce((sum, item) => sum + item.igst, 0);

  // 6. Wallet calculation
  let walletDebit = 0;
  const payableTotal = merchandiseTotal + finalDeliveryCharge;

  if (input.useWallet) {
    const wallet = await Wallet.findOne({ customer: input.userId, status: 'ACTIVE' });
    if (wallet && wallet.balance > 0) {
      walletDebit = Math.min(wallet.balance, payableTotal);
    }
  }

  const grandTotal = payableTotal - walletDebit;

  return {
    subtotal,
    discount: couponDiscount,
    deliveryCharge: finalDeliveryCharge,
    tax: totalTax,
    cgst: cgstTotal,
    sgst: sgstTotal,
    igst: igstTotal,
    walletDebit,
    grandTotal,
    couponDiscount,
    appliedCoupon,
    deliveryConfigVersion: configVersion,
    itemDetails,
  };
}
