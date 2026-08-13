import { model, models, Schema, type Types } from 'mongoose';

export type SystemSettingsDocument = {
  scope: 'DELIVERY' | 'GLOBAL';
  configVersion: number;
  value: Record<string, any>;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date | null;
};

const systemSettingsSchema = new Schema<SystemSettingsDocument>(
  {
    scope: {
      type: String,
      enum: ['DELIVERY', 'GLOBAL'],
      required: true,
      index: true,
    },
    configVersion: { type: Number, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    effectiveFrom: { type: Date, default: null },
    effectiveTo: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

systemSettingsSchema.index({ scope: 1, configVersion: 1 }, { unique: true });

const SystemSettings =
  models.SystemSettings ||
  model<SystemSettingsDocument>('SystemSettings', systemSettingsSchema);

export default SystemSettings;
