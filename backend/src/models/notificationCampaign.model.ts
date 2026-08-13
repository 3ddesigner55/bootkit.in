import { model, models, Schema, type Types } from 'mongoose';

export type NotificationCampaignDocument = {
  campaignName: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetType: 'product' | 'category' | 'collection' | 'search' | 'offer' | 'internal_page';
  targetValue?: string;
  audienceType:
    | 'ALL_ACTIVE_CUSTOMERS'
    | 'CUSTOMERS_BY_HUB'
    | 'CUSTOMERS_BY_PINCODE'
    | 'NEW_CUSTOMERS'
    | 'CUSTOMERS_WITH_ORDERS'
    | 'INACTIVE_CUSTOMERS';
  scheduledAt?: Date | null;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PARTIALLY_FAILED' | 'FAILED' | 'CANCELLED';
  estimatedRecipients: number;
  attemptedCount: number;
  successCount: number;
  failureCount: number;
  invalidTokenCount: number;
  providerReference?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
};

const notificationCampaignSchema = new Schema<NotificationCampaignDocument>(
  {
    campaignName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    targetType: {
      type: String,
      enum: ['product', 'category', 'collection', 'search', 'offer', 'internal_page'],
      required: true,
    },
    targetValue: { type: String, default: '' },
    audienceType: {
      type: String,
      enum: [
        'ALL_ACTIVE_CUSTOMERS',
        'CUSTOMERS_BY_HUB',
        'CUSTOMERS_BY_PINCODE',
        'NEW_CUSTOMERS',
        'CUSTOMERS_WITH_ORDERS',
        'INACTIVE_CUSTOMERS',
      ],
      default: 'ALL_ACTIVE_CUSTOMERS',
    },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PARTIALLY_FAILED', 'FAILED', 'CANCELLED'],
      default: 'DRAFT',
    },
    estimatedRecipients: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    invalidTokenCount: { type: Number, default: 0 },
    providerReference: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const NotificationCampaign =
  models.NotificationCampaign ||
  model<NotificationCampaignDocument>('NotificationCampaign', notificationCampaignSchema);

export default NotificationCampaign;
