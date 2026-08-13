import { model, models, Schema, type Types } from 'mongoose';

export type CouponRedemptionDocument = {
  coupon: Types.ObjectId;
  customer: Types.ObjectId;
  order: Types.ObjectId;
  store: Types.ObjectId;
  discountAmount: number;
  status: 'RESERVED' | 'REDEEMED' | 'RELEASED' | 'CANCELLED';
  idempotencyKey: string;
  reservedAt: Date;
  redeemedAt?: Date | null;
  releasedAt?: Date | null;
};

const couponRedemptionSchema = new Schema<CouponRedemptionDocument>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['RESERVED', 'REDEEMED', 'RELEASED', 'CANCELLED'],
      default: 'RESERVED',
    },
    idempotencyKey: { type: String, required: true, unique: true },
    reservedAt: { type: Date, default: Date.now },
    redeemedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

couponRedemptionSchema.index({ idempotencyKey: 1 }, { unique: true });

const CouponRedemption =
  models.CouponRedemption ||
  model<CouponRedemptionDocument>('CouponRedemption', couponRedemptionSchema);

export default CouponRedemption;
