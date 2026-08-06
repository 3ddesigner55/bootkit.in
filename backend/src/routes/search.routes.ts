import { Router } from 'express';

import { globalSearchController } from '../controllers/search.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { validateSearchQueryRequest } from '../validators/search.validator';

export const searchRoutes = Router();

searchRoutes.get(
  '/',
  validateSearchQueryRequest,
  asyncHandler(globalSearchController),
);
