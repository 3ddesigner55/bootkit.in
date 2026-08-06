import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
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

function getRequiredString(
  input: Record<string, unknown>,
  field: string,
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  return value.trim();
}

function validateEmail(email: string): string {
  const normalizedEmail = email.toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw validationError('email must be valid.');
  }

  return normalizedEmail;
}

function validatePassword(password: string): string {
  if (password.length < 8) {
    throw validationError('password must be at least 8 characters.');
  }

  return password;
}

export function validateRegister(input: unknown): RegisterInput {
  const body = getObject(input);

  return {
    firstName: getRequiredString(body, 'firstName'),
    lastName: typeof body.lastName === 'string' ? body.lastName.trim() : '',
    email: validateEmail(getRequiredString(body, 'email')),
    phone: getRequiredString(body, 'phone'),
    password: validatePassword(getRequiredString(body, 'password')),
  };
}

export function validateLogin(input: unknown): LoginInput {
  const body = getObject(input);

  return {
    email: validateEmail(getRequiredString(body, 'email')),
    password: getRequiredString(body, 'password'),
  };
}

export function validateRefreshToken(input: unknown): RefreshTokenInput {
  const body = getObject(input);

  return { refreshToken: getRequiredString(body, 'refreshToken') };
}

export function validateRegisterRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.register = validateRegister(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateLoginRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.login = validateLogin(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateRefreshTokenRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.refreshToken = validateRefreshToken(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
