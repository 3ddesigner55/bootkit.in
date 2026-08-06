import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type PlaceOrderInput = {
  addressId: string;
  storeId: string;
  paymentMethod: 'COD' | 'RAZORPAY';
  couponCode?: string;
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
  field: 'addressId' | 'storeId',
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

  if (paymentMethod !== 'COD' && paymentMethod !== 'RAZORPAY') {
    throw validationError('paymentMethod must be COD or RAZORPAY.');
  }

  if (couponCode !== undefined && typeof couponCode !== 'string') {
    throw validationError('couponCode must be a string.');
  }

  return {
    addressId: getRequiredString(body, 'addressId'),
    storeId: getRequiredString(body, 'storeId'),
    paymentMethod,
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
