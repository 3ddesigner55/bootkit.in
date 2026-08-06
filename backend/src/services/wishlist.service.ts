import { isValidObjectId, type HydratedDocument } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Product from '../models/product.model';
import User from '../models/user.model';
import Wishlist, {
  type WishlistDocument,
  type WishlistItem,
} from '../models/wishlist.model';
import type { ApiError } from '../types/api';
import { addCartItem } from './cart.service';
import type { AddWishlistItemInput } from '../validators/wishlist.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

async function validateUser(userId: string): Promise<void> {
  const user = await User.exists({
    _id: userId,
    isActive: true,
    deletedAt: null,
  });

  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
}

async function getActiveProduct(productId: string) {
  if (!isValidObjectId(productId)) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  const product = await Product.findOne({
    _id: productId,
    active: true,
    deletedAt: null,
  });

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  return product;
}

async function populateWishlist(wishlist: HydratedDocument<WishlistDocument>) {
  return wishlist.populate({
    path: 'items.product',
    select: 'name slug thumbnail sellingPrice stock active',
  });
}

async function getOrCreateWishlist(userId: string) {
  const wishlist = await Wishlist.findOne({ user: userId });

  if (wishlist) {
    return wishlist;
  }

  return Wishlist.create({ user: userId, items: [] });
}

function getProductId(productId: string): string {
  if (!isValidObjectId(productId)) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  return productId;
}

export async function getWishlist(userId: string) {
  await validateUser(userId);
  const wishlist = await getOrCreateWishlist(userId);

  return populateWishlist(wishlist);
}

export async function addWishlistItem(
  userId: string,
  input: AddWishlistItemInput,
) {
  await validateUser(userId);
  const [wishlist, product] = await Promise.all([
    getOrCreateWishlist(userId),
    getActiveProduct(input.productId),
  ]);
  const exists = wishlist.items.some(
    (item: WishlistItem) => item.product.toString() === product.id,
  );

  if (!exists) {
    wishlist.items.push({ product: product._id });
    await wishlist.save();
  }

  return populateWishlist(wishlist);
}

export async function removeWishlistItem(userId: string, productId: string) {
  await validateUser(userId);
  const wishlist = await Wishlist.findOne({ user: userId });
  const itemProductId = getProductId(productId);

  if (!wishlist) {
    throw serviceError('Wishlist item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const itemIndex = wishlist.items.findIndex(
    (item: WishlistItem) => item.product.toString() === itemProductId,
  );

  if (itemIndex === -1) {
    throw serviceError('Wishlist item not found.', HTTP_STATUS.NOT_FOUND);
  }

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  return populateWishlist(wishlist);
}

export async function clearWishlist(userId: string) {
  await validateUser(userId);
  const wishlist = await getOrCreateWishlist(userId);

  wishlist.items = [];
  await wishlist.save();

  return populateWishlist(wishlist);
}

export async function moveWishlistItemToCart(
  userId: string,
  productId: string,
) {
  await validateUser(userId);
  const wishlist = await Wishlist.findOne({ user: userId });
  const itemProductId = getProductId(productId);

  if (!wishlist) {
    throw serviceError('Wishlist item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const itemIndex = wishlist.items.findIndex(
    (item: WishlistItem) => item.product.toString() === itemProductId,
  );

  if (itemIndex === -1) {
    throw serviceError('Wishlist item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const cart = await addCartItem(userId, {
    productId: itemProductId,
    quantity: 1,
  });

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  return {
    wishlist: await populateWishlist(wishlist),
    cart,
  };
}
