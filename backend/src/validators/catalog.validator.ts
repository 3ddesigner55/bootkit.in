import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type CatalogQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  brand?: string;
  featured?: boolean;
  showOnHome?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: 'newest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';
};

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
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

function getPositiveInteger(
  value: unknown,
  field: string,
  defaultValue: number,
): number {
  const normalized = getQueryString(value, field);

  if (!normalized) {
    return defaultValue;
  }

  const numberValue = Number(normalized);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw validationError(`${field} must be a positive integer.`);
  }

  return numberValue;
}

function getBoolean(value: unknown, field: string): boolean | undefined {
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

function getPrice(value: unknown, field: string): number | undefined {
  const normalized = getQueryString(value, field);

  if (normalized === undefined || normalized === '') {
    return undefined;
  }

  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw validationError(`${field} must be a non-negative number.`);
  }

  return numberValue;
}

export function validateCatalogQuery(input: unknown): CatalogQuery {
  const query = input as Record<string, unknown>;
  const page = getPositiveInteger(query.page, 'page', 1);
  const limit = getPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  const sort = getQueryString(query.sort, 'sort') || 'newest';
  const validSorts: CatalogQuery['sort'][] = [
    'newest',
    'priceAsc',
    'priceDesc',
    'nameAsc',
    'nameDesc',
  ];

  if (!validSorts.includes(sort as CatalogQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  const minPrice = getPrice(query.minPrice, 'minPrice');
  const maxPrice = getPrice(query.maxPrice, 'maxPrice');

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw validationError('minPrice cannot be greater than maxPrice.');
  }

  const search = getQueryString(query.search, 'search');
  const category = getQueryString(query.category, 'category');
  const brand = getQueryString(query.brand, 'brand');
  const featured = getBoolean(query.featured, 'featured');
  const showOnHome = getBoolean(query.showOnHome, 'showOnHome');

  return {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(showOnHome !== undefined ? { showOnHome } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    sort: sort as CatalogQuery['sort'],
  };
}

export function validateCatalogQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.catalogQuery = validateCatalogQuery(request.query);
    next();
  } catch (error) {
    next(error);
  }
}
