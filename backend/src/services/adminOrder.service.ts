import mongoose, { isValidObjectId, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import StoreInventory from '../models/storeInventory.model';
import Wallet from '../models/wallet.model';
import WalletTransaction from '../models/walletTransaction.model';
import CouponRedemption from '../models/couponRedemption.model';
import type { ApiError } from '../types/api';
import type {
  AdminOrderListQuery,
  AdminOrderStatusInput,
} from '../validators/adminOrder.validator';

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PLACED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSort(sort: AdminOrderListQuery['sort']): Record<string, SortOrder> {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'grandTotalAsc':
      return { grandTotal: 1 };
    case 'grandTotalDesc':
      return { grandTotal: -1 };
    default:
      return { createdAt: -1 };
  }
}

async function resolveStore(store: string): Promise<string | null> {
  const filter = isValidObjectId(store) ? { _id: store } : { slug: store };
  const result = await Store.findOne({ ...filter, deletedAt: null })
    .select('_id')
    .lean();

  return result?._id.toString() ?? null;
}

export async function getAdminOrders(
  query: AdminOrderListQuery,
  allowedStoreIds?: string[] | null,
) {
  const storeId = query.store ? await resolveStore(query.store) : null;

  if (query.store && !storeId) {
    return {
      items: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    if (storeId && !allowedStoreIds.includes(storeId)) {
      return {
        items: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  const filters: Record<string, unknown> = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(storeId
      ? { store: storeId }
      : allowedStoreIds !== null && allowedStoreIds !== undefined
        ? { store: { $in: allowedStoreIds } }
        : {}),
  };

  if (query.search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(query.search),
      'i',
    );
    const users = await User.find({
      deletedAt: null,
      $or: [
        { firstName: searchExpression },
        { lastName: searchExpression },
        { email: searchExpression },
        { phone: searchExpression },
      ],
    })
      .select('_id')
      .lean();

    filters.$or = [
      { orderNumber: searchExpression },
      { user: { $in: users.map((user) => user._id) } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('user', 'firstName lastName email phone')
      .populate('store', 'name slug city state phone')
      .lean(),
    Order.countDocuments(filters),
  ]);

  return {
    items: orders,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getAdminOrderByOrderNumber(
  orderNumber: string,
  allowedStoreIds?: string[] | null,
) {
  const order = await Order.findOne({ orderNumber })
    .populate('user', 'firstName lastName email phone avatar')
    .populate(
      'store',
      'name slug description logo banner email phone city state country',
    )
    .populate('address')
    .lean();

  if (!order) {
    throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
  }

  const storeId =
    typeof order.store === 'object' && order.store && '_id' in order.store
      ? (order.store as { _id: { toString(): string } })._id.toString()
      : order.store?.toString();

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    (!storeId || !allowedStoreIds.includes(storeId))
  ) {
    throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
  }

  return order;
}

export async function updateAdminOrderStatus(
  orderNumber: string,
  input: AdminOrderStatusInput & { reason?: string; actorId?: string },
  allowedStoreIds?: string[] | null,
) {
  const session = await mongoose.startSession();
  try {
    let updatedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ orderNumber }).session(session);

      if (!order) {
        throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
      }

      const storeId = order.store.toString();

      if (
        allowedStoreIds !== null &&
        allowedStoreIds !== undefined &&
        !allowedStoreIds.includes(storeId)
      ) {
        throw serviceError(
          'Access denied: You do not have permission to update orders for this store.',
          HTTP_STATUS.FORBIDDEN,
        );
      }

      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        throw serviceError(
          'Cannot update status of a completed or cancelled order.',
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (!ORDER_STATUS_TRANSITIONS[order.status]?.includes(input.status)) {
        throw serviceError(
          'Invalid order status transition.',
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const oldStatus = order.status;
      order.status = input.status;

      if (input.status === 'CANCELLED') {
        const cancelReason = input.reason || 'Admin Cancelled';
        order.cancelReason = cancelReason;
        order.cancelledAt = new Date();

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

        if (order.couponCode) {
          await CouponRedemption.updateOne(
            { order: order._id, status: 'REDEEMED' },
            { status: 'CANCELLED', releasedAt: new Date() },
            { session }
          );
        }

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
      }

      if (input.status === 'DELIVERED') {
        order.deliveredAt = new Date();
      }

      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        actor: input.actorId ? new mongoose.Types.ObjectId(input.actorId) : null,
        oldStatus,
        newStatus: input.status,
        reason: input.reason || '',
        timestamp: new Date(),
      });

      await order.save({ session });
      updatedOrder = order;
    });

    return updatedOrder;
  } finally {
    await session.endSession();
  }
}
