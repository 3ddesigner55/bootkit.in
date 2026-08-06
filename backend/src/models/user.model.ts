import { model, models, Schema, type Types } from 'mongoose';

import { ROLE_VALUES, type Role } from '../constants/roles';

export type UserDocument = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
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
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ROLE_VALUES,
      default: 'CUSTOMER',
    },
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

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

const User = models.User || model<UserDocument>('User', userSchema);

export default User;
