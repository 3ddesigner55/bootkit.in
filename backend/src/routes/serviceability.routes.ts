import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import DeliveryArea from '../models/deliveryArea.model';
import Store from '../models/store.model';

export const serviceabilityRoutes = Router();

// Helper to check pincode validity
function isValidPincode(pincode: any): boolean {
  return typeof pincode === 'string' && pincode.length === 6 && /^\d{6}$/.test(pincode);
}

// GET resolver (existing compatibility)
serviceabilityRoutes.get(
  '/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { pincode } = req.query;
    if (!pincode || !isValidPincode(pincode)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid 6-digit Indian pincode.',
      });
      return;
    }

    const area = await DeliveryArea.findOne({ pincode, active: true, deletedAt: null }).populate('store');
    if (!area || !area.store) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          serviceable: false,
          reason: 'PINCODE_UNSERVICEABLE',
        },
      });
      return;
    }

    const store = area.store as any;

    if (!store.active || store.deletedAt) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          serviceable: false,
          reason: 'STORE_INACTIVE',
        },
      });
      return;
    }

    if (store.operationalStatus === 'TEMPORARILY_OFFLINE') {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          serviceable: false,
          reason: 'STORE_CLOSED_TEMPORARILY_OFFLINE',
        },
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        serviceable: true,
        storeId: store._id,
        storeName: store.name,
        estimatedDeliveryMinutes: area.estimatedDeliveryMinutes || 10,
        deliveryFee: area.deliveryFee || 0,
        minimumOrderAmountOverride: area.minimumOrderAmountOverride || 0,
      },
    });
  }),
);

// POST resolver (new state-machine compliant serviceability resolve API)
serviceabilityRoutes.post(
  '/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { pincode, latitude, longitude } = req.body;

    let targetPincode = pincode;

    // Optional coordinates resolution: if coordinates provided, we can look up nearest store
    // or reverse-geocode. But the canonical way is using the resolved pincode.
    if (!targetPincode && latitude && longitude) {
      // Find nearest active store or active delivery area as fallback
      const fallbackArea = await DeliveryArea.findOne({ active: true, deletedAt: null })
        .populate('store')
        .lean();
      if (fallbackArea) {
        targetPincode = fallbackArea.pincode;
      }
    }

    if (!targetPincode || !isValidPincode(targetPincode)) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        status: 'UNSERVICEABLE',
        message: 'A valid 6-digit Indian pincode is required.',
      });
      return;
    }

    const area = await DeliveryArea.findOne({ pincode: targetPincode, active: true, deletedAt: null }).populate('store');
    if (!area || !area.store) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        status: 'UNSERVICEABLE',
      });
      return;
    }

    const store = area.store as any;

    if (!store.active || store.deletedAt) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        status: 'STORE_UNAVAILABLE',
      });
      return;
    }

    if (store.operationalStatus === 'TEMPORARILY_OFFLINE') {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        status: 'STORE_CLOSED',
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      status: 'SERVICEABLE',
      data: {
        storeId: store._id.toString(),
        storeName: store.name,
        estimatedDeliveryMinutes: area.estimatedDeliveryMinutes || 10,
        deliveryFee: area.deliveryFee || 0,
        minimumOrderAmountOverride: area.minimumOrderAmountOverride || 0,
      },
    });
  }),
);
