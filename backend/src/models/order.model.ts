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
  status: string;
  estimatedDeliveryTime?: Date | null;
  deliveredAt?: Date | null;
  cancelReason: string;
  cancelledAt?: Date | null;
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
    status: { type: String, default: 'PENDING', trim: true },
    estimatedDeliveryTime: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelReason: { type: String, default: '', trim: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = models.Order || model<OrderDocument>('Order', orderSchema);

export default Order;
