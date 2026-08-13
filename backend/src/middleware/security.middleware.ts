import type { RequestHandler } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';



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
