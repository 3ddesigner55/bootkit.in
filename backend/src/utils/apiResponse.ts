import type { Response } from 'express';

import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';

export function sendSuccess<T>(
  response: Response<ApiSuccessResponse<T>>,
  statusCode: number,
  data: T,
  message = 'Success',
): Response<ApiSuccessResponse<T>> {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  response: Response<ApiErrorResponse>,
  statusCode: number,
  message = 'An error occurred',
  errors?: unknown,
): Response<ApiErrorResponse> {
  return response.status(statusCode).json({
    success: false,
    message,
    ...(errors === undefined ? {} : { errors }),
  });
}
