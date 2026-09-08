import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createProductController,
  deleteProductController,
  getAdminProductsController,
  getProductBySlugController,
  getProductController,
  getProductsController,
  getLegacyProductsReportController,
  uploadProductImagesController,
  updateProductController,
  importProductValidateController,
  importProductConfirmController,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { csvUpload, upload } from '../middleware/upload.middleware';
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

adminProductRoutes.get(
  '/legacy-report',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(getLegacyProductsReportController),
);
adminProductRoutes.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(getAdminProductsController),
);
adminProductRoutes.post(
  '/upload',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ]),
  asyncHandler(uploadProductImagesController),
);
adminProductRoutes.post(
  '/import/validate',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  csvUpload.single('csv'),
  asyncHandler(importProductValidateController),
);
adminProductRoutes.post(
  '/import/confirm',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(importProductConfirmController),
);
adminProductRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  validateProductCreateRequest,
  asyncHandler(createProductController),
);
adminProductRoutes.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(getProductController),
);
adminProductRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  validateProductUpdateRequest,
  asyncHandler(updateProductController),
);
adminProductRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(deleteProductController),
);
