import { model, models, Schema, type Types } from 'mongoose';

export type DeviceTokenDocument = {
  customer: Types.ObjectId;
  deviceInstallationId: string;
  pushToken: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  appVersion: string;
  active: boolean;
  permissionStatus: 'GRANTED' | 'DENIED' | 'UNDETERMINED';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
};

const deviceTokenSchema = new Schema<DeviceTokenDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceInstallationId: { type: String, required: true, index: true },
    pushToken: { type: String, required: true },
    platform: { type: String, enum: ['IOS', 'ANDROID', 'WEB'], required: true },
    appVersion: { type: String, default: '1.0.0' },
    active: { type: Boolean, default: true },
    permissionStatus: {
      type: String,
      enum: ['GRANTED', 'DENIED', 'UNDETERMINED'],
      default: 'UNDETERMINED',
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

deviceTokenSchema.index({ customer: 1, deviceInstallationId: 1 }, { unique: true });

const DeviceToken =
  models.DeviceToken || model<DeviceTokenDocument>('DeviceToken', deviceTokenSchema);

export default DeviceToken;
