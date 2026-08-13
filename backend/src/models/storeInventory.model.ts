import { model, models, Schema, type Types } from 'mongoose';

export type StoreInventoryDocument = {
  store: Types.ObjectId;
  product: Types.ObjectId;
  variantSku: string;
  stock: number;
  reservedStock: number;
  sellingPrice: number;
  mrp: number;
  costPrice?: number;
  discountPercent?: number;
  active: boolean;
  trackInventory: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const storeInventorySchema = new Schema<StoreInventoryDocument>(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variantSku: {
      type: String,
      default: '',
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

storeInventorySchema.virtual('availableStock').get(function (
  this: StoreInventoryDocument,
) {
  return Math.max(0, (this.stock || 0) - (this.reservedStock || 0));
});

// Compound unique index ensuring one inventory record per (store, product, variantSku)
storeInventorySchema.index(
  { store: 1, product: 1, variantSku: 1 },
  { unique: true },
);

storeInventorySchema.index({ store: 1, active: 1 });
storeInventorySchema.index({ product: 1, active: 1 });

const StoreInventory =
  models.StoreInventory ||
  model<StoreInventoryDocument>('StoreInventory', storeInventorySchema);

export default StoreInventory;
