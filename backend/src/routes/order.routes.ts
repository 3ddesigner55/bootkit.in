import { Router } from 'express';

import {
  cancelOrderController,
  confirmCodOrderController,
  getMyOrdersController,
  getOrderAgainController,
  placeOrderController,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateCancelOrderRequest,
  validateConfirmCodRequest,
  validateMyOrdersRequest,
  validatePlaceOrderRequest,
} from '../validators/order.validator';

import mongoose from 'mongoose';
import Store from '../models/store.model';
import Order from '../models/order.model';

export const orderRoutes = Router();

orderRoutes.get(
  '/my-orders',
  authenticate,
  validateMyOrdersRequest,
  asyncHandler(getMyOrdersController),
);
orderRoutes.get(
  '/order-again',
  authenticate,
  asyncHandler(getOrderAgainController),
);
orderRoutes.post(
  '/direct',
  authenticate,
  asyncHandler(async (req, res) => {
    const { order } = req.body;
    const userId = req.user!.id;

    if (!order) {
      res.status(400).json({ message: 'Order data is required.' });
      return;
    }

    let storeId = order.storeId;
    if (!storeId || !mongoose.isValidObjectId(storeId)) {
      const activeStore = await Store.findOne({ active: true });
      storeId = activeStore?._id;
    }

    let addressId = order.addressId || order.address?.id || order.address?._id;
    if (!addressId || !mongoose.isValidObjectId(addressId)) {
      addressId = new mongoose.Types.ObjectId();
    }

    const dbItems = order.items.map((item: any) => ({
      product: new mongoose.Types.ObjectId(item.product.id),
      name: item.product.name,
      thumbnail: item.product.image || '',
      quantity: item.quantity,
      mrp: item.product.mrp || item.product.price,
      sellingPrice: item.product.price,
      total: item.product.price * item.quantity,
    }));

    const newOrder = await Order.create({
      orderNumber: order.orderNumber,
      user: new mongoose.Types.ObjectId(userId),
      store: new mongoose.Types.ObjectId(storeId),
      address: new mongoose.Types.ObjectId(addressId),
      items: dbItems,
      subtotal: order.itemTotal,
      discount: order.offerDiscount || 0,
      deliveryCharge: order.deliveryFee,
      tax: 0,
      grandTotal: order.totalAmount,
      couponCode: order.offerCode || '',
      couponDiscount: order.offerDiscount || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus.replaceAll(' ', '_').toUpperCase(),
      status: order.status.toUpperCase(),
      cancelReason: '',
    });

    res.status(201).json({ success: true, order: newOrder });
  })
);

orderRoutes.post(
  '/',
  authenticate,
  validatePlaceOrderRequest,
  asyncHandler(placeOrderController),
);
orderRoutes.patch(
  '/:orderNumber/cancel',
  authenticate,
  validateCancelOrderRequest,
  asyncHandler(cancelOrderController),
);
orderRoutes.patch(
  '/:orderNumber/confirm-cod',
  authenticate,
  validateConfirmCodRequest,
  asyncHandler(confirmCodOrderController),
);
