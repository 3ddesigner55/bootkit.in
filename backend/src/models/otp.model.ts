import { model, models, Schema } from 'mongoose';

export type OtpDocument = {
  phone: string;
  otpHash: string;
  expiresAt: Date;
  lastSentAt: Date;
};

const otpSchema = new Schema<OtpDocument>(
  {
    phone: { type: String, required: true, trim: true, unique: true },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = models.Otp || model<OtpDocument>('Otp', otpSchema);

export default Otp;
