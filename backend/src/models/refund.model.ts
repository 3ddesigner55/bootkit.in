import { model, models, Schema, type Types } from 'mongoose';

export type RefundDocument = {
  order: Types.ObjectId;
  returnRequest?: Types.ObjectId | null;
  paymentTransaction?: string | null;
  amount: number; // represented in paise
  type: 'FULL' | 'PARTIAL';
  paymentProviderRefundId?: string | null;
  idempotencyKey: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  reason: string;
  initiatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const refundSchema = new Schema<RefundDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    returnRequest: { type: Schema.Types.ObjectId, ref: 'ReturnRequest', default: null },
    paymentTransaction: { type: String, default: null },
    amount: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['FULL', 'PARTIAL'], required: true },
    paymentProviderRefundId: { type: String, default: null },
    idempotencyKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'],
      default: 'PENDING',
    },
    reason: { type: String, required: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

refundSchema.index({ idempotencyKey: 1 }, { unique: true });

const Refund = models.Refund || model<RefundDocument>('Refund', refundSchema);

export default Refund;
