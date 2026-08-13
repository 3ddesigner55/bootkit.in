import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ROLES } from '../constants/roles';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import Refund from '../models/refund.model';
import { sendSuccess } from '../utils/apiResponse';

export const adminRefundsRoutes = Router();

adminRefundsRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// GET /api/admin/refunds
adminRefundsRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const refunds = await Refund.find()
      .populate('order', 'orderNumber grandTotal status')
      .populate('initiatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, HTTP_STATUS.OK, refunds, 'Refunds list retrieved successfully.');
  }),
);

// GET /api/admin/refunds/:refundId
adminRefundsRoutes.get(
  '/:refundId',
  asyncHandler(async (req: Request, res: Response) => {
    const refund = await Refund.findById(req.params.refundId)
      .populate('order')
      .populate('returnRequest')
      .populate('initiatedBy', 'firstName lastName email')
      .lean();

    if (!refund) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Refund record not found.',
      });
    }

    return sendSuccess(res, HTTP_STATUS.OK, refund, 'Refund details retrieved successfully.');
  }),
);
