import { isValidObjectId, type HydratedDocument } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Cart, { type CartDocument, type CartItem } from '../models/cart.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from '../validators/cart.validator';

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

function validateStock(stock: number, quantity: number): void {
  if (quantity > stock) {
    throw serviceError(
      'Requested quantity exceeds available stock.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

function updateCartTotals(cart: HydratedDocument<CartDocument>): void {
  cart.totalItems = cart.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  cart.subtotal = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
}

async function populateCart(cart: HydratedDocument<CartDocument>) {
  return cart.populate({
    path: 'items.product',
    select: 'name slug thumbnail sellingPrice stock active',
  });
}

async function getOrCreateCart(userId: string) {
  const cart = await Cart.findOne({ user: userId });

  if (cart) {
    return cart;
  }

  return Cart.create({ user: userId, items: [], totalItems: 0, subtotal: 0 });
}

function getCartItemId(itemId: string): string {
  if (!isValidObjectId(itemId)) {
    throw serviceError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
  }

  return itemId;
}

export async function getCart(userId: string) {
  await validateUser(userId);
  const cart = await getOrCreateCart(userId);

  return populateCart(cart);
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  await validateUser(userId);

  const [cart, product] = await Promise.all([
    getOrCreateCart(userId),
    getActiveProduct(input.productId),
  ]);
  const existingItem = cart.items.find(
    (item: CartItem) => item.product.toString() === product.id,
  );
  const quantity = (existingItem?.quantity ?? 0) + input.quantity;

  validateStock(product.stock, quantity);

  if (existingItem) {
    existingItem.quantity = quantity;
    existingItem.price = product.sellingPrice;
  } else {
    cart.items.push({
      product: product._id,
      quantity: input.quantity,
      price: product.sellingPrice,
    });
  }

  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput,
) {
  await validateUser(userId);
  const cart = await Cart.findOne({ user: userId });
  const cartItemId = getCartItemId(itemId);

  if (!cart) {
    throw serviceError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const item = cart.items.find(
    (cartItem: CartItem) => cartItem._id?.toString() === cartItemId,
  );

  if (!item) {
    throw serviceError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const product = await getActiveProduct(item.product.toString());
  validateStock(product.stock, input.quantity);

  item.quantity = input.quantity;
  item.price = product.sellingPrice;
  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}

export async function removeCartItem(userId: string, itemId: string) {
  await validateUser(userId);
  const cart = await Cart.findOne({ user: userId });
  const cartItemId = getCartItemId(itemId);

  if (!cart) {
    throw serviceError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
  }

  const itemIndex = cart.items.findIndex(
    (item: CartItem) => item._id?.toString() === cartItemId,
  );

  if (itemIndex === -1) {
    throw serviceError('Cart item not found.', HTTP_STATUS.NOT_FOUND);
  }

  cart.items.splice(itemIndex, 1);
  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}

export async function clearCart(userId: string) {
  await validateUser(userId);
  const cart = await getOrCreateCart(userId);

  cart.items = [];
  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}
