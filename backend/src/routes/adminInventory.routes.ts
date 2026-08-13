import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import { getAdminStoreInventories, adjustStoreInventoryStock } from '../services/adminStoreInventory.service';
import { validateAdminStoreInventoryListQuery } from '../validators/adminStoreInventory.validator';
import { sendSuccess } from '../utils/apiResponse';

export const adminInventoryRoutes = Router();

adminInventoryRoutes.use(authenticate, requireStoreScope);

adminInventoryRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const query = validateAdminStoreInventoryListQuery(req.query);
    const result = await getAdminStoreInventories(
      query,
      res.locals.allowedStoreIds as string[] | null | undefined,
    );
    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      result,
      'Inventory list retrieved successfully.',
    );
  }),
);

adminInventoryRoutes.post(
  '/:id/adjust',
  asyncHandler(async (req: Request, res: Response) => {
    const { delta, reason, currentStock } = req.body;
    if (delta === undefined || typeof delta !== 'number') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Delta must be a number.',
      });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reason is required for stock adjustment.',
      });
    }
    if (currentStock === undefined || typeof currentStock !== 'number') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current stock value is required to detect concurrent edits.',
      });
    }

    const updated = await adjustStoreInventoryStock(
      req.params.id as string,
      delta,
      reason,
      currentStock,
      req.user!.id,
      res.locals.allowedStoreIds as string[] | null | undefined,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      updated,
      'Inventory stock adjusted successfully.',
    );
  }),
);
