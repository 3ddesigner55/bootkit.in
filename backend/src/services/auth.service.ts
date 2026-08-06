import User, { type UserDocument } from '../models/user.model';
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
} from '../validators/auth.validator';
import { HTTP_STATUS } from '../constants/httpStatus';

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
    email: user.email,
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

  if (!user || !(await comparePassword(input.password, user.password))) {
    throw serviceError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  user.lastLoginAt = new Date();
  await user.save();

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
