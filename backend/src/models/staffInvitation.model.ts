import { model, models, Schema, type Types } from 'mongoose';

export type StaffInvitationDocument = {
  email: string;
  name: string;
  assignedRole: string; // references CustomRole.name or ROLES constants
  invitedBy: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  acceptedAt?: Date | null;
};

const staffInvitationSchema = new Schema<StaffInvitationDocument>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    assignedRole: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const StaffInvitation =
  models.StaffInvitation ||
  model<StaffInvitationDocument>('StaffInvitation', staffInvitationSchema);

export default StaffInvitation;
