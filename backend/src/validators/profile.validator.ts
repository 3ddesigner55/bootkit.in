import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type ProfileUpdateInput = {
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

function getObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  return input as Record<string, unknown>;
}

function getOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return value.trim();
}

export function validateProfileUpdate(input: unknown): ProfileUpdateInput {
  const body = getObject(input);
  const allowedFields = new Set(['firstName', 'lastName', 'avatar']);

  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      throw validationError(`${field} cannot be updated.`);
    }
  }

  const firstName = getOptionalString(body, 'firstName');
  const lastName = getOptionalString(body, 'lastName');
  const avatar = getOptionalString(body, 'avatar');

  if (firstName !== undefined && !firstName) {
    throw validationError('firstName cannot be empty.');
  }

  return {
    ...(firstName !== undefined ? { firstName } : {}),
    ...(lastName !== undefined ? { lastName } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
  };
}

export function validateChangePassword(input: unknown): ChangePasswordInput {
  const body = getObject(input);
  const currentPassword = getOptionalString(body, 'currentPassword');
  const newPassword = getOptionalString(body, 'newPassword');

  if (!currentPassword) {
    throw validationError('currentPassword is required.');
  }

  if (!newPassword) {
    throw validationError('newPassword is required.');
  }

  return { currentPassword, newPassword };
}

export function validateProfileUpdateRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.profileUpdate = validateProfileUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateChangePasswordRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.changePassword = validateChangePassword(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
