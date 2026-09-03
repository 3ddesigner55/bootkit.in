import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  getAdminHeaderNavigationController,
  getPublicHeaderNavigationController,
  updateHeaderNavigationController,
} from '../controllers/headerNavigation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateHeaderNavigationUpdateRequest } from '../validators/headerNavigation.validator';

export const headerNavigationRoutes = Router();
export const adminHeaderNavigationRoutes = Router();

headerNavigationRoutes.get(
  '/',
  asyncHandler(getPublicHeaderNavigationController),
);

adminHeaderNavigationRoutes.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(getAdminHeaderNavigationController),
);

adminHeaderNavigationRoutes.put(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  validateHeaderNavigationUpdateRequest,
  asyncHandler(updateHeaderNavigationController),
);