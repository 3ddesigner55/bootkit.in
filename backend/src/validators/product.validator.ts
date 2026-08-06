import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type ProductInput = {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category: string;
  brand?: string;
  mrp?: number;
  sellingPrice: number;
  costPrice?: number;
  discountPercent?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  minStock?: number;
  trackInventory?: boolean;
  thumbnail?: string;
  gallery?: string[];
  featured?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  homeSection?: string;
  displayOrder?: number;
  weight?: number;
  unit?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type ProductUpdateInput = Partial<ProductInput>;

export type ProductListQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  brand?: string;
  featured?: boolean;
  showOnHome?: boolean;
  active?: boolean;
  sort: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'display-order';
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
  field: 'name' | 'slug' | 'category',
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
  field: 'sellingPrice' | 'stock',
): number {
  const value = input[field];

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw validationError(
      `${field} is required and must be a non-negative number.`,
    );
  }

  return value;
}

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
  requireNonNegative = true,
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

function getOptionalGallery(
  input: Record<string, unknown>,
): string[] | undefined {
  const value = input.gallery;

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw validationError('gallery must be an array of strings.');
  }

  return value.map((item) => item.trim());
}

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<ProductInput, 'name' | 'slug' | 'category' | 'sellingPrice' | 'stock'> {
  const description = getOptionalString(input, 'description');
  const shortDescription = getOptionalString(input, 'shortDescription');
  const brand = getOptionalString(input, 'brand');
  const mrp = getOptionalNumber(input, 'mrp');
  const costPrice = getOptionalNumber(input, 'costPrice');
  const discountPercent = getOptionalNumber(input, 'discountPercent');
  const sku = getOptionalString(input, 'sku');
  const barcode = getOptionalString(input, 'barcode');
  const minStock = getOptionalNumber(input, 'minStock');
  const trackInventory = getOptionalBoolean(input, 'trackInventory');
  const thumbnail = getOptionalString(input, 'thumbnail');
  const gallery = getOptionalGallery(input);
  const featured = getOptionalBoolean(input, 'featured');
  const active = getOptionalBoolean(input, 'active');
  const showOnHome = getOptionalBoolean(input, 'showOnHome');
  const homeSection = getOptionalString(input, 'homeSection');
  const displayOrder = getOptionalNumber(input, 'displayOrder', false);
  const weight = getOptionalNumber(input, 'weight');
  const unit = getOptionalString(input, 'unit');
  const metaTitle = getOptionalString(input, 'metaTitle');
  const metaDescription = getOptionalString(input, 'metaDescription');

  return {
    ...(description !== undefined ? { description } : {}),
    ...(shortDescription !== undefined ? { shortDescription } : {}),
    ...(brand !== undefined ? { brand } : {}),
    ...(mrp !== undefined ? { mrp } : {}),
    ...(costPrice !== undefined ? { costPrice } : {}),
    ...(discountPercent !== undefined ? { discountPercent } : {}),
    ...(sku !== undefined ? { sku } : {}),
    ...(barcode !== undefined ? { barcode } : {}),
    ...(minStock !== undefined ? { minStock } : {}),
    ...(trackInventory !== undefined ? { trackInventory } : {}),
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(gallery !== undefined ? { gallery } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(showOnHome !== undefined ? { showOnHome } : {}),
    ...(homeSection !== undefined ? { homeSection } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(metaTitle !== undefined ? { metaTitle } : {}),
    ...(metaDescription !== undefined ? { metaDescription } : {}),
  };
}

export function validateProductCreate(input: unknown): ProductInput {
  const body = getObject(input);

  return {
    name: getRequiredString(body, 'name'),
    slug: getRequiredString(body, 'slug').toLowerCase(),
    category: getRequiredString(body, 'category'),
    sellingPrice: getRequiredNumber(body, 'sellingPrice'),
    stock: getRequiredNumber(body, 'stock'),
    ...getOptionalFields(body),
  };
}

export function validateProductUpdate(input: unknown): ProductUpdateInput {
  const body = getObject(input);
  const name = getOptionalString(body, 'name');
  const slug = getOptionalString(body, 'slug');
  const category = getOptionalString(body, 'category');
  const sellingPrice = getOptionalNumber(body, 'sellingPrice');
  const stock = getOptionalNumber(body, 'stock');

  if (name !== undefined && !name) {
    throw validationError('name cannot be empty.');
  }

  if (slug !== undefined && !slug) {
    throw validationError('slug cannot be empty.');
  }

  if (category !== undefined && !category) {
    throw validationError('category cannot be empty.');
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(slug !== undefined ? { slug: slug.toLowerCase() } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(sellingPrice !== undefined ? { sellingPrice } : {}),
    ...(stock !== undefined ? { stock } : {}),
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

export function validateProductListQuery(input: unknown): ProductListQuery {
  const query = input as Record<string, unknown>;
  const page = getQueryPositiveInteger(query.page, 'page', 1);
  const limit = getQueryPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  const sortValue = getQueryString(query.sort, 'sort') || 'display-order';
  const validSorts: ProductListQuery['sort'][] = [
    'newest',
    'oldest',
    'price-asc',
    'price-desc',
    'display-order',
  ];

  if (!validSorts.includes(sortValue as ProductListQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  return {
    page,
    limit,
    ...(getQueryString(query.search, 'search')
      ? { search: getQueryString(query.search, 'search') }
      : {}),
    ...(getQueryString(query.category, 'category')
      ? { category: getQueryString(query.category, 'category') }
      : {}),
    ...(getQueryString(query.brand, 'brand')
      ? { brand: getQueryString(query.brand, 'brand') }
      : {}),
    ...(getQueryBoolean(query.featured, 'featured') !== undefined
      ? { featured: getQueryBoolean(query.featured, 'featured') }
      : {}),
    ...(getQueryBoolean(query.showOnHome, 'showOnHome') !== undefined
      ? { showOnHome: getQueryBoolean(query.showOnHome, 'showOnHome') }
      : {}),
    ...(getQueryBoolean(query.active, 'active') !== undefined
      ? { active: getQueryBoolean(query.active, 'active') }
      : {}),
    sort: sortValue as ProductListQuery['sort'],
  };
}

export function validateProductCreateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateProductCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateProductUpdateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateProductUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
