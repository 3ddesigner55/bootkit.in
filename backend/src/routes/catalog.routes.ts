import { Router } from 'express';

import { getCatalogProductsController } from '../controllers/catalog.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { validateCatalogQueryRequest } from '../validators/catalog.validator';

export const catalogRoutes = Router();

catalogRoutes.get(
  '/products',
  validateCatalogQueryRequest,
  asyncHandler(getCatalogProductsController),
);
