import { Router } from 'express';

import { verifyRazorpayPaymentController } from '../controllers/paymentVerification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRazorpayPaymentVerificationRequest } from '../validators/paymentVerification.validator';

export const paymentVerificationRoutes = Router();

paymentVerificationRoutes.post(
  '/razorpay/verify',
  authenticate,
  validateRazorpayPaymentVerificationRequest,
  asyncHandler(verifyRazorpayPaymentController),
);
