import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type RazorpayPaymentVerificationInput = {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

function getRequiredString(
  input: Record<string, unknown>,
  field: string,
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  return value.trim();
}

export function validateRazorpayPaymentVerification(
  input: unknown,
): RazorpayPaymentVerificationInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const body = input as Record<string, unknown>;

  return {
    orderNumber: getRequiredString(body, 'orderNumber'),
    razorpayOrderId: getRequiredString(body, 'razorpayOrderId'),
    razorpayPaymentId: getRequiredString(body, 'razorpayPaymentId'),
    razorpaySignature: getRequiredString(body, 'razorpaySignature'),
  };
}

export function validateRazorpayPaymentVerificationRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.razorpayPaymentVerification =
      validateRazorpayPaymentVerification(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
