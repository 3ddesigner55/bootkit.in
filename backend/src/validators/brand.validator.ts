import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type BrandInput = {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  featured?: boolean;
  active?: boolean;
  displayOrder?: number;
};

export type BrandUpdateInput = Partial<BrandInput>;

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
  field: 'name' | 'slug',
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

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<BrandInput, 'name' | 'slug'> {
  const description = getOptionalString(input, 'description');
  const logo = getOptionalString(input, 'logo');
  const website = getOptionalString(input, 'website');
  const featured = getOptionalBoolean(input, 'featured');
  const active = getOptionalBoolean(input, 'active');
  const displayOrder = getOptionalNumber(input, 'displayOrder');

  return {
    ...(description !== undefined ? { description } : {}),
    ...(logo !== undefined ? { logo } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
  };
}

export function validateBrandCreate(input: unknown): BrandInput {
  const body = getObject(input);

  return {
    name: getRequiredString(body, 'name'),
    slug: getRequiredString(body, 'slug').toLowerCase(),
    ...getOptionalFields(body),
  };
}

export function validateBrandUpdate(input: unknown): BrandUpdateInput {
  const body = getObject(input);
  const name = getOptionalString(body, 'name');
  const slug = getOptionalString(body, 'slug');

  if (name !== undefined && !name) {
    throw validationError('name cannot be empty.');
  }

  if (slug !== undefined && !slug) {
    throw validationError('slug cannot be empty.');
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(slug !== undefined ? { slug: slug.toLowerCase() } : {}),
    ...getOptionalFields(body),
  };
}

export function validateBrandCreateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateBrandCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateBrandUpdateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateBrandUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
