import type { ErrorRequestHandler } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';
import { sendError } from '../utils/apiResponse';

export const errorMiddleware: ErrorRequestHandler = (
  error: ApiError,
  _request,
  response,
  next,
) => {
  void next;
  const isMulterError = error.name === 'MulterError';
  const statusCode =
    error.statusCode ??
    (isMulterError
      ? HTTP_STATUS.BAD_REQUEST
      : HTTP_STATUS.INTERNAL_SERVER_ERROR);
  const message =
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : error.message;

  return sendError(response, statusCode, message, error.errors);
};
