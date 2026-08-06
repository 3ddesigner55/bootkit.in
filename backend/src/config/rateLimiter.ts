import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { slowDown } from 'express-slow-down';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const rateLimitHandler: RequestHandler = (_request, response) => {
  response.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

export const globalRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authenticationRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const apiSlowDown = slowDown({
  windowMs: FIFTEEN_MINUTES,
  delayAfter: 50,
  delayMs: (used) => (used - 50) * 500,
  maxDelayMs: 5000,
  legacyHeaders: false,
});
