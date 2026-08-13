import { model, models, Schema, type Types } from 'mongoose';

export type CartItem = {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  price: number;
};

export type CartDocument = {
  user: Types.ObjectId;
  store?: Types.ObjectId | null;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
};

const cartItemSchema = new Schema<CartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const cartSchema = new Schema<CartDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    items: { type: [cartItemSchema], default: [] },
    totalItems: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true, name: 'uniq_user_cart' });
cartSchema.index({ store: 1 });

const Cart = models.Cart || model<CartDocument>('Cart', cartSchema);


export default Cart;
