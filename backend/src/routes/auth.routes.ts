import { Router } from 'express';

import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateLoginRequest,
  validateRefreshTokenRequest,
  validateRegisterRequest,
} from '../validators/auth.validator';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateRegisterRequest,
  asyncHandler(registerController),
);
authRoutes.post('/login', validateLoginRequest, asyncHandler(loginController));
authRoutes.post(
  '/refresh',
  validateRefreshTokenRequest,
  asyncHandler(refreshController),
);
authRoutes.post('/logout', authenticate, asyncHandler(logoutController));
