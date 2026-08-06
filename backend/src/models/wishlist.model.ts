import { model, models, Schema, type Types } from 'mongoose';

export type WishlistItem = {
  product: Types.ObjectId;
};

export type WishlistDocument = {
  user: Types.ObjectId;
  items: WishlistItem[];
};

const wishlistItemSchema = new Schema<WishlistItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
});

const wishlistSchema = new Schema<WishlistDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

wishlistSchema.index({ user: 1 }, { unique: true });

const Wishlist =
  models.Wishlist || model<WishlistDocument>('Wishlist', wishlistSchema);

export default Wishlist;
