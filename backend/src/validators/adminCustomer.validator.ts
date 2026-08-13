import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

const CUSTOMER_STATUSES = ['Active', 'Blocked'] as const;
const CUSTOMER_SORTS = [
  'newest',
  'oldest',
  'nameAsc',
  'nameDesc',
  'ordersDesc',
  'totalSpendDesc',
] as const;

export type AdminCustomerListQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: (typeof CUSTOMER_STATUSES)[number];
  sort: (typeof CUSTOMER_SORTS)[number];
};

export type AdminCustomerOrdersQuery = {
  page: number;
  limit: number;
  sort: 'newest' | 'oldest' | 'grandTotalAsc' | 'grandTotalDesc';
};

export type AdminCustomerStatusInput = {
  status: (typeof CUSTOMER_STATUSES)[number];
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

function validatePagination(input: Record<string, unknown>) {
  const page = getPositiveInteger(input.page, 'page', 1);
  const limit = getPositiveInteger(input.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  return { page, limit };
}

export function validateAdminCustomerListQuery(
  input: unknown,
): AdminCustomerListQuery {
  const query = input as Record<string, unknown>;
  const { page, limit } = validatePagination(query);
  const search = getQueryString(query.search, 'search');
  const status = getQueryString(query.status, 'status');
  const sort = getQueryString(query.sort, 'sort') || 'newest';

  if (
    status &&
    !CUSTOMER_STATUSES.includes(status as AdminCustomerStatusInput['status'])
  ) {
    throw validationError('status is invalid.');
  }

  if (!CUSTOMER_SORTS.includes(sort as AdminCustomerListQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  return {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(status ? { status: status as AdminCustomerListQuery['status'] } : {}),
    sort: sort as AdminCustomerListQuery['sort'],
  };
}

export function validateAdminCustomerOrdersQuery(
  input: unknown,
): AdminCustomerOrdersQuery {
  const query = input as Record<string, unknown>;
  const { page, limit } = validatePagination(query);
  const sort = getQueryString(query.sort, 'sort') || 'newest';
  const validSorts: AdminCustomerOrdersQuery['sort'][] = [
    'newest',
    'oldest',
    'grandTotalAsc',
    'grandTotalDesc',
  ];

  if (!validSorts.includes(sort as AdminCustomerOrdersQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  return { page, limit, sort: sort as AdminCustomerOrdersQuery['sort'] };
}

export function validateAdminCustomerStatus(
  input: unknown,
): AdminCustomerStatusInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const status = (input as Record<string, unknown>).status;

  if (
    !CUSTOMER_STATUSES.includes(status as AdminCustomerStatusInput['status'])
  ) {
    throw validationError('status must be Active or Blocked.');
  }

  return { status: status as AdminCustomerStatusInput['status'] };
}

export function validateAdminCustomerListQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminCustomerListQuery = validateAdminCustomerListQuery(
      request.query,
    );
    next();
  } catch (error) {
    next(error);
  }
}

export function validateAdminCustomerOrdersQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminCustomerOrdersQuery = validateAdminCustomerOrdersQuery(
      request.query,
    );
    next();
  } catch (error) {
    next(error);
  }
}

export function validateAdminCustomerStatusRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminCustomerStatus = validateAdminCustomerStatus(
      request.body,
    );
    next();
  } catch (error) {
    next(error);
  }
}
