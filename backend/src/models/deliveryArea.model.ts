import { model, models, Schema, type Types } from 'mongoose';

export type DeliveryAreaDocument = {
  store: Types.ObjectId;
  pincode: string;
  areaName: string;
  active: boolean;
  minimumOrderAmountOverride?: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const deliveryAreaSchema = new Schema<DeliveryAreaDocument>(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    minimumOrderAmountOverride: {
      type: Number,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Compound unique mapping: store and pincode must be unique together
deliveryAreaSchema.index({ store: 1, pincode: 1 }, { unique: true });

// Partial unique check: only one active mapping per pincode across all stores
deliveryAreaSchema.index(
  { pincode: 1 },
  {
    name: 'unique_active_pincode_mapping',
    unique: true,
    partialFilterExpression: {
      active: true,
      deletedAt: null,
    },
  }
);

const DeliveryArea =
  models.DeliveryArea ||
  model<DeliveryAreaDocument>('DeliveryArea', deliveryAreaSchema);

export default DeliveryArea;
