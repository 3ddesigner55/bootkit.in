import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import User from '../models/user.model';
import Product from '../models/product.model';
import StoreInventory from '../models/storeInventory.model';
import Rider from '../models/rider.model';
import { getAdminDashboardMetrics } from '../services/adminDashboard.service';

export const adminDashboardRoutes = Router();

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDateRange(rangeType: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

  // Helper to construct UTC date corresponding to start of IST day
  const getStartOfISTDay = (d: Date) => {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - IST_OFFSET_MS);
  };

  const startOfToday = getStartOfISTDay(nowIST);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  if (rangeType === 'yesterday') {
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = startOfToday;
    const startOfPrevDay = new Date(startOfYesterday.getTime() - 24 * 60 * 60 * 1000);
    return {
      start: startOfYesterday,
      end: endOfYesterday,
      prevStart: startOfPrevDay,
      prevEnd: startOfYesterday,
    };
  }

  if (rangeType === 'last_7_days') {
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOf14DaysAgo = new Date(startOf7DaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start: startOf7DaysAgo,
      end: endOfToday,
      prevStart: startOf14DaysAgo,
      prevEnd: startOf7DaysAgo,
    };
  }

  // Default: 'today'
  // For 'today', compare against same elapsed period yesterday
  const elapsedMs = now.getTime() - startOfToday.getTime();
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const elapsedYesterdayEnd = new Date(startOfYesterday.getTime() + elapsedMs);

  return {
    start: startOfToday,
    end: now,
    prevStart: startOfYesterday,
    prevEnd: elapsedYesterdayEnd,
  };
}

// Return legacy metrics for dashboard component
adminDashboardRoutes.get(
  '/',
  authenticate,
  requireStoreScope,
  asyncHandler(async (req: Request, res: Response) => {
    const allowedStoreIds = res.locals.allowedStoreIds as string[] | null | undefined;
    const metrics = await getAdminDashboardMetrics(allowedStoreIds);
    res.status(HTTP_STATUS.OK).json({ success: true, data: metrics });
  }),
);

adminDashboardRoutes.get(
  '/overview',
  authenticate,
  requireStoreScope,
  asyncHandler(async (req: Request, res: Response) => {
    const range = (req.query.range as string) || 'today';
    const hubId = req.query.hubId as string;
    const allowedStoreIds = res.locals.allowedStoreIds as string[] | null | undefined;

    // Resolve query store filter
    const storeFilters: any = {};
    if (hubId && hubId !== 'all') {
      storeFilters.store = new mongoose.Types.ObjectId(hubId);
    } else if (allowedStoreIds) {
      storeFilters.store = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const { start, end, prevStart, prevEnd } = getISTDateRange(range);

    // Current period metrics query
    const currentOrders = await Order.find({
      ...storeFilters,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // Previous period metrics query (for growth comparison)
    const prevOrders = await Order.find({
      ...storeFilters,
      createdAt: { $gte: prevStart, $lte: prevEnd },
    }).lean();

    // Aggregate values helper
    const getStats = (ordersList: any[]) => {
      const total = ordersList.length;
      const gmv = ordersList
        .filter(o => o.status !== 'CANCELLED' && o.status !== 'FAILED')
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const aov = total > 0 ? Math.round(gmv / total) : 0;
      return { total, gmv, aov };
    };

    const currentStats = getStats(currentOrders);
    const prevStats = getStats(prevOrders);

    // Calculate percentage change
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const orderGrowth = calcGrowth(currentStats.total, prevStats.total);
    const gmvGrowth = calcGrowth(currentStats.gmv, prevStats.gmv);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          hubId: hubId || 'all',
          range,
          timezone: 'Asia/Kolkata',
        },
        metrics: {
          totalOrders: currentStats.total,
          orderGrowthPercent: orderGrowth,
          gmv: currentStats.gmv,
          gmvGrowthPercent: gmvGrowth,
          aov: currentStats.aov,
          activeUsers: null,
        },
        capabilities: {
          activeUsersAvailable: false,
          riderMetricsAvailable: true,
          paymentReconciliationAvailable: false,
          supportTicketsAvailable: false,
        },
      },
    });
  }),
);

adminDashboardRoutes.get(
  '/live-operations',
  authenticate,
  requireStoreScope,
  asyncHandler(async (req: Request, res: Response) => {
    const hubId = req.query.hubId as string;
    const allowedStoreIds = res.locals.allowedStoreIds as string[] | null | undefined;

    const storeFilters: any = {};
    if (hubId && hubId !== 'all') {
      storeFilters.store = new mongoose.Types.ObjectId(hubId);
    } else if (allowedStoreIds) {
      storeFilters.store = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // 1. Kanban pipeline query
    const activeOrders = await Order.find({
      ...storeFilters,
      status: { $in: ['PLACED', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    }).lean();

    const kanban = {
      newOrders: activeOrders.filter(o => o.status === 'PLACED'),
      packing: activeOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PACKING'),
      ready: activeOrders.filter(o => o.status === 'READY_FOR_PICKUP'), // maps to READY_FOR_PICKUP if any exists
      transit: activeOrders.filter(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'ASSIGNED' || o.status === 'PICKED_UP'),
      deliveredLastHour: activeOrders.filter(
        o => o.status === 'DELIVERED' && o.deliveredAt && new Date().getTime() - new Date(o.deliveredAt).getTime() <= 60 * 60 * 1000,
      ),
    };

    // 2. Rider metrics availability
    const riderFilter: any = {};
    if (hubId && hubId !== 'all') {
      riderFilter.assignedStore = new mongoose.Types.ObjectId(hubId);
    } else if (allowedStoreIds) {
      riderFilter.assignedStore = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const riders = await Rider.find(riderFilter).lean();
    const riderStats = {
      active: riders.length,
      available: riders.filter(r => r.availabilityStatus === 'AVAILABLE').length,
      onTrip: riders.filter(r => r.availabilityStatus === 'ON_DELIVERY' || r.availabilityStatus === 'ASSIGNED').length,
      offline: riders.filter(r => r.availabilityStatus === 'OFFLINE').length,
      stale: riders.filter(r => r.availabilityStatus === 'STALE').length,
    };

    // 3. Inventory Stock Alerts
    const inventoryFilter: any = { deletedAt: null };
    if (hubId && hubId !== 'all') {
      inventoryFilter.store = new mongoose.Types.ObjectId(hubId);
    } else if (allowedStoreIds) {
      inventoryFilter.store = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const stockItems = await StoreInventory.find(inventoryFilter).populate('product').lean();

    const outOfStock = stockItems
      .filter(item => (item.stock - (item.reservedStock || 0)) <= 0)
      .map(item => ({
        id: item._id,
        productName: (item.product as any)?.name || 'Unknown',
        sku: (item.product as any)?.sku || '',
        thumbnail: (item.product as any)?.thumbnail || '',
        stock: item.stock,
      }));

    const lowStock = stockItems
      .filter(item => {
        const avail = item.stock - (item.reservedStock || 0);
        return avail > 0 && avail <= 10;
      })
      .map(item => ({
        id: item._id,
        productName: (item.product as any)?.name || 'Unknown',
        sku: (item.product as any)?.sku || '',
        thumbnail: (item.product as any)?.thumbnail || '',
        stock: item.stock,
      }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        kanban,
        riders: riderStats,
        alerts: {
          outOfStock,
          lowStock,
        },
      },
    });
  }),
);

adminDashboardRoutes.get(
  '/actions',
  authenticate,
  requireStoreScope,
  asyncHandler(async (req: Request, res: Response) => {
    const hubId = req.query.hubId as string;
    const allowedStoreIds = res.locals.allowedStoreIds as string[] | null | undefined;

    const storeFilters: any = {};
    if (hubId && hubId !== 'all') {
      storeFilters.store = new mongoose.Types.ObjectId(hubId);
    } else if (allowedStoreIds) {
      storeFilters.store = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // 15-minute SLA timer filter for active uncompleted orders
    const slaLimitTime = new Date(Date.now() - 15 * 60 * 1000);
    const delayedOrders = await Order.find({
      ...storeFilters,
      status: { $in: ['PLACED', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY'] },
      createdAt: { $lt: slaLimitTime },
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        delayedOrders,
        paymentFailures: [],
        supportTickets: [],
      },
    });
  }),
);

adminDashboardRoutes.get(
  '/search',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    if (query.trim().length < 2) {
      res.status(HTTP_STATUS.OK).json({ success: true, data: { orders: [], customers: [], products: [] } });
      return;
    }

    const regex = new RegExp(query.trim(), 'i');

    const [orders, customers, products] = await Promise.all([
      // Search Orders by orderNumber
      Order.find({ orderNumber: regex }).limit(10).lean(),
      // Search Customers by phone or name
      User.find({
        role: 'CUSTOMER',
        $or: [{ phone: regex }, { firstName: regex }, { lastName: regex }],
      })
        .limit(10)
        .lean(),
      // Search Products by SKU or name
      Product.find({
        $or: [{ sku: regex }, { name: regex }],
      })
        .limit(10)
        .lean(),
    ]);

    // Mask phone numbers for customer results to preserve privacy
    const maskedCustomers = customers.map(c => ({
      ...c,
      phone: c.phone ? c.phone.slice(0, 4) + '******' + c.phone.slice(-4) : '',
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        orders,
        customers: maskedCustomers,
        products,
      },
    });
  }),
);
