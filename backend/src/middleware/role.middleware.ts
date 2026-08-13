import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../constants/roles';

export function authorizeRoles(...allowedRoles: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const user = (request as any).user;
    if (!user || !allowedRoles.includes(user.role as Role)) {
      response.status(403).json({ message: 'You are not authorized.' });
      return;
    }

    next();
  };
}
