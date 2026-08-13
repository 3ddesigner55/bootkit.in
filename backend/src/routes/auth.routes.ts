import { Router } from 'express';

import {
  loginController,
  logoutController,
  refreshController,
  registerController,
  sendOtpController,
  verifyOtpController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateLoginRequest,
  validateRefreshTokenRequest,
  validateRegisterRequest,
  validateSendOtpRequest,
  validateVerifyOtpRequest,
} from '../validators/auth.validator';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateRegisterRequest,
  asyncHandler(registerController),
);
authRoutes.post('/login', validateLoginRequest, asyncHandler(loginController));
authRoutes.post(
  '/send-otp',
  validateSendOtpRequest,
  asyncHandler(sendOtpController),
);
authRoutes.post(
  '/verify-otp',
  validateVerifyOtpRequest,
  asyncHandler(verifyOtpController),
);
authRoutes.post(
  '/refresh',
  validateRefreshTokenRequest,
  asyncHandler(refreshController),
);
authRoutes.post('/logout', authenticate, asyncHandler(logoutController));
authRoutes.post('/forgot-password', asyncHandler(forgotPasswordController));
authRoutes.post('/reset-password', asyncHandler(resetPasswordController));
