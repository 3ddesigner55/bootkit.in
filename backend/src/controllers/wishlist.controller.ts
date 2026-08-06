import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  addWishlistItem,
  clearWishlist,
  getWishlist,
  moveWishlistItemToCart,
  removeWishlistItem,
} from '../services/wishlist.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AddWishlistItemInput } from '../validators/wishlist.validator';

function getProductId(request: Request): string {
  return Array.isArray(request.params.productId)
    ? ''
    : request.params.productId;
}

export async function getWishlistController(
  request: Request,
  response: Response,
) {
  const wishlist = await getWishlist(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    wishlist,
    'Wishlist retrieved successfully.',
  );
}

export async function addWishlistItemController(
  request: Request,
  response: Response,
) {
  const wishlist = await addWishlistItem(
    request.user!.id,
    response.locals.addWishlistItem as AddWishlistItemInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    wishlist,
    'Wishlist updated successfully.',
  );
}

export async function removeWishlistItemController(
  request: Request,
  response: Response,
) {
  const wishlist = await removeWishlistItem(
    request.user!.id,
    getProductId(request),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    wishlist,
    'Wishlist item removed successfully.',
  );
}

export async function clearWishlistController(
  request: Request,
  response: Response,
) {
  const wishlist = await clearWishlist(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    wishlist,
    'Wishlist cleared successfully.',
  );
}

export async function moveWishlistItemToCartController(
  request: Request,
  response: Response,
) {
  const result = await moveWishlistItemToCart(
    request.user!.id,
    getProductId(request),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Wishlist item moved to cart successfully.',
  );
}
