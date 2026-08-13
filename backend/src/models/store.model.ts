import { model, models, Schema, type Types } from 'mongoose';

export type StoreDocument = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  managerName: string;
  managerPhone: string;
  deliveryRadius: number;
  minimumOrderAmount: number;
  active: boolean;
  featured: boolean;
  isDefault: boolean;
  displayOrder: number;
  openingTime: string;
  closingTime: string;
  operationalStatus: 'OPEN' | 'CLOSED' | 'TEMPORARILY_OFFLINE' | 'MAINTENANCE';
  weeklySchedule?: Array<{
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    enabled: boolean;
    intervals: Array<{ open: string; close: string }>;
  }>;
  emergencyOffline?: {
    offlineUntil?: Date | null;
    reason: string;
    startedAt: Date;
    restoredAt?: Date | null;
    actorId: Types.ObjectId;
  } | null;
  seller?: Types.ObjectId | null;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const storeSchema = new Schema<StoreDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    logo: { type: String, default: '', trim: true },
    banner: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, default: '', trim: true },
    addressLine2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, default: '', trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    managerName: { type: String, default: '', trim: true },
    managerPhone: { type: String, default: '', trim: true },
    deliveryRadius: { type: Number, required: true, min: Number.EPSILON },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    openingTime: { type: String, default: '', trim: true },
    closingTime: { type: String, default: '', trim: true },
    operationalStatus: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'TEMPORARILY_OFFLINE', 'MAINTENANCE'],
      default: 'OPEN',
    },
    weeklySchedule: [
      {
        day: {
          type: String,
          enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
          required: true,
        },
        enabled: { type: Boolean, default: true },
        intervals: [
          {
            open: { type: String, required: true },
            close: { type: String, required: true },
          },
        ],
      },
    ],
    emergencyOffline: {
      offlineUntil: { type: Date, default: null },
      reason: { type: String, default: '' },
      startedAt: { type: Date },
      restoredAt: { type: Date, default: null },
      actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    },

    seller: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

storeSchema.index({ slug: 1 }, { unique: true });
storeSchema.index({ city: 1 });
storeSchema.index({ active: 1 });
storeSchema.index({ featured: 1 });
storeSchema.index({ displayOrder: 1 });
storeSchema.index({ seller: 1 });
storeSchema.index(
  { isDefault: 1 },
  {
    name: 'unique_active_default_store',
    unique: true,
    partialFilterExpression: {
      isDefault: true,
      active: true,
      deletedAt: null,
    },
  }
);

const Store = models.Store || model<StoreDocument>('Store', storeSchema);

export default Store;
