import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ROLES } from '../constants/roles';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import ReturnRequest from '../models/returnRequest.model';
import StoreInventory from '../models/storeInventory.model';
import CatalogAudit from '../models/catalogAudit.model';
import { sendSuccess } from '../utils/apiResponse';

export const adminReturnsRoutes = Router();

adminReturnsRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// GET /api/admin/returns
adminReturnsRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const returns = await ReturnRequest.find()
      .populate('order', 'orderNumber')
      .populate('customer', 'firstName lastName phone')
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, HTTP_STATUS.OK, returns, 'Returns retrieved successfully.');
  }),
);

// PATCH /api/admin/returns/:returnId/status
adminReturnsRoutes.patch(
  '/:returnId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, resolution } = req.body;
    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Status is required.' });
    }

    const session = await mongoose.startSession();
    try {
      let updatedReturn;
      await session.withTransaction(async () => {
        const returnReq = await ReturnRequest.findById(req.params.returnId).session(session);
        if (!returnReq) {
          throw new Error('Return request not found.');
        }

        const oldStatus = returnReq.status;
        returnReq.status = status;
        returnReq.resolution = resolution || '';
        returnReq.resolvedAt = new Date();
        returnReq.resolvedBy = new mongoose.Types.ObjectId(req.user!.id);

        if (status === 'APPROVED') {
          for (const item of returnReq.items) {
            if (item.disposition === 'RESTOCK') {
              await StoreInventory.updateOne(
                { store: returnReq.store, product: item.product },
                { $inc: { stock: item.quantity } },
                { session },
              );

              // Audit inventory adjustment
              await CatalogAudit.create([{
                actor: req.user!.id,
                role: req.user!.role,
                action: 'INVENTORY_RESTOCKED_RETURN',
                entityType: 'STORE_INVENTORY',
                entityId: returnReq.store,
                reason: `Restock from approved return request ${returnReq._id}`,
                timestamp: new Date(),
              }], { session });
            }
          }
        }

        await returnReq.save({ session });
        updatedReturn = returnReq;
      });

      return sendSuccess(res, HTTP_STATUS.OK, updatedReturn, 'Return status updated successfully.');
    } catch (err: any) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
    } finally {
      await session.endSession();
    }
  }),
);
