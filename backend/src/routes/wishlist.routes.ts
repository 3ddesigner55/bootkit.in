import { Router } from 'express';

import {
  addWishlistItemController,
  clearWishlistController,
  getWishlistController,
  moveWishlistItemToCartController,
  removeWishlistItemController,
} from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validateAddWishlistItemRequest } from '../validators/wishlist.validator';

export const wishlistRoutes = Router();

wishlistRoutes.use(authenticate);
wishlistRoutes.get('/', asyncHandler(getWishlistController));
wishlistRoutes.post(
  '/',
  validateAddWishlistItemRequest,
  asyncHandler(addWishlistItemController),
);
wishlistRoutes.delete(
  '/:productId',
  asyncHandler(removeWishlistItemController),
);
wishlistRoutes.delete('/', asyncHandler(clearWishlistController));
wishlistRoutes.post(
  '/:productId/move-to-cart',
  asyncHandler(moveWishlistItemToCartController),
);
