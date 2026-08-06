import { Router } from 'express';

import {
  cancelOrderController,
  confirmCodOrderController,
  placeOrderController,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateCancelOrderRequest,
  validateConfirmCodRequest,
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
orderRoutes.patch(
  '/:orderNumber/confirm-cod',
  authenticate,
  validateConfirmCodRequest,
  asyncHandler(confirmCodOrderController),
);
