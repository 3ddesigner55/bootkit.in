import { model, models, Schema, type Types } from 'mongoose';

import { ROLE_VALUES, type Role } from '../constants/roles';

export type UserDocument = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  securityHistory?: Array<{
    action: string;
    reason: string;
    actorId: Types.ObjectId;
    timestamp: Date;
  }>;
  sellerStatus?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | null;
  assignedStores?: Types.ObjectId[];
  avatar: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  refreshToken: string;
  lastLoginAt?: Date | null;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, default: '', trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, select: false },
    role: {
      type: String,
      required: true,
      enum: ROLE_VALUES,
      default: 'CUSTOMER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    securityHistory: [
      {
        action: { type: String, required: true },
        reason: { type: String, default: '' },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sellerStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', null],
      default: null,
    },
    assignedStores: [{ type: Schema.Types.ObjectId, ref: 'Store' }],
    avatar: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    refreshToken: { type: String, default: '', select: false },
    lastLoginAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ assignedStores: 1 });

const User = models.User || model<UserDocument>('User', userSchema);

export default User;
