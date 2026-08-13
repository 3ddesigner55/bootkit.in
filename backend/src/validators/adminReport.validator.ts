import type { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type AdminReportQuery = {
  from?: Date;
  to?: Date;
  store?: string;
  brand?: string;
  category?: string;
  groupBy: 'day' | 'week' | 'month';
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

function getDate(value: unknown, field: 'from' | 'to'): Date | undefined {
  const dateValue = getQueryString(value, field);

  if (!dateValue) {
    return undefined;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid date.`);
  }

  if (field === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

function getObjectId(
  value: unknown,
  field: 'brand' | 'category',
): string | undefined {
  const objectId = getQueryString(value, field);

  if (!objectId) {
    return undefined;
  }

  if (!isValidObjectId(objectId)) {
    throw validationError(`${field} must be a valid ObjectId.`);
  }

  return objectId;
}

export function validateAdminReportQuery(input: unknown): AdminReportQuery {
  const query = input as Record<string, unknown>;
  const from = getDate(query.from, 'from');
  const to = getDate(query.to, 'to');
  const store = getQueryString(query.store, 'store');
  const brand = getObjectId(query.brand, 'brand');
  const category = getObjectId(query.category, 'category');
  const groupBy = getQueryString(query.groupBy, 'groupBy') || 'day';

  if (from && to && from > to) {
    throw validationError('from cannot be after to.');
  }

  if (groupBy !== 'day' && groupBy !== 'week' && groupBy !== 'month') {
    throw validationError('groupBy must be day, week, or month.');
  }

  return {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(store ? { store } : {}),
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
    groupBy,
  };
}

export function validateAdminReportQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.adminReportQuery = validateAdminReportQuery(request.query);
    next();
  } catch (error) {
    next(error);
  }
}
