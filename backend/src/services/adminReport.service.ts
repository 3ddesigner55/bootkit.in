import { isValidObjectId } from 'mongoose';

import Category from '../models/category.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import type { AdminReportQuery } from '../validators/adminReport.validator';

type ReportMatch = Record<string, unknown>;

async function resolveStore(store: string): Promise<string | null> {
  const filter = isValidObjectId(store) ? { _id: store } : { slug: store };
  const result = await Store.findOne({ ...filter, deletedAt: null })
    .select('_id')
    .lean();

  return result?._id.toString() ?? null;
}

async function getOrderMatch(
  query: AdminReportQuery,
): Promise<ReportMatch | null> {
  const storeId = query.store ? await resolveStore(query.store) : null;

  if (query.store && !storeId) {
    return null;
  }

  const createdAt = {
    ...(query.from ? { $gte: query.from } : {}),
    ...(query.to ? { $lte: query.to } : {}),
  };

  return {
    status: { $ne: 'CANCELLED' },
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(storeId ? { store: storeId } : {}),
  };
}

function getDateFormat(groupBy: AdminReportQuery['groupBy']): string {
  switch (groupBy) {
    case 'week':
      return '%G-W%V';
    case 'month':
      return '%Y-%m';
    default:
      return '%Y-%m-%d';
  }
}

export async function getSalesReport(query: AdminReportQuery) {
  const match = await getOrderMatch(query);

  if (!match) {
    return [];
  }

  return Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: getDateFormat(query.groupBy),
            timezone: 'Asia/Kolkata',
          },
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    { $project: { _id: 0, period: '$_id', orders: 1, revenue: 1 } },
    { $sort: { period: 1 } },
  ]);
}

export async function getTopProductsReport(query: AdminReportQuery) {
  const match = await getOrderMatch(query);

  if (!match) {
    return [];
  }

  return Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        thumbnail: { $first: '$items.thumbnail' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      },
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        thumbnail: 1,
        quantity: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1, quantity: -1 } },
    { $limit: 10 },
  ]);
}

export async function getTopCategoriesReport(query: AdminReportQuery) {
  const match = await getOrderMatch(query);

  if (!match) {
    return [];
  }

  return Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $lookup: {
        from: Product.collection.name,
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      },
    },
    {
      $lookup: {
        from: Category.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: '$category.name',
        slug: '$category.slug',
        quantity: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1, quantity: -1 } },
    { $limit: 10 },
  ]);
}

export async function getStoresReport(query: AdminReportQuery) {
  const match = await getOrderMatch(query);

  if (!match) {
    return [];
  }

  return Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$store',
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    {
      $lookup: {
        from: Store.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'store',
      },
    },
    { $unwind: '$store' },
    {
      $project: {
        _id: 0,
        storeId: '$_id',
        name: '$store.name',
        slug: '$store.slug',
        city: '$store.city',
        orders: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1, orders: -1 } },
  ]);
}

export async function getCustomersReport(query: AdminReportQuery) {
  const match = await getOrderMatch(query);

  if (!match) {
    return [];
  }

  return Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$user',
        orders: { $sum: 1 },
        totalSpend: { $sum: '$grandTotal' },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
        phone: '$user.phone',
        orders: 1,
        totalSpend: 1,
      },
    },
    { $sort: { totalSpend: -1, orders: -1 } },
    { $limit: 10 },
  ]);
}
