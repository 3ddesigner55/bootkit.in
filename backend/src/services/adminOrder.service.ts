import { isValidObjectId, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AdminOrderListQuery,
  AdminOrderStatusInput,
} from '../validators/adminOrder.validator';

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PLACED'],
  PLACED: ['CONFIRMED'],
  CONFIRMED: ['PACKING'],
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

export async function getAdminOrders(query: AdminOrderListQuery) {
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

  const filters: Record<string, unknown> = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(storeId ? { store: storeId } : {}),
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

export async function getAdminOrderByOrderNumber(orderNumber: string) {
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

  return order;
}

export async function updateAdminOrderStatus(
  orderNumber: string,
  input: AdminOrderStatusInput,
) {
  const order = await Order.findOne({ orderNumber });

  if (!order) {
    throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (!ORDER_STATUS_TRANSITIONS[order.status]?.includes(input.status)) {
    throw serviceError(
      'Invalid order status transition.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  order.status = input.status;

  if (input.status === 'DELIVERED') {
    order.deliveredAt = new Date();
  }

  await order.save();

  return order;
}
