import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
} from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const categoryRoutes = Router();
export const adminCategoryRoutes = Router();

categoryRoutes.get('/', asyncHandler(getCategoriesController));
categoryRoutes.get('/:id', asyncHandler(getCategoryController));

adminCategoryRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(createCategoryController),
);
adminCategoryRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(updateCategoryController),
);
adminCategoryRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(deleteCategoryController),
);
