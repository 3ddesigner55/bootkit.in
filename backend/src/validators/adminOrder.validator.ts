import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

const ORDER_STATUSES = [
  'PENDING',
  'PLACED',
  'CONFIRMED',
  'PACKING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const;

export type AdminOrderListQuery = {
  page: number;
  limit: number;
  status?: (typeof ORDER_STATUSES)[number];
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];
  search?: string;
  store?: string;
  sort: 'newest' | 'oldest' | 'grandTotalAsc' | 'grandTotalDesc';
};

export type AdminOrderStatusInput = {
  status:
    | 'PLACED'
    | 'CONFIRMED'
    | 'PACKING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
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

export function validateAdminOrderListQuery(
  input: unknown,
): AdminOrderListQuery {
  const query = input as Record<string, unknown>;
  const page = getPositiveInteger(query.page, 'page', 1);
  const limit = getPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  const status = getQueryString(query.status, 'status');
  const paymentStatus = getQueryString(query.paymentStatus, 'paymentStatus');
  const search = getQueryString(query.search, 'search');
  const store = getQueryString(query.store, 'store');
  const sort = getQueryString(query.sort, 'sort') || 'newest';
  const validSorts: AdminOrderListQuery['sort'][] = [
    'newest',
    'oldest',
    'grandTotalAsc',
    'grandTotalDesc',
  ];

  if (
    status &&
    !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
  ) {
    throw validationError('status is invalid.');
  }

  if (
    paymentStatus &&
    !PAYMENT_STATUSES.includes(
      paymentStatus as (typeof PAYMENT_STATUSES)[number],
    )
  ) {
    throw validationError('paymentStatus is invalid.');
  }

  if (!validSorts.includes(sort as AdminOrderListQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  return {
    page,
    limit,
    ...(status ? { status: status as AdminOrderListQuery['status'] } : {}),
    ...(paymentStatus
      ? { paymentStatus: paymentStatus as AdminOrderListQuery['paymentStatus'] }
      : {}),
    ...(search ? { search } : {}),
    ...(store ? { store } : {}),
    sort: sort as AdminOrderListQuery['sort'],
  };
}

export function validateAdminOrderStatus(
  input: unknown,
): AdminOrderStatusInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const status = (input as Record<string, unknown>).status;
  const allowedStatuses: AdminOrderStatusInput['status'][] = [
    'PLACED',
    'CONFIRMED',
    'PACKING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];

  if (!allowedStatuses.includes(status as AdminOrderStatusInput['status'])) {
    throw validationError('status is invalid.');
  }

  return { status: status as AdminOrderStatusInput['status'] };
}

export function validateAdminOrderListQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminOrderListQuery = validateAdminOrderListQuery(
      request.query,
    );
    next();
  } catch (error) {
    next(error);
  }
}

export function validateAdminOrderStatusRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminOrderStatus = validateAdminOrderStatus(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
