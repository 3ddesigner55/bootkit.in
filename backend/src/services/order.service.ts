import crypto from 'crypto';
import mongoose, {
  isValidObjectId,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Address from '../models/address.model';
import Cart, { type CartItem } from '../models/cart.model';
import Order, {
  type OrderDocument,
  type OrderItem,
} from '../models/order.model';
import Product, { type ProductDocument } from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory, {
  type StoreInventoryDocument,
} from '../models/storeInventory.model';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import WalletTransaction from '../models/walletTransaction.model';
import Coupon from '../models/coupon.model';
import CouponRedemption from '../models/couponRedemption.model';
import { calculateOrderTotal } from './orderCalculation.service';
import type { ApiError } from '../types/api';
import {
  sendNotificationAsync,
  sendOrderCancelledEmail,
  sendOrderPlacedEmail,
} from './notification.service';
import type {
  CancelOrderInput,
  MyOrdersQuery,
  PlaceOrderInput,
} from '../validators/order.validator';

const ORDER_NUMBER_ATTEMPTS = 3;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function serviceError(message: string, statusCode: number, code?: string): ApiError {
  return Object.assign(new Error(message), { statusCode, code });
}

function validateObjectId(value: string, name: string): void {
  if (!isValidObjectId(value)) {
    throw serviceError(`${name} not found.`, HTTP_STATUS.NOT_FOUND);
  }
}

function getOrderNumberPrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `BK${year}${month}${day}`;
}

export function computeOrderRequestFingerprint(
  userId: string,
  input: PlaceOrderInput,
  cartItems: CartItem[],
): string {
  const normalizedItems = cartItems
    .map((item) => ({
      productId: item.product.toString(),
      quantity: item.quantity,
    }))
    .sort((a, b) => a.productId.localeCompare(b.productId));

  const payload = {
    userId,
    addressId: input.addressId,
    storeId: input.storeId,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode || '',
    items: normalizedItems,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

function notifyOrderCancellation(userId: string, orderNumber: string): void {
  sendNotificationAsync(
    (async () => {
      const user = await User.findOne({
        _id: userId,
        isActive: true,
        deletedAt: null,
      })
        .select('email firstName')
        .lean();

      if (!user) {
        return { sent: false, error: 'Notification recipient not found.' };
      }

      return sendOrderCancelledEmail({
        email: user.email,
        customerName: user.firstName,
        orderNumber,
      });
    })(),
    'order_cancelled',
  );
}

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  validateObjectId(input.addressId, 'Address');
  validateObjectId(input.storeId, 'Store');

  if (!input.idempotencyKey || !input.idempotencyKey.trim()) {
    throw serviceError('idempotencyKey is required.', HTTP_STATUS.BAD_REQUEST);
  }

  const existingOrder = await Order.findOne({
    user: userId,
    idempotencyKey: input.idempotencyKey.trim(),
  });

  if (existingOrder) {
    const currentCart = await Cart.findOne({ user: userId });
    if (currentCart && currentCart.items.length > 0) {
      const currentFingerprint = computeOrderRequestFingerprint(
        userId,
        input,
        currentCart.items as CartItem[],
      );

      if (
        existingOrder.requestFingerprint &&
        existingOrder.requestFingerprint !== currentFingerprint
      ) {
        throw serviceError(
          'Idempotency key has already been used with a different request payload.',
          HTTP_STATUS.CONFLICT,
          'IDEMPOTENCY_CONFLICT',
        );
      }
    }

    return existingOrder;
  }


  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    let createdOrder: HydratedDocument<OrderDocument> | undefined;
    let orderPlacedNotification:
      | { email: string; customerName: string; orderNumber: string }
      | undefined;

    const executeOrderCreation = async (session?: mongoose.ClientSession) => {
      const userQuery = User.findOne({
        _id: userId,
        isActive: true,
        deletedAt: null,
      }).select('email firstName');
      const cartQuery = Cart.findOne({ user: userId });
      const addressQuery = Address.findOne({
        _id: input.addressId,
        user: userId,
        deletedAt: null,
      });
      const storeQuery = Store.findOne({
        _id: input.storeId,
        active: true,
        deletedAt: null,
      });

      if (session) {
        userQuery.session(session);
        cartQuery.session(session);
        addressQuery.session(session);
        storeQuery.session(session);
      }

      const [user, cart, address, store] = await Promise.all([
        userQuery,
        cartQuery,
        addressQuery,
        storeQuery,
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
        throw serviceError('Store not found or inactive.', HTTP_STATUS.NOT_FOUND);
      }

      const cartItems = cart.items as CartItem[];
      const productIds = cartItems.map((item) => item.product);

      const prodQuery = Product.find({
        _id: { $in: productIds },
        active: true,
        deletedAt: null,
      });
      const invQuery = StoreInventory.find({
        store: input.storeId,
        product: { $in: productIds },
        active: true,
        deletedAt: null,
      });

      if (session) {
        prodQuery.session(session);
        invQuery.session(session);
      }

      const [products, storeInventories] = await Promise.all([
        prodQuery,
        invQuery,
      ]);

      const productsById = new Map<string, HydratedDocument<ProductDocument>>(
        products.map((product) => [product.id, product]),
      );
      const inventoriesByProductId = new Map<
        string,
        HydratedDocument<StoreInventoryDocument>
      >(storeInventories.map((inv) => [inv.product.toString(), inv]));

      if (productsById.size !== cartItems.length) {
        throw serviceError(
          'One or more cart products are unavailable.',
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const requestFingerprint = computeOrderRequestFingerprint(
        userId,
        input,
        cartItems,
      );

      const orderItems: OrderItem[] = cartItems.map((cartItem) => {
        const product = productsById.get(cartItem.product.toString());

        if (!product) {
          throw serviceError(
            'One or more cart products are unavailable.',
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const inventory = inventoriesByProductId.get(product.id);

        if (!inventory || !inventory.active || inventory.deletedAt) {
          throw serviceError(
            `Product "${product.name}" is not available at the selected store.`,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const availableStock = Math.max(
          0,
          inventory.stock - (inventory.reservedStock || 0),
        );
        if (availableStock < cartItem.quantity) {
          throw serviceError(
            `Insufficient stock for "${product.name}" at selected store (available: ${availableStock}, requested: ${cartItem.quantity}).`,
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const itemPrice = inventory.sellingPrice;
        const itemMrp = inventory.mrp;

        return {
          product: product._id,
          name: product.name,
          thumbnail: product.thumbnail,
          quantity: cartItem.quantity,
          mrp: itemMrp,
          sellingPrice: itemPrice,
          total: itemPrice * cartItem.quantity,
        };
      });

      const decrementedItems: Array<{
        storeId: string;
        productId: Types.ObjectId;
        quantity: number;
      }> = [];

      try {
        for (const cartItem of cartItems) {
          const updateQuery = StoreInventory.updateOne(
            {
              store: input.storeId,
              product: cartItem.product,
              active: true,
              deletedAt: null,
              stock: { $gte: cartItem.quantity },
            },
            { $inc: { stock: -cartItem.quantity } },
          );
          if (session) updateQuery.session(session);
          const res = await updateQuery;
          if (res.modifiedCount !== 1) {
            throw serviceError(
              `Insufficient stock during checkout.`,
              HTTP_STATUS.BAD_REQUEST,
            );
          }
          decrementedItems.push({
            storeId: input.storeId,
            productId: cartItem.product,
            quantity: cartItem.quantity,
          });
        }

        let calculation;
        try {
          calculation = await calculateOrderTotal({
            storeId: input.storeId,
            pincode: address.pincode,
            addressId: input.addressId,
            items: cartItems.map((item) => ({
              productId: item.product.toString(),
              quantity: item.quantity,
            })),
            couponCode: input.couponCode,
            useWallet: input.useWallet,
            userId,
          });
        } catch (calcErr: any) {
          throw serviceError(calcErr.message, HTTP_STATUS.BAD_REQUEST);
        }

        const orderItemsWithTax = orderItems.map((item, idx) => {
          const calcItem = calculation.itemDetails[idx];
          return {
            ...item,
            tax: calcItem.tax,
            cgst: calcItem.cgst,
            sgst: calcItem.sgst,
            igst: calcItem.igst,
          };
        });

        const prefix = getOrderNumberPrefix(new Date());
        const countQuery = Order.countDocuments({
          orderNumber: new RegExp(`^${prefix}`),
        });
        if (session) countQuery.session(session);
        const orderCount = await countQuery;
        const orderNumber = `${prefix}${String(orderCount + 1).padStart(4, '0')}`;

        const orderData = {
          orderNumber,
          user: userId,
          store: input.storeId,
          address: input.addressId,
          items: orderItemsWithTax,
          subtotal: calculation.subtotal,
          discount: calculation.discount,
          deliveryCharge: calculation.deliveryCharge,
          tax: calculation.tax,
          cgst: calculation.cgst,
          sgst: calculation.sgst,
          igst: calculation.igst,
          walletDebit: calculation.walletDebit,
          grandTotal: calculation.grandTotal,
          couponCode: calculation.appliedCoupon || '',
          couponDiscount: calculation.couponDiscount,
          paymentMethod: input.paymentMethod,
          status: 'PLACED',
          idempotencyKey: input.idempotencyKey.trim(),
          requestFingerprint,
        };

        if (session) {
          [createdOrder] = await Order.create([orderData], { session });
        } else {
          createdOrder = await Order.create(orderData);
        }

        if (!createdOrder) {
          throw serviceError(
            'Order could not be created.',
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
        }

        // Deduct Wallet balance if useWallet was applied
        if (calculation.walletDebit > 0) {
          const wallet = await Wallet.findOne({ customer: userId });
          if (wallet) {
            const balanceBefore = wallet.balance;
            wallet.balance -= calculation.walletDebit;
            if (session) {
              await wallet.save({ session });
            } else {
              await wallet.save();
            }

            const wTxData = {
              customer: userId,
              wallet: wallet._id,
              direction: 'DEBIT' as const,
              transactionType: 'ORDER_DEBIT',
              amount: calculation.walletDebit,
              idempotencyKey: `order-debit-${orderNumber}`,
              adminReason: `Debit for Order #${orderNumber}`,
              balanceBefore,
              balanceAfter: wallet.balance,
            };
            if (session) {
              await WalletTransaction.create([wTxData], { session });
            } else {
              await WalletTransaction.create(wTxData);
            }
          }
        }

        // Register Coupon Redemption if a coupon was successfully applied
        if (calculation.appliedCoupon) {
          const coupon = await Coupon.findOne({ code: calculation.appliedCoupon });
          if (coupon) {
            const redemptionData = {
              coupon: coupon._id,
              customer: userId,
              order: createdOrder._id,
              store: input.storeId,
              discountAmount: calculation.couponDiscount,
              status: 'REDEEMED' as const,
              idempotencyKey: `coupon-redeem-${orderNumber}`,
              reservedAt: new Date(),
              redeemedAt: new Date(),
            };
            if (session) {
              await CouponRedemption.create([redemptionData], { session });
            } else {
              await CouponRedemption.create(redemptionData);
            }
          }
        }

        orderPlacedNotification = {
          email: user.email,
          customerName: user.firstName,
          orderNumber: createdOrder.orderNumber,
        };

        cart.items = [];
        cart.totalItems = 0;
        cart.subtotal = 0;
        cart.store = null;
        if (session) {
          await cart.save({ session });
        } else {
          await cart.save();
        }
      } catch (innerErr) {
        if (!session || !session.inTransaction()) {
          for (const item of decrementedItems) {
            await StoreInventory.updateOne(
              { store: item.storeId, product: item.productId },
              { $inc: { stock: item.quantity } },
            );
          }
        }
        throw innerErr;
      }
    };

    try {
      const session = await mongoose.startSession();
      try {
        let isTxUnsupported = false;
        try {
          await session.withTransaction(async () => {
            await executeOrderCreation(session);
          });
        } catch (txErr: any) {
          if (
            txErr?.code === 117 ||
            txErr?.codeName === 'ConflictingOperationInProgress' ||
            txErr?.message?.includes('active transaction number') ||
            txErr?.message?.includes('sharded cluster') ||
            txErr?.message?.includes('replica set')
          ) {
            isTxUnsupported = true;
          } else {
            throw txErr;
          }
        }

        if (isTxUnsupported) {
          await executeOrderCreation();
        }
      } finally {
        await session.endSession();
      }

      if (!createdOrder) {
        throw serviceError(
          'Order could not be created.',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      if (orderPlacedNotification) {
        sendNotificationAsync(
          sendOrderPlacedEmail(orderPlacedNotification),
          'order_placed',
        );
      }

      return createdOrder;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const existingOrder = await Order.findOne({
          user: userId,
          idempotencyKey: input.idempotencyKey.trim(),
        });
        if (existingOrder) {
          return existingOrder;
        }
      }

      if (isDuplicateKeyError(error) && attempt < ORDER_NUMBER_ATTEMPTS - 1) {
        continue;
      }

      throw error;
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
        const stockUpdate = await StoreInventory.updateOne(
          { store: order.store, product: item.product },
          { $inc: { stock: item.quantity } },
          { session },
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw serviceError(
            'Store inventory item not found.',
            HTTP_STATUS.BAD_REQUEST,
          );
        }
      }

      // Invalidate/release coupon redemption
      if (order.couponCode) {
        await CouponRedemption.updateOne(
          { order: order._id, status: 'REDEEMED' },
          { status: 'CANCELLED', releasedAt: new Date() },
          { session }
        );
      }

      // Refund wallet balance if applicable
      if (order.walletDebit && order.walletDebit > 0) {
        const wallet = await Wallet.findOne({ customer: order.user }).session(session);
        if (wallet) {
          const balanceBefore = wallet.balance;
          wallet.balance += order.walletDebit;
          await wallet.save({ session });

          const wTxData = {
            customer: order.user,
            wallet: wallet._id,
            direction: 'CREDIT' as const,
            transactionType: 'REFUND_CREDIT',
            amount: order.walletDebit,
            idempotencyKey: `order-cancel-refund-${order.orderNumber}`,
            adminReason: `Refund for Cancelled Order #${order.orderNumber}`,
            balanceBefore,
            balanceAfter: wallet.balance,
          };
          await WalletTransaction.create([wTxData], { session });
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

    notifyOrderCancellation(userId, cancelledOrder.orderNumber);

    return cancelledOrder;
  } finally {
    await session.endSession();
  }
}

export async function confirmCodOrder(userId: string, orderNumber: string) {
  const order = await Order.findOne({ orderNumber, user: userId });

  if (!order) {
    throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (order.paymentMethod !== 'COD') {
    throw serviceError(
      'This order does not use cash on delivery.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (order.paymentStatus !== 'PENDING') {
    throw serviceError(
      'Payment is not pending for this order.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (order.status !== 'PLACED') {
    throw serviceError(
      'This order cannot be confirmed.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  order.status = 'CONFIRMED';
  await order.save();

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
  };
}

export async function getMyOrders(userId: string, query: MyOrdersQuery) {
  const filter = { user: userId };
  const skip = (query.page - 1) * query.limit;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate({
        path: 'items.product',
        select:
          'name slug thumbnail unit sellingPrice mrp stock active deletedAt category brand',
        populate: [
          { path: 'category', select: 'name slug icon' },
          { path: 'brand', select: 'name slug logo' },
        ],
      })
      .populate({
        path: 'address',
        select:
          'fullName phone houseNumber street area landmark city state pincode',
      })
      .lean(),
  ]);

  const items = orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: (order.items as OrderItem[]).map((item: OrderItem) => ({
      product: item.product,
      name: item.name,
      thumbnail: item.thumbnail,
      quantity: item.quantity,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    deliveryCharge: order.deliveryCharge,
    tax: order.tax,
    grandTotal: order.grandTotal,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    address: order.address,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    deliveredAt: order.deliveredAt,
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt,
    createdAt: (order as unknown as { createdAt?: Date }).createdAt,
    updatedAt: (order as unknown as { updatedAt?: Date }).updatedAt,
  }));

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getOrderAgainProducts(userId: string) {
  const orders = await Order.find({
    user: userId,
    status: { $ne: 'CANCELLED' },
  })
    .sort({ createdAt: -1 })
    .select('items createdAt')
    .lean();

  const seen = new Set<string>();
  const productIds: Types.ObjectId[] = [];

  for (const order of orders) {
    for (const item of order.items as OrderItem[]) {
      if (item.product) {
        const idStr = item.product.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          productIds.push(item.product);
        }
      }
    }
  }

  if (productIds.length === 0) {
    return {
      products: [],
      categories: [],
    };
  }

  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
    deletedAt: null,
  })
    .populate('category', 'name slug icon')
    .populate('brand', 'name slug logo')
    .lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const orderedProducts = [];

  for (const id of productIds) {
    const product = productMap.get(id.toString());
    if (product) {
      orderedProducts.push(product);
    }
  }

  const categoriesMap = new Map<
    string,
    { title: string; slug: string; count: number; images: string[] }
  >();

  for (const product of orderedProducts) {
    const category = product.category as
      | { _id: Types.ObjectId; name: string; slug: string; icon?: string }
      | undefined;

    if (category?.slug) {
      const existing = categoriesMap.get(category.slug);
      const thumbnail = product.thumbnail || product.gallery?.[0] || '';

      if (existing) {
        existing.count += 1;
        if (thumbnail && existing.images.length < 4) {
          existing.images.push(thumbnail);
        }
      } else {
        categoriesMap.set(category.slug, {
          title: category.name,
          slug: category.slug,
          count: 1,
          images: thumbnail ? [thumbnail] : [],
        });
      }
    }
  }

  return {
    products: orderedProducts,
    categories: Array.from(categoriesMap.values()),
  };
}
