import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/token';

export const authenticate: RequestHandler = (request, response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    request.user = {
      id: payload.userId,
      role: payload.role,
      ...(payload.email ? { email: payload.email } : {}),
    };
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired access token.' });
  }
};
