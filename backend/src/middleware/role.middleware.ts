import type { RequestHandler } from 'express';
import type { Role } from '../constants/roles';

export function authorizeRoles(...allowedRoles: Role[]): RequestHandler {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      response.status(403).json({ message: 'You are not authorized.' });
      return;
    }

    next();
  };
}
