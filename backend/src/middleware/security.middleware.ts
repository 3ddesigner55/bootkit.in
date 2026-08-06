import type { RequestHandler } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { createRequire } from 'node:module';

const loadModule = createRequire(__filename);
const hpp = loadModule('hpp') as () => RequestHandler;

function sanitizeValue(value: unknown): void {
  if (value && typeof value === 'object') {
    mongoSanitize.sanitize(value as Record<string, unknown>);
  }
}

export const hppMiddleware = hpp();

export const mongoSanitizationMiddleware: RequestHandler = (
  request,
  _response,
  next,
) => {
  sanitizeValue(request.body);
  sanitizeValue(request.params);
  sanitizeValue(request.query);
  next();
};
