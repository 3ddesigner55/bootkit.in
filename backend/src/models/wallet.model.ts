import { model, models, Schema, type Types } from 'mongoose';

export type WalletDocument = {
  customer: Types.ObjectId;
  balance: number; // in paise
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
};

const walletSchema = new Schema<WalletDocument>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true },
);

const Wallet = models.Wallet || model<WalletDocument>('Wallet', walletSchema);
export default Wallet;
