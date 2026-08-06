import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  getAdminOrderController,
  getAdminOrdersController,
  updateAdminOrderStatusController,
} from '../controllers/adminOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateAdminOrderListQueryRequest,
  validateAdminOrderStatusRequest,
} from '../validators/adminOrder.validator';

export const adminOrderRoutes = Router();

adminOrderRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));
adminOrderRoutes.get(
  '/',
  validateAdminOrderListQueryRequest,
  asyncHandler(getAdminOrdersController),
);
adminOrderRoutes.get('/:orderNumber', asyncHandler(getAdminOrderController));
adminOrderRoutes.patch(
  '/:orderNumber/status',
  validateAdminOrderStatusRequest,
  asyncHandler(updateAdminOrderStatusController),
);
