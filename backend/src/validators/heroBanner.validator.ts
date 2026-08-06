import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type HeroBannerInput = {
  title: string;
  subtitle?: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  showOnHome?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  active?: boolean;
};

export type HeroBannerUpdateInput = Partial<HeroBannerInput>;

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
  field: 'title' | 'desktopImage',
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  return value.trim();
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

function getRequiredNumber(
  input: Record<string, unknown>,
  field: 'displayOrder',
): number {
  const value = input[field];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`${field} is required and must be a valid number.`);
  }

  return value;
}

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`${field} must be a valid number.`);
  }

  return value;
}

function getOptionalBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean.`);
  }

  return value;
}

function getOptionalDate(
  input: Record<string, unknown>,
  field: string,
): Date | null | undefined {
  const value = input[field];

  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw validationError(`${field} must be a valid date string or null.`);
  }

  return new Date(value);
}

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<HeroBannerInput, 'title' | 'desktopImage' | 'displayOrder'> {
  const subtitle = getOptionalString(input, 'subtitle');
  const mobileImage = getOptionalString(input, 'mobileImage');
  const buttonText = getOptionalString(input, 'buttonText');
  const buttonLink = getOptionalString(input, 'buttonLink');
  const showOnHome = getOptionalBoolean(input, 'showOnHome');
  const startDate = getOptionalDate(input, 'startDate');
  const endDate = getOptionalDate(input, 'endDate');
  const active = getOptionalBoolean(input, 'active');

  return {
    ...(subtitle !== undefined ? { subtitle } : {}),
    ...(mobileImage !== undefined ? { mobileImage } : {}),
    ...(buttonText !== undefined ? { buttonText } : {}),
    ...(buttonLink !== undefined ? { buttonLink } : {}),
    ...(showOnHome !== undefined ? { showOnHome } : {}),
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
    ...(active !== undefined ? { active } : {}),
  };
}

export function validateHeroBannerCreate(input: unknown): HeroBannerInput {
  const body = getObject(input);

  return {
    title: getRequiredString(body, 'title'),
    desktopImage: getRequiredString(body, 'desktopImage'),
    displayOrder: getRequiredNumber(body, 'displayOrder'),
    ...getOptionalFields(body),
  };
}

export function validateHeroBannerUpdate(
  input: unknown,
): HeroBannerUpdateInput {
  const body = getObject(input);
  const title = getOptionalString(body, 'title');
  const desktopImage = getOptionalString(body, 'desktopImage');
  const displayOrder = getOptionalNumber(body, 'displayOrder');

  if (title !== undefined && !title) {
    throw validationError('title cannot be empty.');
  }

  if (desktopImage !== undefined && !desktopImage) {
    throw validationError('desktopImage cannot be empty.');
  }

  return {
    ...(title !== undefined ? { title } : {}),
    ...(desktopImage !== undefined ? { desktopImage } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
    ...getOptionalFields(body),
  };
}

export function validateHeroBannerCreateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateHeroBannerCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateHeroBannerUpdateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateHeroBannerUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
