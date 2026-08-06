import { Router } from 'express';

import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateAddCartItemRequest,
  validateUpdateCartItemRequest,
} from '../validators/cart.validator';

export const cartRoutes = Router();

cartRoutes.use(authenticate);
cartRoutes.get('/', asyncHandler(getCartController));
cartRoutes.post(
  '/',
  validateAddCartItemRequest,
  asyncHandler(addCartItemController),
);
cartRoutes.patch(
  '/items/:itemId',
  validateUpdateCartItemRequest,
  asyncHandler(updateCartItemController),
);
cartRoutes.delete('/items/:itemId', asyncHandler(removeCartItemController));
cartRoutes.delete('/', asyncHandler(clearCartController));
