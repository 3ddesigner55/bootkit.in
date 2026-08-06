import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type SearchQuery = {
  q: string;
  page: number;
  limit: number;
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

export function validateSearchQuery(input: unknown): SearchQuery {
  const query = input as Record<string, unknown>;
  const q = getQueryString(query.q, 'q');

  if (!q) {
    throw validationError('q is required.');
  }

  if (q.length < 2 || q.length > 100) {
    throw validationError('q must be between 2 and 100 characters.');
  }

  const page = getPositiveInteger(query.page, 'page', 1);
  const limit = getPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  return { q, page, limit };
}

export function validateSearchQueryRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.searchQuery = validateSearchQuery(request.query);
    next();
  } catch (error) {
    next(error);
  }
}
