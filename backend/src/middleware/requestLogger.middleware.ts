import type { ErrorRequestHandler, RequestHandler } from 'express';
import morgan from 'morgan';

import { logger } from '../config/logger';

type RequestLog = {
  timestamp: string;
  method: string;
  url: string;
  statusCode: string | undefined;
  responseTime: string | undefined;
  ip: string | undefined;
  userAgent: string | undefined;
};

const requestLogFormat: morgan.FormatFn = (tokens, request, response) =>
  JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(request, response) ?? '',
    url: tokens.url(request, response) ?? '',
    statusCode: tokens.status(request, response),
    responseTime: tokens['response-time'](request, response),
    ip: tokens['remote-addr'](request, response),
    userAgent: tokens['user-agent'](request, response),
  } satisfies RequestLog);

export const requestLogger: RequestHandler = morgan(requestLogFormat, {
  stream: {
    write: (message: string) => {
      logger.http('HTTP request', JSON.parse(message) as RequestLog);
    },
  },
});

export const errorRequestLogger: ErrorRequestHandler = (
  error,
  request,
  _response,
  next,
) => {
  logger.error(
    error instanceof Error ? error.message : 'Unhandled request error',
    {
      stack: error instanceof Error ? error.stack : undefined,
      method: request.method,
      route: request.originalUrl,
      timestamp: new Date().toISOString(),
    },
  );
  next(error);
};
