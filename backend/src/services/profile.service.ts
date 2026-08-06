import User from '../models/user.model';
import type { ApiError } from '../types/api';
import { comparePassword, hashPassword } from '../utils/password';
import type {
  ChangePasswordInput,
  ProfileUpdateInput,
} from '../validators/profile.validator';
import { HTTP_STATUS } from '../constants/httpStatus';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function getActiveUserFilter(userId: string) {
  return { _id: userId, isActive: true, deletedAt: null };
}

export async function getProfile(userId: string) {
  const user = await User.findOne(getActiveUserFilter(userId))
    .select('-password -refreshToken')
    .lean();

  if (!user) {
    throw serviceError('Profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const user = await User.findOneAndUpdate(getActiveUserFilter(userId), input, {
    new: true,
    runValidators: true,
  })
    .select('-password -refreshToken')
    .lean();

  if (!user) {
    throw serviceError('Profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await User.findOne(getActiveUserFilter(userId)).select(
    '+password +refreshToken',
  );

  if (!user) {
    throw serviceError('Profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  const passwordMatches = await comparePassword(
    input.currentPassword,
    user.password,
  );

  if (!passwordMatches) {
    throw serviceError(
      'Current password is incorrect.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  user.password = await hashPassword(input.newPassword);
  user.refreshToken = '';
  await user.save();
}

export async function logoutAllSessions(userId: string): Promise<void> {
  const user = await User.findOneAndUpdate(
    getActiveUserFilter(userId),
    { refreshToken: '' },
    { new: true },
  );

  if (!user) {
    throw serviceError('Profile not found.', HTTP_STATUS.NOT_FOUND);
  }
}
