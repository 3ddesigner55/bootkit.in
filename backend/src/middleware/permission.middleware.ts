import type { Request, Response, NextFunction } from 'express';
import CustomRole from '../models/customRole.model';

export function authorizePermission(requiredPermission: string) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const user = (request as any).user;
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // Owner role has full/unrestricted permissions across the system
    if (user.role === 'OWNER') {
      next();
      return;
    }

    try {
      // Lookup custom permissions whitelisted for the user's role
      const roleDoc = await CustomRole.findOne({ name: user.role, active: true });
      if (!roleDoc || !roleDoc.permissions.includes(requiredPermission)) {
        response.status(403).json({ message: `Access denied: Required permission '${requiredPermission}' is missing.` });
        return;
      }
      next();
    } catch (err) {
      response.status(500).json({ message: 'Failed to authorize permission.' });
    }
  };
}
