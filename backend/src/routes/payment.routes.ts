import { Router } from 'express';

import { createRazorpayOrderController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRazorpayOrderRequest } from '../validators/payment.validator';

export const paymentRoutes = Router();

paymentRoutes.post(
  '/razorpay/order',
  authenticate,
  validateRazorpayOrderRequest,
  asyncHandler(createRazorpayOrderController),
);
