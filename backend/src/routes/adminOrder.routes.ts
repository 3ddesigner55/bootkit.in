import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import Rider from '../models/rider.model';
import ReturnRequest from '../models/returnRequest.model';
import Refund from '../models/refund.model';
import StoreInventory from '../models/storeInventory.model';
import CatalogAudit from '../models/catalogAudit.model';
import {
  getAdminOrderController,
  getAdminOrdersController,
  updateAdminOrderStatusController,
} from '../controllers/adminOrder.controller';
import {
  validateAdminOrderListQueryRequest,
  validateAdminOrderStatusRequest,
} from '../validators/adminOrder.validator';

export const adminOrderRoutes = Router();

adminOrderRoutes.use(authenticate, requireStoreScope);

// Keep existing mounted paths
adminOrderRoutes.get('/', validateAdminOrderListQueryRequest, asyncHandler(getAdminOrdersController));
adminOrderRoutes.get('/live', asyncHandler(async (req: Request, res: Response) => {
  const allowedStoreIds = res.locals.allowedStoreIds as string[] | null | undefined;
  const filter: any = {
    status: { $in: ['PLACED', 'CONFIRMED', 'PACKING', 'READY_FOR_PICKUP'] },
  };
  if (allowedStoreIds) {
    filter.store = { $in: allowedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.status(HTTP_STATUS.OK).json({ success: true, orders });
}));

adminOrderRoutes.get('/:orderNumber', asyncHandler(getAdminOrderController));
adminOrderRoutes.patch('/:orderNumber/status', validateAdminOrderStatusRequest, asyncHandler(updateAdminOrderStatusController));

adminOrderRoutes.get('/:orderNumber/history', asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Order not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, history: order.statusHistory || [] });
}));

// Rider Assignment Endpoint
adminOrderRoutes.post('/:orderNumber/assign-rider', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.body;
  if (!riderId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'riderId is required.' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let resultOrder;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ orderNumber: req.params.orderNumber }).session(session);
      if (!order) {
        throw new Error('Order not found.');
      }

      const rider = await Rider.findById(riderId).session(session);
      if (!rider || rider.deletedAt) {
        throw new Error('Rider not found.');
      }

      if (rider.onboardingStatus !== 'APPROVED') {
        throw new Error('Rider is not approved.');
      }

      if (rider.availabilityStatus !== 'AVAILABLE') {
        throw new Error('Rider is currently busy or offline.');
      }

      if (rider.assignedStore.toString() !== order.store.toString()) {
        throw new Error('Cross-store rider assignment is rejected.');
      }

      const oldStatus = order.status;
      order.rider = rider._id;
      order.status = 'ASSIGNED';

      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        actor: new mongoose.Types.ObjectId(req.user!.id),
        oldStatus,
        newStatus: 'ASSIGNED',
        reason: 'Rider Assigned',
        timestamp: new Date(),
      });

      await order.save({ session });

      rider.availabilityStatus = 'ASSIGNED';
      await rider.save({ session });

      // Audit Log
      await CatalogAudit.create([{
        actor: req.user!.id,
        role: req.user!.role,
        action: 'RIDER_ASSIGNED',
        entityType: 'ORDER',
        entityId: order._id,
        afterValue: { riderId: rider._id },
        timestamp: new Date(),
      }], { session });

      resultOrder = order;
    });

    res.status(HTTP_STATUS.OK).json({ success: true, order: resultOrder });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

// Returns management
adminOrderRoutes.get('/returns', asyncHandler(async (req: Request, res: Response) => {
  const returns = await ReturnRequest.find()
    .populate('order', 'orderNumber')
    .populate('customer', 'firstName lastName phone')
    .lean();
  res.status(HTTP_STATUS.OK).json({ success: true, returns });
}));

adminOrderRoutes.post('/:orderNumber/returns', asyncHandler(async (req: Request, res: Response) => {
  const { items, reason, description } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Return items are required.' });
    return;
  }

  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Order not found.' });
    return;
  }

  if (order.status !== 'DELIVERED') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Only delivered orders can be returned.' });
    return;
  }

  // Validate item quantities do not exceed ordered quantities
  for (const item of items) {
    const orderedItem = order.items.find((i: any) => i.product.toString() === item.product);
    if (!orderedItem) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Item does not exist in order.' });
      return;
    }
    if (item.quantity > orderedItem.quantity) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Return quantity exceeds ordered quantity.' });
      return;
    }
  }

  const returnReq = await ReturnRequest.create({
    order: order._id,
    customer: order.user,
    store: order.store,
    items,
    reason,
    description,
    status: 'REQUESTED',
    createdBy: req.user!.id,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, returnRequest: returnReq });
}));

adminOrderRoutes.patch('/returns/:returnId/status', asyncHandler(async (req: Request, res: Response) => {
  const { status, resolution } = req.body;

  const session = await mongoose.startSession();
  try {
    let updatedReturn;
    await session.withTransaction(async () => {
      const returnReq = await ReturnRequest.findById(req.params.returnId).session(session);
      if (!returnReq) {
        throw new Error('Return request not found.');
      }

      const oldStatus = returnReq.status;
      returnReq.status = status;
      returnReq.resolution = resolution || '';
      returnReq.resolvedAt = new Date();
      returnReq.resolvedBy = new mongoose.Types.ObjectId(req.user!.id);

      if (status === 'APPROVED') {
        for (const item of returnReq.items) {
          if (item.disposition === 'RESTOCK') {
            await StoreInventory.updateOne(
              { store: returnReq.store, product: item.product },
              { $inc: { stock: item.quantity } },
              { session },
            );

            // Audit inventory adjustment
            await CatalogAudit.create([{
              actor: req.user!.id,
              role: req.user!.role,
              action: 'INVENTORY_RESTOCKED_RETURN',
              entityType: 'STORE_INVENTORY',
              entityId: returnReq.store,
              reason: 'Restock from approved return request',
              timestamp: new Date(),
            }], { session });
          }
        }
      }

      await returnReq.save({ session });
      updatedReturn = returnReq;
    });

    res.status(HTTP_STATUS.OK).json({ success: true, returnRequest: updatedReturn });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

// Refunds management
adminOrderRoutes.get('/refunds', asyncHandler(async (req: Request, res: Response) => {
  const refunds = await Refund.find().populate('order', 'orderNumber').lean();
  res.status(HTTP_STATUS.OK).json({ success: true, refunds });
}));

adminOrderRoutes.post('/:orderNumber/refunds', asyncHandler(async (req: Request, res: Response) => {
  const { amount, reason, returnRequestId } = req.body;
  if (!amount || amount <= 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Refund amount must be positive.' });
    return;
  }

  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Order not found.' });
    return;
  }

  // Prevent cumulative refunds from exceeding paid amount
  const cumulativeRefunds = await Refund.aggregate([
    { $match: { order: order._id, status: 'SUCCEEDED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRefunded = cumulativeRefunds[0]?.total || 0;
  if (totalRefunded + amount > order.grandTotal) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Total refunds cannot exceed the paid order amount.' });
    return;
  }

  const refund = await Refund.create({
    order: order._id,
    returnRequest: returnRequestId ? new mongoose.Types.ObjectId(returnRequestId) : null,
    amount,
    type: amount === order.grandTotal ? 'FULL' : 'PARTIAL',
    idempotencyKey: `refund-${order.orderNumber}-${Date.now()}`,
    status: 'SUCCEEDED', // default succeeded in test mode
    reason,
    initiatedBy: req.user!.id,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, refund });
}));

adminOrderRoutes.get('/refunds/:refundId', asyncHandler(async (req: Request, res: Response) => {
  const refund = await Refund.findById(req.params.refundId).populate('order', 'orderNumber').lean();
  if (!refund) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Refund not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, refund });
}));

// Replacement Order Placement
adminOrderRoutes.post('/:orderNumber/replacement', asyncHandler(async (req: Request, res: Response) => {
  const { reason, items } = req.body;

  const originalOrder = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!originalOrder) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Original order not found.' });
    return;
  }

  const prefix = `REP-${originalOrder.orderNumber}-`;
  const count = await Order.countDocuments({ orderNumber: new RegExp(`^${prefix}`) });
  const replacementOrderNumber = `${prefix}${count + 1}`;

  const replacementOrder = await Order.create({
    orderNumber: replacementOrderNumber,
    user: originalOrder.user,
    store: originalOrder.store,
    address: originalOrder.address,
    items: items || originalOrder.items,
    subtotal: 0,
    discount: 0,
    deliveryCharge: 0,
    tax: 0,
    grandTotal: 0,
    couponCode: '',
    couponDiscount: 0,
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    status: 'CONFIRMED',
    cancelReason: '',
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, replacementOrder });
}));
