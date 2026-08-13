import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createBrandController,
  deleteBrandController,
  getAdminBrandsController,
  getBrandOptionsController,
  getBrandController,
  getBrandsController,
  uploadBrandLogoController,
  updateBrandController,
} from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateBrandCreateRequest,
  validateBrandUpdateRequest,
} from '../validators/brand.validator';

export const brandRoutes = Router();
export const adminBrandRoutes = Router();

brandRoutes.get('/', asyncHandler(getBrandsController));
brandRoutes.get('/:id', asyncHandler(getBrandController));

adminBrandRoutes.get(
  '/options',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(getBrandOptionsController),
);
adminBrandRoutes.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(getAdminBrandsController),
);
adminBrandRoutes.post(
  '/upload',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  asyncHandler(uploadBrandLogoController),
);
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
