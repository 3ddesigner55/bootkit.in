import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ROLES } from '../constants/roles';
import Rider from '../models/rider.model';
import RiderEarning from '../models/riderEarning.model';
import RiderPayout from '../models/riderPayout.model';
import User from '../models/user.model';
import Store from '../models/store.model';
import Order from '../models/order.model';
import CatalogAudit from '../models/catalogAudit.model';

export const riderLogisticsRoutes = Router();

riderLogisticsRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// Summary Metrics Endpoint
riderLogisticsRoutes.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const [
    totalRiders,
    pendingVerification,
    verifiedRiders,
    suspendedRiders,
    idleRiders,
    onTripRiders,
    offlineRiders,
  ] = await Promise.all([
    Rider.countDocuments({ deletedAt: null }),
    Rider.countDocuments({ onboardingStatus: { $in: ['DRAFT', 'PENDING_VERIFICATION'] }, deletedAt: null }),
    Rider.countDocuments({ onboardingStatus: 'APPROVED', deletedAt: null }),
    Rider.countDocuments({ onboardingStatus: 'SUSPENDED', deletedAt: null }),
    Rider.countDocuments({ availabilityStatus: 'AVAILABLE', deletedAt: null }),
    Rider.countDocuments({ availabilityStatus: { $in: ['ASSIGNED', 'ON_DELIVERY'] }, deletedAt: null }),
    Rider.countDocuments({ availabilityStatus: 'OFFLINE', deletedAt: null }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      totalRiders,
      pendingVerification,
      verifiedRiders,
      activeShiftRiders: idleRiders + onTripRiders,
      idleRiders,
      onTripRiders,
      offlineRiders,
      suspendedRiders,
    },
  });
}));

// Live Fleet Endpoint
riderLogisticsRoutes.get('/live', asyncHandler(async (req: Request, res: Response) => {
  const riders = await Rider.find({ deletedAt: null })
    .populate('user', 'firstName lastName phone')
    .populate('assignedStore', 'name slug')
    .lean();

  const now = Date.now();
  const fiveMinsMs = 5 * 60 * 1000;

  const fleet = riders.map((r: any) => {
    const lastPing = r.lastHeartbeatAt ? new Date(r.lastHeartbeatAt).getTime() : null;
    const isStale = lastPing ? now - lastPing > fiveMinsMs : true;

    return {
      _id: r._id,
      riderCode: r.riderCode,
      name: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Rider',
      phone: r.user?.phone || '',
      hub: r.assignedStore?.name || 'Unassigned',
      availabilityStatus: r.availabilityStatus,
      onboardingStatus: r.onboardingStatus,
      vehicleType: r.vehicleType,
      vehicleRegNumber: r.vehicleRegNumber,
      lastLocation: r.lastLocation || null,
      lastHeartbeatAt: r.lastHeartbeatAt || null,
      isGpsStale: isStale,
    };
  });

  res.status(HTTP_STATUS.OK).json({ success: true, fleet });
}));

// All Payouts Endpoint (for settlement dashboard)
riderLogisticsRoutes.get('/payouts/all', asyncHandler(async (req: Request, res: Response) => {
  const payouts = await RiderPayout.find({})
    .populate({
      path: 'rider',
      populate: [
        { path: 'user', select: 'firstName lastName phone' },
        { path: 'assignedStore', select: 'name' },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(HTTP_STATUS.OK).json({ success: true, payouts });
}));

// List Riders
riderLogisticsRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { storeId, status, search, page = '1', limit = '15' } = req.query;
  const filter: any = { deletedAt: null };

  if (storeId && mongoose.isValidObjectId(storeId as string)) {
    filter.assignedStore = new mongoose.Types.ObjectId(storeId as string);
  }
  if (status && status !== 'ALL') {
    filter.availabilityStatus = status;
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 15);
  const skip = (pageNum - 1) * limitNum;

  let ridersQuery = Rider.find(filter)
    .populate('user', 'firstName lastName phone email')
    .populate('assignedStore', 'name slug')
    .sort({ createdAt: -1 });

  if (search && typeof search === 'string') {
    const s = search.trim();
    ridersQuery = ridersQuery.find({
      $or: [
        { riderCode: new RegExp(s, 'i') },
        { vehicleRegNumber: new RegExp(s, 'i') },
        { licenseNumber: new RegExp(s, 'i') },
      ],
    });
  }

  const [total, riders] = await Promise.all([
    Rider.countDocuments(filter),
    ridersQuery.skip(skip).limit(limitNum).lean(),
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    riders,
    total,
    totalPages: Math.ceil(total / limitNum),
    page: pageNum,
  });
}));

// Create / Onboard Rider
riderLogisticsRoutes.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    assignedStore,
    vehicleType,
    vehicleRegNumber,
    vehicleModel,
    vehicleColor,
    licenseNumber,
    licenseHolderName,
    licenseExpiryDate,
  } = req.body;

  if (!phone || !assignedStore || !vehicleType || !vehicleRegNumber || !licenseNumber) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Phone, assignedStore, vehicleType, vehicleRegNumber, and licenseNumber are required.',
    });
    return;
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      firstName: firstName || 'Rider',
      lastName: lastName || '',
      phone,
      email: email || undefined,
      role: 'RIDER',
      status: 'ACTIVE',
    });
  }

  const existingRider = await Rider.findOne({ user: user._id, deletedAt: null });
  if (existingRider) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Rider record already exists for this phone number.' });
    return;
  }

  const riderCode = `RDR-${Math.floor(100000 + Math.random() * 900000)}`;

  const rider = await Rider.create({
    user: user._id,
    riderCode,
    assignedStore: new mongoose.Types.ObjectId(assignedStore),
    onboardingStatus: 'PENDING_VERIFICATION',
    availabilityStatus: 'OFFLINE',
    vehicleType,
    vehicleRegNumber,
    vehicleModel: vehicleModel || 'Standard',
    vehicleColor: vehicleColor || 'Black',
    licenseNumber,
    licenseHolderName: licenseHolderName || `${firstName || ''} ${lastName || ''}`.trim() || 'Rider',
    licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    earningsBalance: 0,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_ONBOARDED',
    entityType: 'RIDER',
    entityId: rider._id,
    afterValue: rider,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, rider });
}));

// Get Specific Rider Profile
riderLogisticsRoutes.get('/:riderId', asyncHandler(async (req: Request, res: Response) => {
  const rider = await Rider.findById(req.params.riderId)
    .populate('user', 'firstName lastName phone email status')
    .populate('assignedStore', 'name slug addressLine1 city state')
    .lean();

  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  res.status(HTTP_STATUS.OK).json({ success: true, rider });
}));

// Update Rider details
riderLogisticsRoutes.patch('/:riderId', asyncHandler(async (req: Request, res: Response) => {
  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  const { vehicleType, vehicleRegNumber, vehicleModel, vehicleColor, assignedStore, availabilityStatus } = req.body;
  const beforeValue = rider.toObject();

  if (vehicleType) rider.vehicleType = vehicleType;
  if (vehicleRegNumber) rider.vehicleRegNumber = vehicleRegNumber;
  if (vehicleModel) rider.vehicleModel = vehicleModel;
  if (vehicleColor) rider.vehicleColor = vehicleColor;
  if (assignedStore && mongoose.isValidObjectId(assignedStore)) {
    rider.assignedStore = new mongoose.Types.ObjectId(assignedStore);
  }
  if (availabilityStatus) rider.availabilityStatus = availabilityStatus;

  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_PROFILE_UPDATED',
    entityType: 'RIDER',
    entityId: rider._id,
    beforeValue,
    afterValue: rider,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, rider });
}));

// Reassign Hub
riderLogisticsRoutes.patch('/:riderId/hub', asyncHandler(async (req: Request, res: Response) => {
  const { storeId, reason } = req.body;
  if (!storeId || !mongoose.isValidObjectId(storeId)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Valid storeId is required.' });
    return;
  }

  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  const prevStore = rider.assignedStore;
  rider.assignedStore = new mongoose.Types.ObjectId(storeId);
  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_HUB_REASSIGNED',
    entityType: 'RIDER',
    entityId: rider._id,
    reason: reason || 'Hub reassigned by Admin',
    beforeValue: { assignedStore: prevStore },
    afterValue: { assignedStore: storeId },
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Hub reassigned successfully.', rider });
}));

// Approve Rider KYC
riderLogisticsRoutes.post('/:riderId/approve', asyncHandler(async (req: Request, res: Response) => {
  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  rider.onboardingStatus = 'APPROVED';
  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_APPROVED',
    entityType: 'RIDER',
    entityId: rider._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Rider approved and verified.', rider });
}));

// Reject Rider KYC
riderLogisticsRoutes.post('/:riderId/reject', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  rider.onboardingStatus = 'REJECTED';
  rider.availabilityStatus = 'OFFLINE';
  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_REJECTED',
    entityType: 'RIDER',
    entityId: rider._id,
    reason: reason || 'Document verification failed',
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Rider rejected.', rider });
}));

// Suspend Rider
riderLogisticsRoutes.post('/:riderId/suspend', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  rider.onboardingStatus = 'SUSPENDED';
  rider.availabilityStatus = 'OFFLINE';
  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_SUSPENDED',
    entityType: 'RIDER',
    entityId: rider._id,
    reason: reason || 'Suspended by Admin',
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Rider suspended.', rider });
}));

// Reactivate Rider
riderLogisticsRoutes.post('/:riderId/reactivate', asyncHandler(async (req: Request, res: Response) => {
  const rider = await Rider.findById(req.params.riderId);
  if (!rider) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Rider not found.' });
    return;
  }

  rider.onboardingStatus = 'APPROVED';
  await rider.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'RIDER_REACTIVATED',
    entityType: 'RIDER',
    entityId: rider._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Rider reactivated.', rider });
}));

// Deliveries History
riderLogisticsRoutes.get('/:riderId/deliveries', asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ assignedRider: req.params.riderId })
    .populate('store', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.status(HTTP_STATUS.OK).json({ success: true, orders });
}));

// Audit History
riderLogisticsRoutes.get('/:riderId/audit', asyncHandler(async (req: Request, res: Response) => {
  const logs = await CatalogAudit.find({ entityId: req.params.riderId }).sort({ timestamp: -1 });
  res.status(HTTP_STATUS.OK).json({ success: true, logs });
}));

// Earnings Endpoint
riderLogisticsRoutes.get('/:riderId/earnings', asyncHandler(async (req: Request, res: Response) => {
  const earnings = await RiderEarning.find({ rider: req.params.riderId }).sort({ createdAt: -1 });
  const total = earnings.reduce((sum, item) => sum + item.amount, 0);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    totalEarnings: total,
    earnings,
  });
}));

// Payouts Endpoint (for specific rider)
riderLogisticsRoutes.get('/:riderId/payouts', asyncHandler(async (req: Request, res: Response) => {
  const payouts = await RiderPayout.find({ rider: req.params.riderId }).sort({ createdAt: -1 });
  res.status(HTTP_STATUS.OK).json({ success: true, payouts });
}));

// Create Payout
riderLogisticsRoutes.post('/:riderId/payouts', asyncHandler(async (req: Request, res: Response) => {
  const { amount, paymentUtr } = req.body;
  if (!amount || amount <= 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Payout amount must be a positive number in rupees or paise.' });
    return;
  }
  const amountPaise = Number.isInteger(amount) ? amount : Math.round(amount * 100);

  const session = await mongoose.startSession();
  try {
    let resultPayout;
    await session.withTransaction(async () => {
      const rider = await Rider.findById(req.params.riderId).session(session);
      if (!rider) {
        throw new Error('Rider not found.');
      }

      const payout = await RiderPayout.create([{
        rider: rider._id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        grossEarnings: amountPaise,
        netPayable: amountPaise,
        paymentUtr: paymentUtr || '',
        status: 'PAID',
        paidBy: req.user!.id,
        paidAt: new Date(),
        idempotencyKey: `payout-${rider._id}-${Date.now()}`,
      }], { session }).then(res => res[0]);

      // Deduct earnings ledger record
      await RiderEarning.create([{
        rider: rider._id,
        store: rider.assignedStore,
        direction: 'DEBIT',
        transactionType: 'PAYOUT_DEBIT',
        amount: amountPaise,
        currency: 'INR',
        status: 'SUCCESS',
        idempotencyKey: `earning-payout-${payout._id}`,
        balanceBefore: rider.earningsBalance,
        balanceAfter: Math.max(0, rider.earningsBalance - amountPaise),
        actor: req.user!.id,
        reason: `Settlement payout #${payout._id}`,
      }], { session });

      rider.earningsBalance = Math.max(0, rider.earningsBalance - amountPaise);
      await rider.save({ session });

      resultPayout = payout;
    });

    res.status(HTTP_STATUS.CREATED).json({ success: true, payout: resultPayout });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));
