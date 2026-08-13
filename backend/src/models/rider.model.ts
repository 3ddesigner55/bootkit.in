import { model, models, Schema, type Types } from 'mongoose';

export type RiderDocument = {
  user: Types.ObjectId;
  riderCode: string;
  assignedStore: Types.ObjectId;
  onboardingStatus: 'DRAFT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'OFFBOARDED';
  availabilityStatus: 'OFFLINE' | 'AVAILABLE' | 'ASSIGNED' | 'ON_DELIVERY' | 'STALE';
  licenseNumber: string;
  licenseHolderName: string;
  licenseExpiryDate: Date;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  vehicleType: string;
  vehicleRegNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  rcDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  insuranceExpiryDate?: Date;
  earningsBalance: number; // paise
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    recordedAt: Date;
  } | null;
  lastHeartbeatAt?: Date | null;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
};

const riderSchema = new Schema<RiderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    riderCode: { type: String, required: true, unique: true, index: true },
    assignedStore: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    onboardingStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED', 'OFFBOARDED'],
      default: 'DRAFT',
    },
    availabilityStatus: {
      type: String,
      enum: ['OFFLINE', 'AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'STALE'],
      default: 'OFFLINE',
    },
    licenseNumber: { type: String, required: true, trim: true },
    licenseHolderName: { type: String, required: true, trim: true },
    licenseExpiryDate: { type: Date, required: true },
    licenseFrontImage: { type: String, default: '' },
    licenseBackImage: { type: String, default: '' },
    vehicleType: { type: String, required: true, trim: true },
    vehicleRegNumber: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    vehicleColor: { type: String, required: true, trim: true },
    rcDocumentUrl: { type: String, default: '' },
    insuranceDocumentUrl: { type: String, default: '' },
    insuranceExpiryDate: { type: Date },
    earningsBalance: { type: Number, default: 0, min: 0 },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      recordedAt: { type: Date },
    },
    lastHeartbeatAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Rider = models.Rider || model<RiderDocument>('Rider', riderSchema);

export default Rider;
