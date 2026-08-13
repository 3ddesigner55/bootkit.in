import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type AddCartItemInput = {
  productId: string;
  quantity: number;
  storeId?: string;
};

export type UpdateCartItemInput = {
  quantity: number;
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

function getQuantity(input: Record<string, unknown>): number {
  const quantity = input.quantity;

  if (
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw validationError('quantity must be an integer of at least 1.');
  }

  return quantity;
}

export function validateAddCartItem(input: unknown): AddCartItemInput {
  const body = getObject(input);

  if (typeof body.productId !== 'string' || !body.productId.trim()) {
    throw validationError('productId is required.');
  }

  const storeId =
    typeof body.storeId === 'string' && body.storeId.trim()
      ? body.storeId.trim()
      : undefined;

  return {
    productId: body.productId.trim(),
    quantity: getQuantity(body),
    ...(storeId ? { storeId } : {}),
  };
}


export function validateUpdateCartItem(input: unknown): UpdateCartItemInput {
  return { quantity: getQuantity(getObject(input)) };
}

export function validateAddCartItemRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.addCartItem = validateAddCartItem(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateUpdateCartItemRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.updateCartItem = validateUpdateCartItem(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
