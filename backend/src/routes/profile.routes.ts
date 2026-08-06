import { Router } from 'express';

import {
  changePasswordController,
  getProfileController,
  logoutAllSessionsController,
  updateProfileController,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateChangePasswordRequest,
  validateProfileUpdateRequest,
} from '../validators/profile.validator';

export const profileRoutes = Router();

profileRoutes.use(authenticate);
profileRoutes.get('/', asyncHandler(getProfileController));
profileRoutes.patch(
  '/',
  validateProfileUpdateRequest,
  asyncHandler(updateProfileController),
);
profileRoutes.patch(
  '/change-password',
  validateChangePasswordRequest,
  asyncHandler(changePasswordController),
);
profileRoutes.post('/logout-all', asyncHandler(logoutAllSessionsController));
