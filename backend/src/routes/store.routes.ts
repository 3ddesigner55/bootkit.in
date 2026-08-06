import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createStoreController,
  deleteStoreController,
  getStoreBySlugController,
  getStoreController,
  getStoresController,
  updateStoreController,
} from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateStoreCreateRequest,
  validateStoreListQueryRequest,
  validateStoreUpdateRequest,
} from '../validators/store.validator';

export const storeRoutes = Router();
export const adminStoreRoutes = Router();

storeRoutes.get(
  '/',
  validateStoreListQueryRequest,
  asyncHandler(getStoresController),
);
storeRoutes.get('/slug/:slug', asyncHandler(getStoreBySlugController));
storeRoutes.get('/:id', asyncHandler(getStoreController));

adminStoreRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateStoreCreateRequest,
  asyncHandler(createStoreController),
);
adminStoreRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateStoreUpdateRequest,
  asyncHandler(updateStoreController),
);
adminStoreRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(deleteStoreController),
);
