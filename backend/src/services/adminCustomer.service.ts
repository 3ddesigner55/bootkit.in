import { isValidObjectId, Types, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Address from '../models/address.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AdminCustomerListQuery,
  AdminCustomerOrdersQuery,
  AdminCustomerStatusInput,
} from '../validators/adminCustomer.validator';

type CustomerSummary = {
  orderCount: number;
  totalSpend: number;
  latestOrderDate: Date | null;
};

type CustomerListItem = CustomerSummary & {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CustomerDetail = CustomerListItem;

type CustomerOrdersSummary = CustomerSummary & {
  totalOrders: number;
};

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateCustomerId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw serviceError('Customer not found.', HTTP_STATUS.NOT_FOUND);
  }

  return new Types.ObjectId(id);
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCustomerSort(
  sort: AdminCustomerListQuery['sort'],
): Record<string, 1 | -1> {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'nameAsc':
      return { firstName: 1, lastName: 1 };
    case 'nameDesc':
      return { firstName: -1, lastName: -1 };
    case 'ordersDesc':
      return { orderCount: -1, createdAt: -1 };
    case 'totalSpendDesc':
      return { totalSpend: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
}

function getOrderSort(
  sort: AdminCustomerOrdersQuery['sort'],
): Record<string, SortOrder> {
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

function customerMatch(
  query?: AdminCustomerListQuery,
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    role: 'CUSTOMER',
    deletedAt: null,
  };

  if (query?.status) {
    match.isActive = query.status === 'Active';
  }

  if (query?.search) {
    const expression = new RegExp(escapeRegularExpression(query.search), 'i');
    match.$or = [
      { firstName: expression },
      { lastName: expression },
      { email: expression },
      { phone: expression },
    ];
  }

  return match;
}

function customerSummaryLookup() {
  return {
    $lookup: {
      from: Order.collection.name,
      let: { customerId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$user', '$$customerId'] } } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpend: {
              $sum: {
                $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$grandTotal', 0],
              },
            },
            latestOrderDate: { $max: '$createdAt' },
          },
        },
      ],
      as: 'orderSummary',
    },
  };
}

function customerProjection() {
  return {
    $project: {
      firstName: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      avatar: 1,
      isActive: 1,
      isVerified: 1,
      createdAt: 1,
      updatedAt: 1,
      orderCount: { $ifNull: ['$orderSummary.orderCount', 0] },
      totalSpend: { $ifNull: ['$orderSummary.totalSpend', 0] },
      latestOrderDate: { $ifNull: ['$orderSummary.latestOrderDate', null] },
    },
  };
}

function serializeCustomer(customer: CustomerListItem) {
  return {
    id: customer._id.toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    avatar: customer.avatar,
    isActive: customer.isActive,
    status: customer.isActive ? 'Active' : 'Blocked',
    isVerified: customer.isVerified,
    registeredAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    orderCount: customer.orderCount,
    totalSpend: customer.totalSpend,
    latestOrderDate: customer.latestOrderDate,
  };
}

async function ensureCustomerExists(id: string): Promise<Types.ObjectId> {
  const customerId = validateCustomerId(id);
  const customer = await User.exists({
    _id: customerId,
    role: 'CUSTOMER',
    deletedAt: null,
  });

  if (!customer) {
    throw serviceError('Customer not found.', HTTP_STATUS.NOT_FOUND);
  }

  return customerId;
}

export async function getAdminCustomers(query: AdminCustomerListQuery) {
  const [result] = await User.aggregate<{
    items: CustomerListItem[];
    metadata: Array<{ total: number }>;
  }>([
    { $match: customerMatch(query) },
    customerSummaryLookup(),
    { $unwind: { path: '$orderSummary', preserveNullAndEmptyArrays: true } },
    customerProjection(),
    {
      $facet: {
        items: [
          { $sort: getCustomerSort(query.sort) },
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
        ],
        metadata: [{ $count: 'total' }],
      },
    },
  ]);

  const total = result?.metadata[0]?.total ?? 0;

  return {
    items: (result?.items ?? []).map(serializeCustomer),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getAdminCustomerById(id: string) {
  const customerId = validateCustomerId(id);
  const [customer] = await User.aggregate<CustomerDetail>([
    { $match: { _id: customerId, role: 'CUSTOMER', deletedAt: null } },
    customerSummaryLookup(),
    { $unwind: { path: '$orderSummary', preserveNullAndEmptyArrays: true } },
    customerProjection(),
  ]);

  if (!customer) {
    throw serviceError('Customer not found.', HTTP_STATUS.NOT_FOUND);
  }

  return serializeCustomer(customer);
}

export async function getAdminCustomerAddresses(id: string) {
  const customerId = await ensureCustomerExists(id);

  return Address.find({ user: customerId, deletedAt: null })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
}

export async function getAdminCustomerOrders(
  id: string,
  query: AdminCustomerOrdersQuery,
) {
  const customerId = await ensureCustomerExists(id);
  const filters = { user: customerId };
  const [items, total, summary] = await Promise.all([
    Order.find(filters)
      .select(
        'orderNumber store address items subtotal discount deliveryCharge tax grandTotal couponCode couponDiscount paymentMethod paymentStatus status estimatedDeliveryTime deliveredAt cancelReason cancelledAt createdAt updatedAt',
      )
      .sort(getOrderSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('store', 'name slug logo city state phone')
      .populate('address')
      .lean(),
    Order.countDocuments(filters),
    Order.aggregate<CustomerOrdersSummary>([
      { $match: filters },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalOrders: { $sum: 1 },
          totalSpend: {
            $sum: {
              $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$grandTotal', 0],
            },
          },
          latestOrderDate: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          orderCount: 1,
          totalOrders: 1,
          totalSpend: 1,
          latestOrderDate: 1,
        },
      },
    ]),
  ]);

  return {
    items,
    summary: summary[0] ?? {
      orderCount: 0,
      totalOrders: 0,
      totalSpend: 0,
      latestOrderDate: null,
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function updateAdminCustomerStatus(
  id: string,
  input: AdminCustomerStatusInput,
) {
  const customerId = validateCustomerId(id);
  const customer = await User.findOneAndUpdate(
    { _id: customerId, role: 'CUSTOMER', deletedAt: null },
    { isActive: input.status === 'Active' },
    {
      new: true,
      projection:
        'firstName lastName email phone avatar isActive isVerified createdAt updatedAt',
    },
  ).lean();

  if (!customer) {
    throw serviceError('Customer not found.', HTTP_STATUS.NOT_FOUND);
  }

  return {
    id: customer._id.toString(),
    isActive: customer.isActive,
    status: customer.isActive ? 'Active' : 'Blocked',
  };
}
