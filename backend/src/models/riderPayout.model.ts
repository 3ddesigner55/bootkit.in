import { model, models, Schema, type Types } from 'mongoose';

export type RiderPayoutDocument = {
  rider: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  deliveredOrderCount: number;
  grossEarnings: number; // paise
  adjustments: number; // paise
  netPayable: number; // paise
  payoutMethod: 'BANK_TRANSFER' | 'UPI';
  bankReferenceSecure?: string;
  paymentUtr?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  paidBy?: Types.ObjectId;
  paidAt?: Date;
  failureReason?: string;
  idempotencyKey: string;
};

const riderPayoutSchema = new Schema<RiderPayoutDocument>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    deliveredOrderCount: { type: Number, default: 0, min: 0 },
    grossEarnings: { type: Number, required: true, min: 0 },
    adjustments: { type: Number, default: 0 },
    netPayable: { type: Number, required: true, min: 0 },
    payoutMethod: { type: String, enum: ['BANK_TRANSFER', 'UPI'], default: 'UPI' },
    bankReferenceSecure: { type: String, default: '' },
    paymentUtr: { type: String, default: '' },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'DRAFT',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
    failureReason: { type: String, default: '' },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

riderPayoutSchema.index({ idempotencyKey: 1 }, { unique: true });

const RiderPayout =
  models.RiderPayout ||
  model<RiderPayoutDocument>('RiderPayout', riderPayoutSchema);

export default RiderPayout;
