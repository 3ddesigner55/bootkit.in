import { Router } from 'express';

import { getHomeController } from '../controllers/home.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const homeRoutes = Router();

homeRoutes.get('/', asyncHandler(getHomeController));
