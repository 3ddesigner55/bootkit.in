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
  displayOrder: number;
  openingTime: string;
  closingTime: string;
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
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    managerName: { type: String, default: '', trim: true },
    managerPhone: { type: String, default: '', trim: true },
    deliveryRadius: { type: Number, default: 0, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    openingTime: { type: String, default: '', trim: true },
    closingTime: { type: String, default: '', trim: true },
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

const Store = models.Store || model<StoreDocument>('Store', storeSchema);

export default Store;
