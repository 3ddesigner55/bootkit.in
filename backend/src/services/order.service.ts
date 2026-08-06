import mongoose, { isValidObjectId, type HydratedDocument } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Address from '../models/address.model';
import Cart, { type CartItem } from '../models/cart.model';
import Order, {
  type OrderDocument,
  type OrderItem,
} from '../models/order.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  CancelOrderInput,
  PlaceOrderInput,
} from '../validators/order.validator';

const ORDER_NUMBER_ATTEMPTS = 3;

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateObjectId(value: string, name: string): void {
  if (!isValidObjectId(value)) {
    throw serviceError(`${name} not found.`, HTTP_STATUS.NOT_FOUND);
  }
}

function getOrderNumberPrefix(date: Date): string {
  return `BK${date.toISOString().slice(0, 10).replaceAll('-', '')}`;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  validateObjectId(input.addressId, 'Address');
  validateObjectId(input.storeId, 'Store');

  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      let createdOrder: HydratedDocument<OrderDocument> | undefined;

      await session.withTransaction(async () => {
        const [user, cart, address, store] = await Promise.all([
          User.exists({ _id: userId, isActive: true, deletedAt: null }).session(
            session,
          ),
          Cart.findOne({ user: userId }).session(session),
          Address.findOne({
            _id: input.addressId,
            user: userId,
            deletedAt: null,
          }).session(session),
          Store.findOne({
            _id: input.storeId,
            active: true,
            deletedAt: null,
          }).session(session),
        ]);

        if (!user) {
          throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
        }

        if (!cart || cart.items.length === 0) {
          throw serviceError('Cart is empty.', HTTP_STATUS.BAD_REQUEST);
        }

        if (!address) {
          throw serviceError('Address not found.', HTTP_STATUS.NOT_FOUND);
        }

        if (!store) {
          throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
        }

        const cartItems = cart.items as CartItem[];
        const productIds = cartItems.map((item) => item.product);
        const products = await Product.find({
          _id: { $in: productIds },
          active: true,
          deletedAt: null,
        }).session(session);
        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );

        if (productsById.size !== cartItems.length) {
          throw serviceError(
            'One or more cart products are unavailable.',
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const orderItems: OrderItem[] = cartItems.map((cartItem) => {
          const product = productsById.get(cartItem.product.toString());

          if (!product) {
            throw serviceError(
              'One or more cart products are unavailable.',
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          if (product.stock < cartItem.quantity) {
            throw serviceError(
              `Insufficient stock for ${product.name}.`,
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          return {
            product: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            quantity: cartItem.quantity,
            mrp: product.mrp,
            sellingPrice: product.sellingPrice,
            total: product.sellingPrice * cartItem.quantity,
          };
        });
        const subtotal = orderItems.reduce(
          (total, item) => total + item.total,
          0,
        );
        const prefix = getOrderNumberPrefix(new Date());
        const orderCount = await Order.countDocuments({
          orderNumber: new RegExp(`^${prefix}`),
        }).session(session);
        const orderNumber = `${prefix}${String(orderCount + 1).padStart(4, '0')}`;

        [createdOrder] = await Order.create(
          [
            {
              orderNumber,
              user: userId,
              store: input.storeId,
              address: input.addressId,
              items: orderItems,
              subtotal,
              discount: 0,
              deliveryCharge: 0,
              tax: 0,
              grandTotal: subtotal,
              couponCode: input.couponCode ?? '',
              couponDiscount: 0,
              paymentMethod: input.paymentMethod,
              status: 'PLACED',
            },
          ],
          { session },
        );

        for (const item of orderItems) {
          const stockUpdate = await Product.updateOne(
            {
              _id: item.product,
              active: true,
              deletedAt: null,
              stock: { $gte: item.quantity },
            },
            { $inc: { stock: -item.quantity } },
            { session },
          );

          if (stockUpdate.modifiedCount !== 1) {
            throw serviceError(
              'One or more cart products are out of stock.',
              HTTP_STATUS.BAD_REQUEST,
            );
          }
        }

        cart.items = [];
        cart.totalItems = 0;
        cart.subtotal = 0;
        await cart.save({ session });
      });

      if (!createdOrder) {
        throw serviceError(
          'Order could not be created.',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      return createdOrder;
    } catch (error) {
      if (isDuplicateKeyError(error) && attempt < ORDER_NUMBER_ATTEMPTS - 1) {
        continue;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw serviceError(
    'Order could not be created.',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

export async function cancelOrder(
  userId: string,
  orderNumber: string,
  input: CancelOrderInput,
) {
  const session = await mongoose.startSession();

  try {
    let cancelledOrder: HydratedDocument<OrderDocument> | undefined;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        orderNumber,
        user: userId,
      }).session(session);

      if (!order) {
        throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
      }

      if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
        throw serviceError(
          'This order cannot be cancelled.',
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      for (const item of order.items) {
        const stockUpdate = await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session },
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw serviceError(
            'Order product not found.',
            HTTP_STATUS.BAD_REQUEST,
          );
        }
      }

      order.status = 'CANCELLED';
      order.cancelReason = input.reason;
      order.cancelledAt = new Date();
      await order.save({ session });
      cancelledOrder = order;
    });

    if (!cancelledOrder) {
      throw serviceError(
        'Order could not be cancelled.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return cancelledOrder;
  } finally {
    await session.endSession();
  }
}
