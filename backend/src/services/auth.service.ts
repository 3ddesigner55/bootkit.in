import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { randomInt } from 'node:crypto';

import { smsProvider } from '../config/sms';
import { HTTP_STATUS } from '../constants/httpStatus';
import Otp from '../models/otp.model';
import User, { type UserDocument } from '../models/user.model';
import { sendEmail } from './notification.service';
import type { ApiError } from '../types/api';
import { comparePassword, hashPassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token';
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  SendOtpInput,
  VerifyOtpInput,
} from '../validators/auth.validator';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

type AuthUser = Pick<
  UserDocument,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'role'
  | 'avatar'
  | 'isActive'
  | 'isVerified'
> & {
  _id: { toString(): string };
};

type AuthResult = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserDocument['role'];
    avatar: string;
    isActive: boolean;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
};

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function toAuthUser(user: AuthUser): AuthResult['user'] {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
    isVerified: user.isVerified,
  };
}

async function createAuthResult(user: AuthUser): Promise<AuthResult> {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    ...(user.email ? { email: user.email } : {}),
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await User.updateOne({ _id: user._id }, { refreshToken });

  return { user: toAuthUser(user), accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await User.findOne({
    $or: [{ email: input.email }, { phone: input.phone }],
  }).lean();

  if (existingUser?.email === input.email) {
    throw serviceError('Email is already registered.', HTTP_STATUS.CONFLICT);
  }

  if (existingUser?.phone === input.phone) {
    throw serviceError('Phone is already registered.', HTTP_STATUS.CONFLICT);
  }

  try {
    const user = await User.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: await hashPassword(input.password),
    });

    return createAuthResult(user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw serviceError(
        'Email or phone is already registered.',
        HTTP_STATUS.CONFLICT,
      );
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({
    email: input.email,
    isActive: true,
    deletedAt: null,
  }).select('+password');

  if (
    !user ||
    !user.password ||
    !(await comparePassword(input.password, user.password))
  ) {
    throw serviceError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return createAuthResult(user);
}

function generateOtp(): string {
  return randomInt(100_000, 1_000_000).toString();
}

function getOtpResendError(): ApiError {
  return serviceError(
    'Please wait 30 seconds before requesting another OTP.',
    HTTP_STATUS.TOO_MANY_REQUESTS,
  );
}

export async function sendOtp(input: SendOtpInput): Promise<{
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}> {

  const developmentOtp =
  process.env.NODE_ENV !== "production" &&
  /^\d{6}$/.test(process.env.DEV_OTP_CODE ?? "")
    ? process.env.DEV_OTP_CODE!
    : null;

 if (!smsProvider && !developmentOtp) {
  throw serviceError(
    "SMS provider is not configured.",
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
  }

  const now = new Date();
const otp = developmentOtp ?? generateOtp();
  const otpHash = await hashPassword(otp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
  const resendAfter = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS);

  let otpRecord;

  try {
    otpRecord = await Otp.findOneAndUpdate(
      {
        phone: input.phone,
        $or: [
          { lastSentAt: { $exists: false } },
          { lastSentAt: { $lte: resendAfter } },
        ],
      },
      { otpHash, expiresAt, lastSentAt: now },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).select('+otpHash');
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw getOtpResendError();
    }

    throw error;
  }

  if (smsProvider) {
  try {
    await smsProvider.sendOtp({
      phone: input.phone,
      otp,
    });
  } catch {
    await Otp.deleteOne({
      _id: otpRecord._id,
      otpHash,
    });

    throw serviceError(
      "Unable to send OTP. Please try again.",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }
}

  return {
    expiresInSeconds: OTP_EXPIRY_MS / 1000,
    resendAvailableInSeconds: 30,
  };
}

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResult> {
  const otpRecord = await Otp.findOne({
    phone: input.phone,
    expiresAt: { $gt: new Date() },
  }).select('+otpHash');

  if (!otpRecord || !(await comparePassword(input.otp, otpRecord.otpHash))) {
    throw serviceError('Invalid or expired OTP.', HTTP_STATUS.UNAUTHORIZED);
  }

  const consumedOtp = await Otp.findOneAndDelete({ _id: otpRecord._id });

  if (!consumedOtp) {
    throw serviceError('Invalid or expired OTP.', HTTP_STATUS.UNAUTHORIZED);
  }

  let user = await User.findOne({
    phone: input.phone,
    deletedAt: null,
  });

  if (user && !user.isActive) {
    throw serviceError('User account is blocked.', HTTP_STATUS.FORBIDDEN);
  }

  if (!user) {
    user = await User.create({
      phone: input.phone,
      isVerified: true,
      phoneVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    });
  } else {
    user.isVerified = true;
    user.phoneVerifiedAt = new Date();
    user.lastLoginAt = new Date();
    await user.save();
  }

  return createAuthResult(user);
}

export async function refreshUserSession(
  input: RefreshTokenInput,
): Promise<AuthResult> {
  let payload: ReturnType<typeof verifyRefreshToken>;

  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw serviceError(
      'Invalid or expired refresh token.',
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const user = await User.findOne({
    _id: payload.userId,
    isActive: true,
    deletedAt: null,
  }).select('+refreshToken');

  if (!user || user.refreshToken !== input.refreshToken) {
    throw serviceError(
      'Invalid or expired refresh token.',
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return createAuthResult(user);
}

export async function logoutUser(userId: string): Promise<void> {
  const user = await User.findOneAndUpdate(
    { _id: userId, isActive: true, deletedAt: null },
    { refreshToken: '' },
    { new: true },
  );

  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    isActive: true,
    deletedAt: null,
  });

  if (!user) {
    throw serviceError('User with this email not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Generate short-lived token
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    jwtConfig.accessSecret,
    { expiresIn: '15m' }
  );

  const resetLink = `http://localhost:3000/reset-password?code=${token}`;

  console.log('\n=========================================');
  console.log(`PASSWORD RESET REQUEST FOR: ${user.email}`);
  console.log(`Reset link: ${resetLink}`);
  console.log('=========================================\n');

  // Attempt to send email
  await sendEmail({
    to: user.email,
    subject: 'BootKit Password Reset Link',
    text: `Hello,\n\nYou requested a password reset for your BootKit account. Please click the link below to choose a new password:\n\n${resetLink}\n\nThis link will expire in 15 minutes. If you did not request this, please ignore this email.\n\nThank you,\nBootKit Team`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  let decoded: any;
  try {
    decoded = jwt.verify(token, jwtConfig.accessSecret);
  } catch {
    throw serviceError('Invalid or expired reset token.', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findOne({
    _id: decoded.userId,
    isActive: true,
    deletedAt: null,
  });

  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  user.password = await hashPassword(newPassword);
  await user.save();
}
