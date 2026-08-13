import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Types } from 'mongoose';
import { ROLES } from '../constants/roles';
import User from '../models/user.model';

export const requireStoreScope: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const user = request.user;

  if (!user) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  // 1. ADMIN and OWNER have unrestricted global access
  if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER) {
    response.locals.allowedStoreIds = null;
    response.locals.isUnrestrictedStoreAdmin = true;
    next();
    return;
  }

  // 2. SELLER must be APPROVED and scoped to assignedStores
  if (user.role === ROLES.SELLER) {
    try {
      const userDoc = await User.findById(user.id)
        .select('role sellerStatus assignedStores isActive deletedAt')
        .lean();

      if (!userDoc || !userDoc.isActive || userDoc.deletedAt !== null) {
        response
          .status(401)
          .json({ message: 'User account is inactive or not found.' });
        return;
      }

      if (userDoc.sellerStatus !== 'APPROVED') {
        response.status(403).json({
          message:
            'Seller account is not approved or is suspended. Please contact support.',
        });
        return;
      }

      const assignedStoreIds = (userDoc.assignedStores || []).map(
        (storeId: Types.ObjectId | string) => storeId.toString(),
      );

      response.locals.allowedStoreIds = assignedStoreIds;
      response.locals.isUnrestrictedStoreAdmin = false;
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  // 3. Any other role (CUSTOMER, DELIVERY) is forbidden
  response
    .status(403)
    .json({ message: 'Access denied: insufficient permissions.' });
};

export function isStoreAllowed(
  storeId: string,
  allowedStoreIds: string[] | null | undefined,
): boolean {
  if (allowedStoreIds === null || allowedStoreIds === undefined) {
    return true; // unrestricted (ADMIN/OWNER)
  }
  return allowedStoreIds.includes(storeId);
}
