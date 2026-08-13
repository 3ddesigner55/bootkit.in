import { model, models, Schema, type Types } from 'mongoose';

export type OrderItem = {
  product: Types.ObjectId;
  name: string;
  thumbnail: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  total: number;
};

export type OrderDocument = {
  orderNumber: string;
  user: Types.ObjectId;
  store: Types.ObjectId;
  address: Types.ObjectId;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  grandTotal: number;
  couponCode: string;
  couponDiscount: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentInitiatedAt?: Date | null;
  paymentCompletedAt?: Date | null;
  paymentFailedAt?: Date | null;
  paymentFailureReason?: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundedAt?: Date | null;
  status: string;
  statusHistory?: Array<{
    actor?: Types.ObjectId | null;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    timestamp: Date;
  }>;
  rider?: Types.ObjectId | null;
  cgst: number;
  sgst: number;
  igst: number;
  walletDebit: number;
  deliveryConfigVersion?: number;
  estimatedDeliveryTime?: Date | null;
  deliveredAt?: Date | null;
  cancelReason: string;
  cancelledAt?: Date | null;
  idempotencyKey?: string;
  requestFingerprint?: string;
};

const orderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      trim: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: 'At least one order item is required.',
      },
    },
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '', trim: true },
    couponDiscount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, required: true, trim: true },
    paymentStatus: { type: String, default: 'PENDING', trim: true },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    paymentInitiatedAt: { type: Date },
    paymentCompletedAt: { type: Date },
    paymentFailedAt: { type: Date },
    paymentFailureReason: { type: String, trim: true },
    refundId: { type: String, trim: true },
    refundStatus: { type: String, trim: true },
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
    status: { type: String, default: 'PENDING', trim: true },
    statusHistory: [
      {
        actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        oldStatus: { type: String, required: true },
        newStatus: { type: String, required: true },
        reason: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', default: null },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },
    walletDebit: { type: Number, default: 0, min: 0 },
    deliveryConfigVersion: { type: Number },
    estimatedDeliveryTime: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelReason: { type: String, default: '', trim: true },
    cancelledAt: { type: Date, default: null },
    idempotencyKey: { type: String, trim: true },
    requestFingerprint: { type: String, trim: true },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    name: 'uniq_user_idempotencyKey',
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);

const Order = models.Order || model<OrderDocument>('Order', orderSchema);

export default Order;



