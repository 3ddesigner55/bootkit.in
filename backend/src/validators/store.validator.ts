import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type StoreInput = {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  managerName?: string;
  managerPhone?: string;
  deliveryRadius?: number;
  minimumOrderAmount?: number;
  active?: boolean;
  featured?: boolean;
  displayOrder?: number;
  openingTime?: string;
  closingTime?: string;
  seller?: string | null;
};

export type StoreUpdateInput = Partial<StoreInput>;

export type StoreListQuery = {
  page: number;
  limit: number;
  search?: string;
  city?: string;
  state?: string;
  active?: boolean;
  featured?: boolean;
  sort: 'newest' | 'oldest' | 'name-asc' | 'display-order';
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
  field: 'name' | 'slug' | 'phone' | 'city' | 'state' | 'country',
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

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
  requireNonNegative = false,
): number | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (requireNonNegative && value < 0)
  ) {
    throw validationError(
      `${field} must be a valid${requireNonNegative ? ' non-negative' : ''} number.`,
    );
  }

  return value;
}

function validateDeliveryLocation(input: {
  active: boolean;
  latitude?: number;
  longitude?: number;
  deliveryRadius?: number;
}): void {
  if (input.deliveryRadius === undefined || input.deliveryRadius <= 0) {
    throw validationError('deliveryRadius must be greater than 0.');
  }

  if (!input.active) {
    return;
  }

  if (input.latitude === undefined || input.longitude === undefined) {
    throw validationError(
      'latitude and longitude are required for an active delivery store.',
    );
  }

  if (input.latitude < -90 || input.latitude > 90) {
    throw validationError('latitude must be between -90 and 90.');
  }

  if (input.longitude < -180 || input.longitude > 180) {
    throw validationError('longitude must be between -180 and 180.');
  }

  if (input.latitude === 0 && input.longitude === 0) {
    throw validationError(
      'latitude and longitude cannot both be 0 for an active delivery store.',
    );
  }
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

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<StoreInput, 'name' | 'slug' | 'phone' | 'city' | 'state' | 'country'> {
  const description = getOptionalString(input, 'description');
  const logo = getOptionalString(input, 'logo');
  const banner = getOptionalString(input, 'banner');
  const email = getOptionalString(input, 'email');
  const addressLine1 = getOptionalString(input, 'addressLine1');
  const addressLine2 = getOptionalString(input, 'addressLine2');
  const postalCode = getOptionalString(input, 'postalCode');
  const latitude = getOptionalNumber(input, 'latitude');
  const longitude = getOptionalNumber(input, 'longitude');
  const managerName = getOptionalString(input, 'managerName');
  const managerPhone = getOptionalString(input, 'managerPhone');
  const deliveryRadius = getOptionalNumber(input, 'deliveryRadius', true);
  const minimumOrderAmount = getOptionalNumber(
    input,
    'minimumOrderAmount',
    true,
  );
  const active = getOptionalBoolean(input, 'active');
  const featured = getOptionalBoolean(input, 'featured');
  const displayOrder = getOptionalNumber(input, 'displayOrder');
  const openingTime = getOptionalString(input, 'openingTime');
  const closingTime = getOptionalString(input, 'closingTime');
  const seller =
    input.seller === null ? null : getOptionalString(input, 'seller');

  return {
    ...(description !== undefined ? { description } : {}),
    ...(logo !== undefined ? { logo } : {}),
    ...(banner !== undefined ? { banner } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(addressLine1 !== undefined ? { addressLine1 } : {}),
    ...(addressLine2 !== undefined ? { addressLine2 } : {}),
    ...(postalCode !== undefined ? { postalCode } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(managerName !== undefined ? { managerName } : {}),
    ...(managerPhone !== undefined ? { managerPhone } : {}),
    ...(deliveryRadius !== undefined ? { deliveryRadius } : {}),
    ...(minimumOrderAmount !== undefined ? { minimumOrderAmount } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
    ...(openingTime !== undefined ? { openingTime } : {}),
    ...(closingTime !== undefined ? { closingTime } : {}),
    ...(seller !== undefined ? { seller } : {}),
  };
}

export function validateStoreCreate(input: unknown): StoreInput {
  const body = getObject(input);
  const store = {
    name: getRequiredString(body, 'name'),
    slug: getRequiredString(body, 'slug').toLowerCase(),
    phone: getRequiredString(body, 'phone'),
    city: getRequiredString(body, 'city'),
    state: getRequiredString(body, 'state'),
    country: getRequiredString(body, 'country'),
    ...getOptionalFields(body),
  };

  validateDeliveryLocation({
    active: store.active ?? true,
    latitude: store.latitude,
    longitude: store.longitude,
    deliveryRadius: store.deliveryRadius,
  });

  return store;
}

export function validateStoreUpdate(input: unknown): StoreUpdateInput {
  const body = getObject(input);
  const fields = ['name', 'slug', 'phone', 'city', 'state', 'country'] as const;
  const requiredUpdates = Object.fromEntries(
    fields.flatMap((field) => {
      const value = getOptionalString(body, field);

      if (value !== undefined && !value) {
        throw validationError(`${field} cannot be empty.`);
      }

      return value !== undefined
        ? [[field, field === 'slug' ? value.toLowerCase() : value]]
        : [];
    }),
  ) as Partial<Pick<StoreInput, (typeof fields)[number]>>;

  return {
    ...requiredUpdates,
    ...getOptionalFields(body),
  };
}

function getQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return value.trim();
}

function getQueryBoolean(value: unknown, field: string): boolean | undefined {
  const normalized = getQueryString(value, field);

  if (normalized === undefined || normalized === '') {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw validationError(`${field} must be true or false.`);
}

function getQueryPositiveInteger(
  value: unknown,
  field: string,
  defaultValue: number,
): number {
  const normalized = getQueryString(value, field);

  if (normalized === undefined || normalized === '') {
    return defaultValue;
  }

  const numberValue = Number(normalized);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw validationError(`${field} must be a positive integer.`);
  }

  return numberValue;
}

export function validateStoreListQuery(input: unknown): StoreListQuery {
  const query = input as Record<string, unknown>;
  const page = getQueryPositiveInteger(query.page, 'page', 1);
  const limit = getQueryPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  const sortValue = getQueryString(query.sort, 'sort') || 'display-order';
  const validSorts: StoreListQuery['sort'][] = [
    'newest',
    'oldest',
    'name-asc',
    'display-order',
  ];

  if (!validSorts.includes(sortValue as StoreListQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  const search = getQueryString(query.search, 'search');
  const city = getQueryString(query.city, 'city');
  const state = getQueryString(query.state, 'state');
  const active = getQueryBoolean(query.active, 'active');
  const featured = getQueryBoolean(query.featured, 'featured');

  return {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(featured !== undefined ? { featured } : {}),
    sort: sortValue as StoreListQuery['sort'],
  };
}

export function validateStoreListQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.storeListQuery = validateStoreListQuery(request.query);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateStoreCreateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateStoreCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateStoreUpdateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateStoreUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
