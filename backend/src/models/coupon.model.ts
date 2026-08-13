import { model, models, Schema, type Types } from 'mongoose';

export type CouponDocument = {
  displayName: string;
  code: string; // unique, uppercase
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE' | 'FREE_DELIVERY' | 'WALLET_CASHBACK';
  discountValue: number; // positive
  maxDiscount?: number; // positive
  minOrderValue: number; // positive, default 0
  startDate: Date;
  endDate: Date;
  totalUsageLimit?: number;
  perCustomerLimit: number;
  firstOrderOnly: boolean;
  active: boolean;
  stackable: boolean;
  eligibleStores: Types.ObjectId[];
  eligibleCategories: Types.ObjectId[];
  eligibleProducts: Types.ObjectId[];
  eligibleBrands: Types.ObjectId[];
  excludedProducts: Types.ObjectId[];
  excludedCategories: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
};

const couponSchema = new Schema<CouponDocument>(
  {
    displayName: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', trim: true },
    discountType: {
      type: String,
      enum: ['FLAT', 'PERCENTAGE', 'FREE_DELIVERY', 'WALLET_CASHBACK'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: Number.EPSILON },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalUsageLimit: { type: Number, min: 1 },
    perCustomerLimit: { type: Number, default: 1, min: 1 },
    firstOrderOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    stackable: { type: Boolean, default: false },
    eligibleStores: [{ type: Schema.Types.ObjectId, ref: 'Store' }],
    eligibleCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    eligibleProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    eligibleBrands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    excludedCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1 });

const Coupon = models.Coupon || model<CouponDocument>('Coupon', couponSchema);
export default Coupon;
