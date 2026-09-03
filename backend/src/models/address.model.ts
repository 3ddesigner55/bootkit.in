import { model, models, Schema, type Types } from 'mongoose';

export type AddressDocument = {
  user: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  deliveryInstructions: string;
  isDefault: boolean;
  recipientType: 'MYSELF' | 'SOMEONE_ELSE';
  googleMapsLink?: string;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const addressSchema = new Schema<AddressDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    deliveryInstructions: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
    recipientType: {
      type: String,
      enum: ['MYSELF', 'SOMEONE_ELSE'],
      default: 'MYSELF',
      required: true,
    },
    googleMapsLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          if (!v.startsWith('https://')) return false;
          if (v.length > 1000) return false;
          try {
            const url = new URL(v);
            const allowedHosts = [
              'maps.google.com',
              'google.com',
              'www.google.com',
              'goo.gl',
              'maps.app.goo.gl'
            ];
            const isHostAllowed = allowedHosts.some(h =>
              url.hostname === h || url.hostname.endsWith('.' + h)
            );
            if (!isHostAllowed) return false;
            if (url.protocol !== 'https:') return false;
            return true;
          } catch (e) {
            return false;
          }
        },
        message: 'Invalid Google Maps link. Must be a secure HTTPS URL from Google Maps.',
      },
    },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1 });
addressSchema.index({ postalCode: 1 });
addressSchema.index({ city: 1 });
addressSchema.index({ isDefault: 1 });
addressSchema.index(
  { user: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true, deletedAt: null },
  },
);

const Address =
  models.Address || model<AddressDocument>('Address', addressSchema);

export default Address;
