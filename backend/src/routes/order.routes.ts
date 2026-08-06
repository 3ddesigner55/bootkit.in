import { Router } from 'express';

import {
  cancelOrderController,
  placeOrderController,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateCancelOrderRequest,
  validatePlaceOrderRequest,
} from '../validators/order.validator';

export const orderRoutes = Router();

orderRoutes.post(
  '/',
  authenticate,
  validatePlaceOrderRequest,
  asyncHandler(placeOrderController),
);
orderRoutes.patch(
  '/:orderNumber/cancel',
  authenticate,
  validateCancelOrderRequest,
  asyncHandler(cancelOrderController),
);
