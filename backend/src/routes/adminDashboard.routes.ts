import { Router } from 'express';

import { ROLES } from '../constants/roles';
import { getAdminDashboardMetricsController } from '../controllers/adminDashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const adminDashboardRoutes = Router();

adminDashboardRoutes.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(getAdminDashboardMetricsController),
);
