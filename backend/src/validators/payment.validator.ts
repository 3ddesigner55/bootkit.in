import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type RazorpayOrderInput = {
  orderNumber: string;
};

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

export function validateRazorpayOrder(input: unknown): RazorpayOrderInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const orderNumber = (input as Record<string, unknown>).orderNumber;

  if (typeof orderNumber !== 'string' || !orderNumber.trim()) {
    throw validationError('orderNumber is required.');
  }

  return { orderNumber: orderNumber.trim() };
}

export function validateRazorpayOrderRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.razorpayOrder = validateRazorpayOrder(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
