import Order from '../models/order.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import User from '../models/user.model';

const INDIA_UTC_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const indiaNow = new Date(now.getTime() + INDIA_UTC_OFFSET_MS);
  const start = new Date(
    Date.UTC(
      indiaNow.getUTCFullYear(),
      indiaNow.getUTCMonth(),
      indiaNow.getUTCDate(),
    ) - INDIA_UTC_OFFSET_MS,
  );

  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  };
}

export async function getAdminDashboardMetrics() {
  const { start, end } = getTodayRange();
  const [orderMetrics, userMetrics, productMetrics, storeMetrics] =
    await Promise.all([
      Order.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ['$status', 'CANCELLED'] },
                        0,
                        '$grandTotal',
                      ],
                    },
                  },
                },
              },
            ],
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            today: [
              { $match: { createdAt: { $gte: start, $lt: end } } },
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  sales: {
                    $sum: {
                      $cond: [
                        { $eq: ['$status', 'CANCELLED'] },
                        0,
                        '$grandTotal',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]),
      User.aggregate([
        { $match: { role: 'CUSTOMER', deletedAt: null } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            today: [
              { $match: { createdAt: { $gte: start, $lt: end } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      Product.aggregate([{ $match: { deletedAt: null } }, { $count: 'count' }]),
      Store.aggregate([{ $match: { deletedAt: null } }, { $count: 'count' }]),
    ]);

  const orderSummary = orderMetrics[0];
  const totals = orderSummary?.totals[0] ?? { totalOrders: 0, totalRevenue: 0 };
  const statusCounts = new Map<string, number>(
    (orderSummary?.statusCounts ?? []).map(
      (entry: { _id: string; count: number }) => [entry._id, entry.count],
    ),
  );
  const today = orderSummary?.today[0] ?? { orders: 0, sales: 0 };

  return {
    totalOrders: totals.totalOrders,
    totalRevenue: totals.totalRevenue,
    totalCustomers: userMetrics[0]?.total[0]?.count ?? 0,
    totalProducts: productMetrics[0]?.count ?? 0,
    totalStores: storeMetrics[0]?.count ?? 0,
    pendingOrders:
      (statusCounts.get('PENDING') ?? 0) +
      (statusCounts.get('PLACED') ?? 0) +
      (statusCounts.get('CONFIRMED') ?? 0) +
      (statusCounts.get('PACKING') ?? 0) +
      (statusCounts.get('OUT_FOR_DELIVERY') ?? 0),
    completedOrders: statusCounts.get('DELIVERED') ?? 0,
    cancelledOrders: statusCounts.get('CANCELLED') ?? 0,
    todaysOrders: today.orders,
    todaysSales: today.sales,
    todaysNewCustomers: userMetrics[0]?.today[0]?.count ?? 0,
  };
}
