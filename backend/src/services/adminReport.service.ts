import { isValidObjectId, Types } from 'mongoose';

import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import type { AdminReportQuery } from '../validators/adminReport.validator';

type ReportMatch = Record<string, unknown>;

type ReportContext = {
  orderMatch: ReportMatch;
  productIds?: Types.ObjectId[];
};

async function resolveStore(store: string): Promise<string | null> {
  const filter = isValidObjectId(store) ? { _id: store } : { slug: store };
  const result = await Store.findOne({ ...filter, deletedAt: null })
    .select('_id')
    .lean();

  return result?._id.toString() ?? null;
}

async function getProductIds(
  query: AdminReportQuery,
): Promise<Types.ObjectId[] | undefined> {
  if (!query.brand && !query.category) {
    return undefined;
  }

  const products = await Product.find({
    ...(query.brand ? { brand: new Types.ObjectId(query.brand) } : {}),
    ...(query.category ? { category: new Types.ObjectId(query.category) } : {}),
  })
    .select('_id')
    .lean();

  return products.map((product) => product._id);
}

async function getReportContext(
  query: AdminReportQuery,
  options: { includeCancelled?: boolean } = {},
  allowedStoreIds?: string[] | null,
): Promise<ReportContext | null> {
  const storeId = query.store ? await resolveStore(query.store) : null;

  if (query.store && !storeId) {
    return null;
  }

  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    if (storeId && !allowedStoreIds.includes(storeId)) {
      return null;
    }
  }

  const createdAt = {
    ...(query.from ? { $gte: query.from } : {}),
    ...(query.to ? { $lte: query.to } : {}),
  };

  const productIds = await getProductIds(query);

  if (productIds && productIds.length === 0) {
    return null;
  }

  return {
    orderMatch: {
      ...(!options.includeCancelled ? { status: { $ne: 'CANCELLED' } } : {}),
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      ...(storeId
        ? { store: storeId }
        : allowedStoreIds !== null && allowedStoreIds !== undefined
          ? {
              store: {
                $in: allowedStoreIds.map((id) => new Types.ObjectId(id)),
              },
            }
          : {}),
      ...(productIds ? { 'items.product': { $in: productIds } } : {}),
    },
    ...(productIds ? { productIds } : {}),
  };
}

function getProductItemMatch(context: ReportContext) {
  return context.productIds
    ? [{ $match: { 'items.product': { $in: context.productIds } } }]
    : [];
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

export async function getSalesReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  if (context.productIds) {
    return Order.aggregate([
      { $match: context.orderMatch },
      { $unwind: '$items' },
      ...getProductItemMatch(context),
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                date: '$createdAt',
                format: getDateFormat(query.groupBy),
                timezone: 'Asia/Kolkata',
              },
            },
            order: '$_id',
          },
          revenue: { $sum: '$items.total' },
        },
      },
      {
        $group: {
          _id: '$_id.period',
          orders: { $sum: 1 },
          revenue: { $sum: '$revenue' },
        },
      },
      { $project: { _id: 0, period: '$_id', orders: 1, revenue: 1 } },
      { $sort: { period: 1 } },
    ]);
  }

  return Order.aggregate([
    { $match: context.orderMatch },
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

export async function getTopProductsReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
    { $unwind: '$items' },
    ...getProductItemMatch(context),
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

export async function getTopCategoriesReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
    { $unwind: '$items' },
    ...getProductItemMatch(context),
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

export async function getStoresReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
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

export async function getCustomersReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
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

export async function getTopBrandsReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
    { $unwind: '$items' },
    ...getProductItemMatch(context),
    {
      $lookup: {
        from: Product.collection.name,
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.brand': { $ne: null } } },
    {
      $group: {
        _id: '$product.brand',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      },
    },
    {
      $lookup: {
        from: Brand.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'brand',
      },
    },
    { $unwind: '$brand' },
    {
      $project: {
        _id: 0,
        brandId: '$_id',
        name: '$brand.name',
        slug: '$brand.slug',
        logo: '$brand.logo',
        quantity: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1, quantity: -1 } },
    { $limit: 10 },
  ]);
}

export async function getCustomerGrowthReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    // For a seller, customer growth should only count customers who ordered from their store(s)
    const context = await getReportContext(query, {}, allowedStoreIds);
    if (!context) return [];

    return Order.aggregate([
      { $match: context.orderMatch },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                date: '$createdAt',
                format: getDateFormat(query.groupBy),
                timezone: 'Asia/Kolkata',
              },
            },
            user: '$user',
          },
        },
      },
      {
        $group: {
          _id: '$_id.period',
          customers: { $sum: 1 },
        },
      },
      { $project: { _id: 0, period: '$_id', customers: 1 } },
      { $sort: { period: 1 } },
    ]);
  }

  const createdAt = {
    ...(query.from ? { $gte: query.from } : {}),
    ...(query.to ? { $lte: query.to } : {}),
  };

  return User.aggregate([
    {
      $match: {
        role: 'CUSTOMER',
        deletedAt: null,
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: getDateFormat(query.groupBy),
            timezone: 'Asia/Kolkata',
          },
        },
        customers: { $sum: 1 },
      },
    },
    { $project: { _id: 0, period: '$_id', customers: 1 } },
    { $sort: { period: 1 } },
  ]);
}

export async function getPaymentMethodsReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(query, {}, allowedStoreIds);

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
    {
      $group: {
        _id: '$paymentMethod',
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    { $project: { _id: 0, paymentMethod: '$_id', orders: 1, revenue: 1 } },
    { $sort: { revenue: -1, orders: -1 } },
  ]);
}

export async function getOrderStatusesReport(
  query: AdminReportQuery,
  allowedStoreIds?: string[] | null,
) {
  const context = await getReportContext(
    query,
    { includeCancelled: true },
    allowedStoreIds,
  );

  if (!context) {
    return [];
  }

  return Order.aggregate([
    { $match: context.orderMatch },
    {
      $group: {
        _id: '$status',
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    { $project: { _id: 0, status: '$_id', orders: 1, revenue: 1 } },
    { $sort: { orders: -1, revenue: -1 } },
  ]);
}
