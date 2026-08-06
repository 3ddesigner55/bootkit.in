import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  changePassword,
  getProfile,
  logoutAllSessions,
  updateProfile,
} from '../services/profile.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  ChangePasswordInput,
  ProfileUpdateInput,
} from '../validators/profile.validator';

export async function getProfileController(
  request: Request,
  response: Response,
) {
  const profile = await getProfile(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    profile,
    'Profile retrieved successfully.',
  );
}

export async function updateProfileController(
  request: Request,
  response: Response,
) {
  const profile = await updateProfile(
    request.user!.id,
    response.locals.profileUpdate as ProfileUpdateInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    profile,
    'Profile updated successfully.',
  );
}

export async function changePasswordController(
  request: Request,
  response: Response,
) {
  await changePassword(
    request.user!.id,
    response.locals.changePassword as ChangePasswordInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    {},
    'Password changed successfully.',
  );
}

export async function logoutAllSessionsController(
  request: Request,
  response: Response,
) {
  await logoutAllSessions(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    {},
    'All sessions logged out successfully.',
  );
}
