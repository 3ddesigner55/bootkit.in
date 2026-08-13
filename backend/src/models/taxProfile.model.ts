import { model, models, Schema, type Types } from 'mongoose';

export type TaxProfileDocument = {
  profileName: string;
  hsnCode: string;
  taxRate: number; // e.g. 18 for 18%
  priceMode: 'TAX_INCLUSIVE' | 'TAX_EXCLUSIVE';
  intraStateSplitRatio: number; // e.g. 0.5 splits GST evenly to CGST and SGST
  active: boolean;
  startDate: Date;
  endDate?: Date | null;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
};

const taxProfileSchema = new Schema<TaxProfileDocument>(
  {
    profileName: { type: String, required: true, trim: true },
    hsnCode: { type: String, required: true, trim: true },
    taxRate: { type: Number, required: true, min: 0 },
    priceMode: {
      type: String,
      enum: ['TAX_INCLUSIVE', 'TAX_EXCLUSIVE'],
      default: 'TAX_INCLUSIVE',
    },
    intraStateSplitRatio: { type: Number, default: 0.5, min: 0, max: 1 },
    active: { type: Boolean, default: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const TaxProfile =
  models.TaxProfile || model<TaxProfileDocument>('TaxProfile', taxProfileSchema);

export default TaxProfile;
