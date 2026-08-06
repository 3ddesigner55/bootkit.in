import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createProductController,
  deleteProductController,
  getProductBySlugController,
  getProductController,
  getProductsController,
  updateProductController,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateProductCreateRequest,
  validateProductUpdateRequest,
} from '../validators/product.validator';

export const productRoutes = Router();
export const adminProductRoutes = Router();

productRoutes.get('/', asyncHandler(getProductsController));
productRoutes.get('/slug/:slug', asyncHandler(getProductBySlugController));
productRoutes.get('/:id', asyncHandler(getProductController));

adminProductRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateProductCreateRequest,
  asyncHandler(createProductController),
);
adminProductRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateProductUpdateRequest,
  asyncHandler(updateProductController),
);
adminProductRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(deleteProductController),
);
