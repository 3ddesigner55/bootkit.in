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
  const statusCode = error.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : error.message;

  return sendError(response, statusCode, message, error.errors);
};
