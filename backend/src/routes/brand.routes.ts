import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createBrandController,
  deleteBrandController,
  getBrandController,
  getBrandsController,
  updateBrandController,
} from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateBrandCreateRequest,
  validateBrandUpdateRequest,
} from '../validators/brand.validator';

export const brandRoutes = Router();
export const adminBrandRoutes = Router();

brandRoutes.get('/', asyncHandler(getBrandsController));
brandRoutes.get('/:id', asyncHandler(getBrandController));

adminBrandRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateBrandCreateRequest,
  asyncHandler(createBrandController),
);
adminBrandRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateBrandUpdateRequest,
  asyncHandler(updateBrandController),
);
adminBrandRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(deleteBrandController),
);
