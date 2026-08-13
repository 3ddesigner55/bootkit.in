import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type PlaceOrderInput = {
  addressId: string;
  storeId: string;
  paymentMethod: 'COD' | 'RAZORPAY';
  couponCode?: string;
  useWallet?: boolean;
  idempotencyKey: string;
};

export type CancelOrderInput = {
  reason: string;
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
  field: 'addressId' | 'storeId' | 'idempotencyKey',
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  return value.trim();
}

export function validatePlaceOrder(input: unknown): PlaceOrderInput {
  const body = getObject(input);
  const paymentMethod = body.paymentMethod;
  const couponCode = body.couponCode;
  const useWallet = body.useWallet;

  if (paymentMethod !== 'COD' && paymentMethod !== 'RAZORPAY') {
    throw validationError('paymentMethod must be COD or RAZORPAY.');
  }

  if (couponCode !== undefined && typeof couponCode !== 'string') {
    throw validationError('couponCode must be a string.');
  }

  if (useWallet !== undefined && typeof useWallet !== 'boolean') {
    throw validationError('useWallet must be a boolean.');
  }

  return {
    addressId: getRequiredString(body, 'addressId'),
    storeId: getRequiredString(body, 'storeId'),
    idempotencyKey: getRequiredString(body, 'idempotencyKey'),
    paymentMethod,
    useWallet: !!useWallet,
    ...(couponCode?.trim() ? { couponCode: couponCode.trim() } : {}),
  };
}

export function validateCancelOrder(input: unknown): CancelOrderInput {
  const body = getObject(input);
  const reason = body.reason;

  if (typeof reason !== 'string' || !reason.trim()) {
    throw validationError('reason is required.');
  }

  return { reason: reason.trim() };
}

export function validatePlaceOrderRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.placeOrder = validatePlaceOrder(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateCancelOrderRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.cancelOrder = validateCancelOrder(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateConfirmCodRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const orderNumber = request.params.orderNumber;

  if (Array.isArray(orderNumber) || !orderNumber?.trim()) {
    next(validationError('orderNumber is required.'));
    return;
  }

  response.locals.confirmCodOrderNumber = orderNumber.trim();
  next();
}

export type MyOrdersQuery = {
  page: number;
  limit: number;
};

export function validateMyOrdersQuery(input: unknown): MyOrdersQuery {
  const query = (
    input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  ) as Record<string, unknown>;

  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(String(query.limit || '10'), 10) || 10),
  );

  return { page, limit };
}

export function validateMyOrdersRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.myOrdersQuery = validateMyOrdersQuery(request.query);
    next();
  } catch (error) {
    next(error);
  }
}
