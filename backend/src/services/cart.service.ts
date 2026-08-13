import { isValidObjectId, type HydratedDocument, Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Cart, { type CartDocument, type CartItem } from '../models/cart.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from '../validators/cart.validator';

function serviceError(message: string, statusCode: number, code?: string): ApiError {
  return Object.assign(new Error(message), { statusCode, code });
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
    throw serviceError('Product not found or inactive.', HTTP_STATUS.NOT_FOUND);
  }

  return product;
}

async function resolveProductPriceAndStock(
  productId: Types.ObjectId | string,
  storeId?: Types.ObjectId | string | null,
) {
  const product = await getActiveProduct(productId.toString());

  if (!storeId || !isValidObjectId(storeId)) {
    throw serviceError(
      'A valid storeId is required to check product pricing and availability.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const inventory = await StoreInventory.findOne({
    store: storeId,
    product: product._id,
    active: true,
    deletedAt: null,
  });

  if (!inventory) {
    throw serviceError(
      `Product "${product.name}" is not available at the selected store.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const availableStock = Math.max(0, inventory.stock - (inventory.reservedStock || 0));
  return {
    product,
    price: inventory.sellingPrice,
    mrp: inventory.mrp,
    stock: availableStock,
  };
}

function validateStock(stock: number, quantity: number, productName?: string): void {
  if (quantity > stock) {
    const nameStr = productName ? ` for ${productName}` : '';
    throw serviceError(
      `Requested quantity exceeds available stock${nameStr}.`,
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
  return cart.populate([
    {
      path: 'items.product',
      select: 'name slug thumbnail sellingPrice stock active',
    },
    {
      path: 'store',
      select: 'name slug address city active',
    },
  ]);
}

async function getOrCreateCart(userId: string) {
  const cart = await Cart.findOne({ user: userId });

  if (cart) {
    return cart;
  }

  return Cart.create({ user: userId, store: null, items: [], totalItems: 0, subtotal: 0 });
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

  const cart = await getOrCreateCart(userId);

  const targetStoreId = input.storeId || (cart.store ? cart.store.toString() : undefined);

  if (!targetStoreId || !isValidObjectId(targetStoreId)) {
    throw serviceError(
      'storeId is required to add items to cart.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const storeExists = await Store.exists({
    _id: targetStoreId,
    active: true,
    deletedAt: null,
  });
  if (!storeExists) {
    throw serviceError('Store not found or inactive.', HTTP_STATUS.NOT_FOUND);
  }

  if (cart.store && cart.items.length > 0 && cart.store.toString() !== targetStoreId) {
    throw serviceError(
      'Cart contains items from another store. Please clear cart before adding items from a different store.',
      HTTP_STATUS.CONFLICT,
      'CART_STORE_MISMATCH',
    );
  }

  cart.store = new Types.ObjectId(targetStoreId);

  const { product, price, stock } = await resolveProductPriceAndStock(
    input.productId,
    cart.store,
  );

  const existingItem = cart.items.find(
    (item: CartItem) => item.product.toString() === product.id,
  );
  const quantity = (existingItem?.quantity ?? 0) + input.quantity;

  validateStock(stock, quantity, product.name);

  if (existingItem) {
    existingItem.quantity = quantity;
    existingItem.price = price;
  } else {
    cart.items.push({
      product: product._id,
      quantity: input.quantity,
      price,
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

  if (!cart.store && cart.items.length > 0) {
    throw serviceError(
      'Store selection is required for your cart. Please select a store to continue.',
      HTTP_STATUS.BAD_REQUEST,
      'STORE_SELECTION_REQUIRED',
    );
  }

  const { product, price, stock } = await resolveProductPriceAndStock(
    item.product.toString(),
    cart.store,
  );

  validateStock(stock, input.quantity, product.name);

  item.quantity = input.quantity;
  item.price = price;
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
  if (cart.items.length === 0) {
    cart.store = null;
  }
  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}

export async function clearCart(userId: string) {
  await validateUser(userId);
  const cart = await getOrCreateCart(userId);

  cart.items = [];
  cart.store = null;
  updateCartTotals(cart);
  await cart.save();

  return populateCart(cart);
}

