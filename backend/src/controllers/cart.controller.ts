import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from '../validators/cart.validator';

function getItemId(request: Request): string {
  return Array.isArray(request.params.itemId) ? '' : request.params.itemId;
}

export async function getCartController(request: Request, response: Response) {
  const cart = await getCart(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    cart,
    'Cart retrieved successfully.',
  );
}

export async function addCartItemController(
  request: Request,
  response: Response,
) {
  const cart = await addCartItem(
    request.user!.id,
    response.locals.addCartItem as AddCartItemInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    cart,
    'Cart updated successfully.',
  );
}

export async function updateCartItemController(
  request: Request,
  response: Response,
) {
  const cart = await updateCartItem(
    request.user!.id,
    getItemId(request),
    response.locals.updateCartItem as UpdateCartItemInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    cart,
    'Cart updated successfully.',
  );
}

export async function removeCartItemController(
  request: Request,
  response: Response,
) {
  const cart = await removeCartItem(request.user!.id, getItemId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    cart,
    'Cart item removed successfully.',
  );
}

export async function clearCartController(
  request: Request,
  response: Response,
) {
  const cart = await clearCart(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    cart,
    'Cart cleared successfully.',
  );
}
