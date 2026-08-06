import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  getCustomersReportController,
  getSalesReportController,
  getStoresReportController,
  getTopCategoriesReportController,
  getTopProductsReportController,
} from '../controllers/adminReport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateAdminReportQueryRequest } from '../validators/adminReport.validator';

export const adminReportRoutes = Router();

adminReportRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));
adminReportRoutes.get(
  '/sales',
  validateAdminReportQueryRequest,
  asyncHandler(getSalesReportController),
);
adminReportRoutes.get(
  '/top-products',
  validateAdminReportQueryRequest,
  asyncHandler(getTopProductsReportController),
);
adminReportRoutes.get(
  '/top-categories',
  validateAdminReportQueryRequest,
  asyncHandler(getTopCategoriesReportController),
);
adminReportRoutes.get(
  '/stores',
  validateAdminReportQueryRequest,
  asyncHandler(getStoresReportController),
);
adminReportRoutes.get(
  '/customers',
  validateAdminReportQueryRequest,
  asyncHandler(getCustomersReportController),
);
