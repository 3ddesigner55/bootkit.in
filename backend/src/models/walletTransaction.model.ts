import { model, models, Schema, type Types } from 'mongoose';

export const TRANSACTION_TYPES = {
  PROMOTIONAL_CREDIT: 'PROMOTIONAL_CREDIT',
  CASHBACK_CREDIT: 'CASHBACK_CREDIT',
  REFUND_CREDIT: 'REFUND_CREDIT',
  ORDER_DEBIT: 'ORDER_DEBIT',
  CREDIT_REVERSAL: 'CREDIT_REVERSAL',
  DEBIT_REVERSAL: 'DEBIT_REVERSAL',
  EXPIRY_DEBIT: 'EXPIRY_DEBIT',
  ADMIN_CORRECTION: 'ADMIN_CORRECTION',
} as const;

export const TRANSACTION_TYPES_LIST = Object.values(TRANSACTION_TYPES);

export type WalletTransactionDocument = {
  customer: Types.ObjectId;
  wallet: Types.ObjectId;
  direction: 'CREDIT' | 'DEBIT';
  transactionType: string;
  amount: number; // in paise
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  referenceType?: string | null;
  referenceId?: Types.ObjectId | string | null;
  idempotencyKey: string;
  adminReason?: string;
  actor?: Types.ObjectId | null;
  balanceBefore: number;
  balanceAfter: number;
  expiryDate?: Date | null;
  isReversed?: boolean;
  reversedAt?: Date | null;
  reversalOf?: Types.ObjectId | string | null;
  requestFingerprint?: string | null;
  createdAt: Date;
};

const walletTransactionSchema = new Schema<WalletTransactionDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    transactionType: {
      type: String,
      enum: TRANSACTION_TYPES_LIST,
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
    referenceType: { type: String, default: null },
    referenceId: { type: Schema.Types.Mixed, default: null },
    idempotencyKey: { type: String, required: true, unique: true },
    adminReason: { type: String, default: '' },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, default: null },
    isReversed: { type: Boolean, default: false },
    reversedAt: { type: Date, default: null },
    reversalOf: { type: Schema.Types.ObjectId, ref: 'WalletTransaction', index: true },
    requestFingerprint: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true });
walletTransactionSchema.index({ customer: 1, createdAt: -1 });
walletTransactionSchema.index(
  { reversalOf: 1 },
  {
    unique: true,
    partialFilterExpression: { reversalOf: { $exists: true, $type: 'objectId' } },
    name: 'reversalOf_unique_partial'
  }
);

const WalletTransaction =
  models.WalletTransaction ||
  model<WalletTransactionDocument>('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
