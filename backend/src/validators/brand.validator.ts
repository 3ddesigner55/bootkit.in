import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type BrandInput = {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  collectionHub?:
    'beauty' | 'electronics' | 'pharmacy' | 'decor' | 'kids' | 'gifting' | null;
  website?: string;
  featured?: boolean;
  active?: boolean;
  displayOrder?: number;
};

export type BrandUpdateInput = Partial<BrandInput>;

export type AdminBrandListQuery = {
  page: number;
  limit: number;
  search?: string;
  hub?: string;
  active?: boolean;
  featured?: boolean;
  sortField: 'displayOrder' | 'name' | 'createdAt';
  sortDirection: 1 | -1;
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

function getOptionalCollectionHub(
  input: Record<string, unknown>,
  field: string,
): BrandInput['collectionHub'] | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a valid string or null.`);
  }

  const normalized = value.trim().toLowerCase();
  const validHubs = [
    'beauty',
    'electronics',
    'pharmacy',
    'decor',
    'kids',
    'gifting',
  ];

  if (!validHubs.includes(normalized)) {
    throw validationError(
      `${field} must be one of beauty, electronics, pharmacy, decor, kids, gifting, or null.`,
    );
  }

  return normalized as BrandInput['collectionHub'];
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
  const banner = getOptionalString(input, 'banner');
  const collectionHub = getOptionalCollectionHub(input, 'collectionHub');
  const website = getOptionalString(input, 'website');
  const featured = getOptionalBoolean(input, 'featured');
  const active = getOptionalBoolean(input, 'active');
  const displayOrder = getOptionalNumber(input, 'displayOrder');

  return {
    ...(description !== undefined ? { description } : {}),
    ...(logo !== undefined ? { logo } : {}),
    ...(banner !== undefined ? { banner } : {}),
    ...(collectionHub !== undefined ? { collectionHub } : {}),
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

function getQueryValue(
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

function getQueryNumber(
  input: Record<string, unknown>,
  field: string,
  defaultValue: number,
  maximum: number,
): number {
  const value = getQueryValue(input, field);

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > maximum
  ) {
    throw validationError(
      `${field} must be an integer between 1 and ${maximum}.`,
    );
  }

  return parsedValue;
}

function getQueryBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = getQueryValue(input, field);

  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw validationError(`${field} must be true or false.`);
}

export function validateAdminBrandListQuery(
  input: unknown,
): AdminBrandListQuery {
  const query = getObject(input);
  const search = getQueryValue(query, 'search');
  const sort = getQueryValue(query, 'sort') || 'displayOrder';
  const isDescending = sort.startsWith('-');
  const sortField = isDescending ? sort.slice(1) : sort;

  if (!['displayOrder', 'name', 'createdAt'].includes(sortField)) {
    throw validationError(
      'sort must be displayOrder, name, or createdAt. Prefix with - for descending order.',
    );
  }

  const hub = getQueryValue(query, 'hub');

  return {
    page: getQueryNumber(query, 'page', 1, Number.MAX_SAFE_INTEGER),
    limit: getQueryNumber(query, 'limit', 20, 100),
    ...(search ? { search } : {}),
    ...(hub ? { hub: hub.toLowerCase() } : {}),
    ...(getQueryBoolean(query, 'active') !== undefined
      ? { active: getQueryBoolean(query, 'active') }
      : {}),
    ...(getQueryBoolean(query, 'featured') !== undefined
      ? { featured: getQueryBoolean(query, 'featured') }
      : {}),
    sortField: sortField as AdminBrandListQuery['sortField'],
    sortDirection: isDescending ? -1 : 1,
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
