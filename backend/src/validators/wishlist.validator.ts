import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type AddWishlistItemInput = {
  productId: string;
};

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

export function validateAddWishlistItem(input: unknown): AddWishlistItemInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const productId = (input as Record<string, unknown>).productId;

  if (typeof productId !== 'string' || !productId.trim()) {
    throw validationError('productId is required.');
  }

  return { productId: productId.trim() };
}

export function validateAddWishlistItemRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.addWishlistItem = validateAddWishlistItem(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
