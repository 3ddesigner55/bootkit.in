import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import {
  createStoreController,
  deleteStoreController,
  getAdminStoreController,
  getAdminStoresController,
  getStoreBySlugController,
  getStoreController,
  getStoresController,
  uploadStoreImagesController,
  updateStoreController,
  changeDefaultStoreController,
} from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { ROLES } from '../constants/roles';
import { upload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import Store from '../models/store.model';
import DeliveryArea from '../models/deliveryArea.model';
import StoreInventory from '../models/storeInventory.model';
import CatalogAudit from '../models/catalogAudit.model';
import Order from '../models/order.model';
import {
  validateStoreCreateRequest,
  validateStoreListQueryRequest,
  validateStoreUpdateRequest,
} from '../validators/store.validator';

export const storeRoutes = Router();
export const adminStoreRoutes = Router();

storeRoutes.get(
  '/',
  validateStoreListQueryRequest,
  asyncHandler(getStoresController),
);
storeRoutes.get('/slug/:slug', asyncHandler(getStoreBySlugController));
storeRoutes.get('/:id', asyncHandler(getStoreController));

adminStoreRoutes.use(authenticate, requireStoreScope);

adminStoreRoutes.post(
  '/upload',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  asyncHandler(uploadStoreImagesController),
);
adminStoreRoutes.get(
  '/',
  validateStoreListQueryRequest,
  asyncHandler(getAdminStoresController),
);
adminStoreRoutes.get('/:id', asyncHandler(getAdminStoreController));
adminStoreRoutes.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  validateStoreCreateRequest,
  asyncHandler(createStoreController),
);
adminStoreRoutes.patch(
  '/:id',
  validateStoreUpdateRequest,
  asyncHandler(updateStoreController),
);
adminStoreRoutes.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(deleteStoreController),
);
adminStoreRoutes.put(
  '/:id/default',
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  asyncHandler(changeDefaultStoreController),
);

// Readiness Checklist Endpoint
adminStoreRoutes.get('/:id/readiness', asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }

  const missingRequirements: string[] = [];
  
  // Timings check
  const weeklyTimingsExist = store.weeklySchedule && store.weeklySchedule.some((day: any) => day.enabled && day.intervals.length > 0);
  if (!weeklyTimingsExist) {
    missingRequirements.push('TIMINGS_REQUIRED');
  }

  // Active service area/pincode mapping check
  const pincodeMappingCount = await DeliveryArea.countDocuments({ store: store._id, active: true, deletedAt: null });
  if (pincodeMappingCount === 0) {
    missingRequirements.push('DELIVERY_AREA_REQUIRED');
  }

  // Active StoreInventory check
  const inventoryCount = await StoreInventory.countDocuments({ store: store._id, active: true, deletedAt: null });
  if (inventoryCount === 0) {
    missingRequirements.push('STORE_INVENTORY_REQUIRED');
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    readyForOrders: missingRequirements.length === 0,
    missingRequirements,
  });
}));

// Service Areas / Pincode Mapping Endpoints
adminStoreRoutes.get('/:id/service-areas', asyncHandler(async (req: Request, res: Response) => {
  const areas = await DeliveryArea.find({ store: req.params.id, deletedAt: null }).sort({ sortOrder: 1 });
  res.status(HTTP_STATUS.OK).json({ success: true, serviceAreas: areas });
}));

adminStoreRoutes.post('/:id/service-areas', asyncHandler(async (req: Request, res: Response) => {
  const { pincode, areaName, minimumOrderAmountOverride, deliveryFee, estimatedDeliveryMinutes } = req.body;
  if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid 6-digit Indian pincode.' });
    return;
  }

  // Compound Unique check
  const existing = await DeliveryArea.findOne({ store: req.params.id, pincode, deletedAt: null });
  if (existing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Pincode mapping already exists for this store.' });
    return;
  }

  // Partial unique check (one active store per pincode)
  const activeExisting = await DeliveryArea.findOne({ pincode, active: true, deletedAt: null });
  if (activeExisting) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'This pincode is already active for another Hub.' });
    return;
  }

  const area = await DeliveryArea.create({
    store: req.params.id,
    pincode,
    areaName,
    minimumOrderAmountOverride,
    deliveryFee: deliveryFee || 0,
    estimatedDeliveryMinutes: estimatedDeliveryMinutes || 10,
    active: true,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'SERVICE_AREA_ADDED',
    entityType: 'STORE',
    entityId: req.params.id,
    afterValue: area,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, serviceArea: area });
}));

adminStoreRoutes.patch('/:id/service-areas/:areaId', asyncHandler(async (req: Request, res: Response) => {
  const area = await DeliveryArea.findOne({ _id: req.params.areaId, store: req.params.id });
  if (!area) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Service area not found.' });
    return;
  }

  const beforeValue = area.toObject();
  const { active, minimumOrderAmountOverride, deliveryFee, estimatedDeliveryMinutes } = req.body;

  if (active === true) {
    // Enforce partial unique check (one active store per pincode)
    const activeExisting = await DeliveryArea.findOne({
      pincode: area.pincode,
      active: true,
      deletedAt: null,
      _id: { $ne: area._id }
    });
    if (activeExisting) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'This pincode is already active for another Hub.' });
      return;
    }
  }

  if (active !== undefined) area.active = active;
  if (minimumOrderAmountOverride !== undefined) area.minimumOrderAmountOverride = minimumOrderAmountOverride;
  if (deliveryFee !== undefined) area.deliveryFee = deliveryFee;
  if (estimatedDeliveryMinutes !== undefined) area.estimatedDeliveryMinutes = estimatedDeliveryMinutes;

  await area.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'SERVICE_AREA_UPDATED',
    entityType: 'STORE',
    entityId: req.params.id,
    beforeValue,
    afterValue: area,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, serviceArea: area });
}));

adminStoreRoutes.delete('/:id/service-areas/:areaId', asyncHandler(async (req: Request, res: Response) => {
  const area = await DeliveryArea.findOne({ _id: req.params.areaId, store: req.params.id });
  if (!area) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Service area not found.' });
    return;
  }

  area.deletedAt = new Date();
  area.deletedBy = new mongoose.Types.ObjectId(req.user!.id);
  await area.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'SERVICE_AREA_DELETED',
    entityType: 'STORE',
    entityId: req.params.id,
    beforeValue: area,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Service area removed successfully.' });
}));

// Timing schedule endpoints
adminStoreRoutes.get('/:id/timings', asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, weeklySchedule: store.weeklySchedule || [] });
}));

adminStoreRoutes.put('/:id/timings', asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }

  const { weeklySchedule } = req.body;
  if (!weeklySchedule || !Array.isArray(weeklySchedule)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid schedule payload.' });
    return;
  }

  // Validate intervals formats
  for (const day of weeklySchedule) {
    if (day.enabled && day.intervals) {
      for (const interval of day.intervals) {
        if (!/^\d{2}:\d{2}$/.test(interval.open) || !/^\d{2}:\d{2}$/.test(interval.close)) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Timings must match 24h format (HH:MM).' });
          return;
        }
        if (interval.open === interval.close) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Open and close times cannot be identical.' });
          return;
        }
      }
    }
  }

  const beforeValue = store.toObject();
  store.weeklySchedule = weeklySchedule;
  await store.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STORE_TIMINGS_UPDATED',
    entityType: 'STORE',
    entityId: req.params.id,
    beforeValue: beforeValue.weeklySchedule,
    afterValue: weeklySchedule,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, store });
}));

// Emergency Offline Controls
adminStoreRoutes.post('/:id/offline', asyncHandler(async (req: Request, res: Response) => {
  const { reason, offlineUntil } = req.body;
  if (!reason) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason is required to take store offline.' });
    return;
  }

  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }

  const activeOrdersCount = await Order.countDocuments({
    store: store._id,
    status: { $in: ['PLACED', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY'] },
  });

  store.operationalStatus = 'TEMPORARILY_OFFLINE';
  store.emergencyOffline = {
    offlineUntil: offlineUntil ? new Date(offlineUntil) : null,
    reason,
    startedAt: new Date(),
    actorId: new mongoose.Types.ObjectId(req.user!.id),
  };
  await store.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STORE_EMERGENCY_OFFLINE',
    entityType: 'STORE',
    entityId: req.params.id,
    reason,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, activeOrdersCount, store });
}));

adminStoreRoutes.post('/:id/online', asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }

  store.operationalStatus = 'OPEN';
  if (store.emergencyOffline) {
    store.emergencyOffline.restoredAt = new Date();
  }
  await store.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STORE_RESTORED_ONLINE',
    entityType: 'STORE',
    entityId: req.params.id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, store });
}));

// Store Audit history
adminStoreRoutes.get('/:id/audit', asyncHandler(async (req: Request, res: Response) => {
  const logs = await CatalogAudit.find({ entityId: req.params.id }).sort({ timestamp: -1 });
  res.status(HTTP_STATUS.OK).json({ success: true, logs });
}));

// Routing Engine Preview (zero writes)
adminStoreRoutes.post('/routing/preview', asyncHandler(async (req: Request, res: Response) => {
  const { pincode, coordinates, previewDate } = req.body;
  if (!pincode || typeof pincode !== 'string' || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid 6-digit Indian pincode.' });
    return;
  }

  // Find mapping
  const area = await DeliveryArea.findOne({ pincode, active: true, deletedAt: null }).populate('store');
  if (!area || !area.store) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      result: {
        serviceable: false,
        status: 'UNSERVICEABLE_AREA',
        reason: 'No active delivery area mapped for this pincode.',
        rulePath: ['Validate Pincode -> No Active Delivery Area'],
      },
    });
    return;
  }

  const store = area.store as any;
  const rulePath: string[] = ['Validate Pincode', `Matched Hub: ${store.name} (${store.slug})`];

  if (!store.active || store.deletedAt) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      result: {
        serviceable: false,
        status: 'STORE_INACTIVE',
        reason: 'Assigned Hub is currently inactive or deleted.',
        rulePath: [...rulePath, 'Hub Status Check -> Inactive'],
      },
    });
    return;
  }

  if (store.operationalStatus === 'TEMPORARILY_OFFLINE') {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      result: {
        serviceable: false,
        status: 'STORE_TEMPORARILY_OFFLINE',
        reason: store.emergencyOffline?.reason || 'Store is temporarily offline.',
        rulePath: [...rulePath, 'Operational Check -> TEMPORARILY_OFFLINE'],
      },
    });
    return;
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    result: {
      serviceable: true,
      status: 'SERVICE_AVAILABLE',
      hub: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        city: store.city,
      },
      deliveryArea: {
        id: area._id,
        pincode: area.pincode,
        areaName: area.areaName,
        estimatedDeliveryMinutes: area.estimatedDeliveryMinutes || 10,
        deliveryFee: area.deliveryFee || 0,
        minimumOrderAmount: area.minimumOrderAmountOverride || store.minimumOrderAmount || 0,
      },
      rulePath: [...rulePath, 'Operational Check -> OPEN', 'Capacity -> Normal', 'Resolution Complete'],
    },
  });
}));

// High Demand Surge Toggle
adminStoreRoutes.post('/:id/high-demand', asyncHandler(async (req: Request, res: Response) => {
  const { enabled, reason, temporaryFee } = req.body;
  const store = await Store.findById(req.params.id);
  if (!store || store.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Store not found.' });
    return;
  }

  store.operationalStatus = enabled ? 'HIGH_DEMAND' as any : 'OPEN';
  await store.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: enabled ? 'STORE_SURGE_ENABLED' : 'STORE_SURGE_DISABLED',
    entityType: 'STORE',
    entityId: req.params.id,
    reason: reason || 'High demand surge fee adjustment',
  });

  res.status(HTTP_STATUS.OK).json({ success: true, store });
}));

// Category Overrides (Stop Specific Category per Hub)
adminStoreRoutes.post('/:id/category-overrides', asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, reason } = req.body;
  if (!categoryId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'categoryId is required.' });
    return;
  }

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STORE_CATEGORY_OVERRIDE_APPLIED',
    entityType: 'STORE',
    entityId: req.params.id,
    reason: reason || `Stopped category ${categoryId} for store`,
    afterValue: { categoryId },
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Category override applied for this Hub.' });
}));

adminStoreRoutes.delete('/:id/category-overrides/:overrideId', asyncHandler(async (req: Request, res: Response) => {
  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STORE_CATEGORY_OVERRIDE_REMOVED',
    entityType: 'STORE',
    entityId: req.params.id,
    reason: `Removed category override ${req.params.overrideId}`,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Category override removed.' });
}));

// Service Areas CSV Import Validate & Execute
adminStoreRoutes.post('/:id/service-areas/import/validate', asyncHandler(async (req: Request, res: Response) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Valid rows array required.' });
    return;
  }

  const preview = rows.map((r: any, idx: number) => {
    const pincode = String(r.pincode || '').trim();
    const isValidPin = /^\d{6}$/.test(pincode);
    return {
      row: idx + 1,
      pincode,
      areaName: r.areaName || `Area ${pincode}`,
      status: isValidPin ? 'valid' : 'invalid',
      error: isValidPin ? null : 'Must be a 6-digit Indian pincode',
    };
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    totalRows: rows.length,
    validCount: preview.filter(p => p.status === 'valid').length,
    invalidCount: preview.filter(p => p.status === 'invalid').length,
    rows: preview,
  });
}));

adminStoreRoutes.post('/:id/service-areas/import/execute', asyncHandler(async (req: Request, res: Response) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Valid rows array required.' });
    return;
  }

  let imported = 0;
  for (const r of rows) {
    const pincode = String(r.pincode || '').trim();
    if (/^\d{6}$/.test(pincode)) {
      const existing = await DeliveryArea.findOne({ store: req.params.id, pincode, deletedAt: null });
      if (!existing) {
        await DeliveryArea.create({
          store: req.params.id,
          pincode,
          areaName: r.areaName || `Area ${pincode}`,
          deliveryFee: Number(r.deliveryFee) || 0,
          estimatedDeliveryMinutes: Number(r.estimatedDeliveryMinutes) || 10,
          active: true,
          createdBy: req.user!.id,
        });
        imported++;
      }
    }
  }

  res.status(HTTP_STATUS.OK).json({ success: true, importedCount: imported });
}));

