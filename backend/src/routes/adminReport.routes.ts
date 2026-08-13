import { Router } from 'express';

import {
  getCustomersReportController,
  getCustomerGrowthReportController,
  getOrderStatusesReportController,
  getPaymentMethodsReportController,
  getSalesReportController,
  getStoresReportController,
  getTopBrandsReportController,
  getTopCategoriesReportController,
  getTopProductsReportController,
} from '../controllers/adminReport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateAdminReportQueryRequest } from '../validators/adminReport.validator';

export const adminReportRoutes = Router();

adminReportRoutes.use(authenticate, requireStoreScope);
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
  '/top-brands',
  validateAdminReportQueryRequest,
  asyncHandler(getTopBrandsReportController),
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
adminReportRoutes.get(
  '/customer-growth',
  validateAdminReportQueryRequest,
  asyncHandler(getCustomerGrowthReportController),
);
adminReportRoutes.get(
  '/payment-methods',
  validateAdminReportQueryRequest,
  asyncHandler(getPaymentMethodsReportController),
);
adminReportRoutes.get(
  '/order-statuses',
  validateAdminReportQueryRequest,
  asyncHandler(getOrderStatusesReportController),
);
