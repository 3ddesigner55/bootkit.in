import { model, models, Schema, type Types } from 'mongoose';

export type RiderEarningDocument = {
  rider: Types.ObjectId;
  store: Types.ObjectId;
  order?: Types.ObjectId | null;
  transactionType: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number; // paise
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  idempotencyKey: string;
  balanceBefore: number;
  balanceAfter: number;
  actor?: Types.ObjectId | null;
  reason?: string;
  createdAt: Date;
};

const riderEarningSchema = new Schema<RiderEarningDocument>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    transactionType: {
      type: String,
      enum: [
        'DELIVERY_EARNING',
        'DISTANCE_EARNING',
        'INCENTIVE',
        'BONUS',
        'CANCELLATION_COMPENSATION',
        'ADJUSTMENT_CREDIT',
        'ADJUSTMENT_DEBIT',
        'PAYOUT_DEBIT',
        'PAYOUT_REVERSAL',
      ],
      required: true,
    },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
    idempotencyKey: { type: String, required: true, unique: true },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

riderEarningSchema.index({ idempotencyKey: 1 }, { unique: true });

const RiderEarning =
  models.RiderEarning ||
  model<RiderEarningDocument>('RiderEarning', riderEarningSchema);

export default RiderEarning;
