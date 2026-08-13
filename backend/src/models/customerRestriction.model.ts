import { model, models, Schema, type Types } from 'mongoose';

export type RestrictionType =
  | 'ACCOUNT_BLOCKED'
  | 'ORDERING_BLOCKED'
  | 'COD_DISABLED';

export type CustomerRestrictionDocument = {
  customer: Types.ObjectId;
  restrictionType: RestrictionType;
  active: boolean;
  reasonCode: string;
  note: string;
  startsAt: Date;
  expiresAt?: Date | null;
  createdBy: Types.ObjectId;
  removedBy?: Types.ObjectId | null;
  removedAt?: Date | null;
  removalReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const customerRestrictionSchema = new Schema<CustomerRestrictionDocument>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restrictionType: {
      type: String,
      enum: ['ACCOUNT_BLOCKED', 'ORDERING_BLOCKED', 'COD_DISABLED'],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    reasonCode: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removalReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

customerRestrictionSchema.index({ customer: 1, active: 1 });
customerRestrictionSchema.index({ customer: 1, restrictionType: 1 });

const CustomerRestriction =
  models.CustomerRestriction ||
  model<CustomerRestrictionDocument>('CustomerRestriction', customerRestrictionSchema);

export default CustomerRestriction;
