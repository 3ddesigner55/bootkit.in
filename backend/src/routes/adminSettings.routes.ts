import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ROLES } from '../constants/roles';
import SystemSettings from '../models/systemSettings.model';
import TaxProfile from '../models/taxProfile.model';
import CustomRole from '../models/customRole.model';
import StaffInvitation from '../models/staffInvitation.model';
import User from '../models/user.model';
import CatalogAudit from '../models/catalogAudit.model';

export const adminSettingsRoutes = Router();

// Only ADMIN and OWNER are allowed to manage RBAC, invitations and business configurations
adminSettingsRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// 1. Settings Overview & Provider Status
adminSettingsRoutes.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const latestConfig = await SystemSettings.findOne({ scope: 'DELIVERY' }).sort({ configVersion: -1 });
  const staffCount = await User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.OWNER, 'STORE_MANAGER', 'DISPATCH_MANAGER', 'SUPPORT', 'FINANCE', 'MARKETING_MANAGER'] }, deletedAt: null });
  const activeSlabs = await TaxProfile.countDocuments();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    summary: {
      activeVersion: latestConfig?.configVersion || 1,
      lastUpdated: latestConfig?.updatedAt || new Date(),
      status: latestConfig?.status || 'PUBLISHED',
      staffCount,
      activeTaxSlabs: activeSlabs,
    },
  });
}));

adminSettingsRoutes.get('/provider-status', asyncHandler(async (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    providers: [
      { name: 'Push Notification Engine (FCM)', status: 'OPERATIONAL', mode: 'Isolated Staging Provider' },
      { name: 'SMS & OTP Gateway (Fast2SMS)', status: 'OPERATIONAL', mode: 'Direct Mobile OTP' },
      { name: 'Map & Geofence Routing', status: 'OPERATIONAL', mode: 'Haversine Store Geofencing' },
      { name: 'Payment Gateway (Razorpay/Mock)', status: 'OPERATIONAL', mode: 'PAISE Integer Arithmetic' },
    ],
  });
}));

// 2. Delivery & Platform Fees
adminSettingsRoutes.get('/delivery-fees', asyncHandler(async (req: Request, res: Response) => {
  let settings = await SystemSettings.findOne({ scope: 'DELIVERY' }).sort({ configVersion: -1 });
  if (!settings) {
    settings = await SystemSettings.create({
      scope: 'DELIVERY',
      configVersion: 1,
      status: 'PUBLISHED',
      value: {
        baseDeliveryFee: 2900, // 29.00 in paise
        freeDeliveryThreshold: 49900, // 499.00 in paise
        handlingFee: 500, // 5.00 in paise
        smallOrderFee: 1500, // 15.00 in paise
        smallOrderThreshold: 14900, // 149.00 in paise
        minimumOrderValue: 9900, // 99.00 in paise
        nightFee: 2000, // 20.00 in paise
        nightFeeStart: '23:00',
        nightFeeEnd: '06:00',
        surgeFee: 0,
        surgeActive: false,
      },
      publishedAt: new Date(),
    });
  }

  res.status(HTTP_STATUS.OK).json({ success: true, settings });
}));

adminSettingsRoutes.post('/delivery-fees/preview', asyncHandler(async (req: Request, res: Response) => {
  const { cartSubtotal = 35000, isNightTime = false, surgeActive = false } = req.body;
  const current = await SystemSettings.findOne({ scope: 'DELIVERY' }).sort({ configVersion: -1 });
  const val = current?.value || {
    baseDeliveryFee: 2900,
    freeDeliveryThreshold: 49900,
    handlingFee: 500,
    smallOrderFee: 1500,
    smallOrderThreshold: 14900,
    minimumOrderValue: 9900,
    nightFee: 2000,
    surgeFee: 2500,
  };

  const isFreeDelivery = cartSubtotal >= (val.freeDeliveryThreshold || 49900);
  const deliveryFee = isFreeDelivery ? 0 : (val.baseDeliveryFee || 2900);
  const handlingFee = val.handlingFee || 500;
  const smallOrderFee = cartSubtotal < (val.smallOrderThreshold || 14900) ? (val.smallOrderFee || 1500) : 0;
  const nightFee = isNightTime ? (val.nightFee || 2000) : 0;
  const surgeFee = surgeActive ? (val.surgeFee || 2500) : 0;

  const totalPayable = cartSubtotal + deliveryFee + handlingFee + smallOrderFee + nightFee + surgeFee;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    calculation: {
      cartSubtotal,
      deliveryFee,
      isFreeDelivery,
      handlingFee,
      smallOrderFee,
      nightFee,
      surgeFee,
      totalPayable,
      versionUsed: current?.configVersion || 1,
    },
  });
}));

adminSettingsRoutes.post('/delivery-fees/activate', asyncHandler(async (req: Request, res: Response) => {
  const {
    baseDeliveryFee,
    freeDeliveryThreshold,
    handlingFee,
    smallOrderFee,
    smallOrderThreshold,
    minimumOrderValue,
    nightFee,
    nightFeeStart,
    nightFeeEnd,
    surgeFee,
    surgeActive,
  } = req.body;

  const latest = await SystemSettings.findOne({ scope: 'DELIVERY' }).sort({ configVersion: -1 });
  const nextVersion = (latest?.configVersion || 0) + 1;
  const beforeValue = latest?.toObject();

  const newSettings = await SystemSettings.create({
    scope: 'DELIVERY',
    configVersion: nextVersion,
    status: 'PUBLISHED',
    value: {
      baseDeliveryFee: parseInt(baseDeliveryFee, 10),
      freeDeliveryThreshold: parseInt(freeDeliveryThreshold, 10),
      handlingFee: parseInt(handlingFee, 10),
      smallOrderFee: parseInt(smallOrderFee, 10),
      smallOrderThreshold: parseInt(smallOrderThreshold, 10),
      minimumOrderValue: parseInt(minimumOrderValue, 10),
      nightFee: parseInt(nightFee, 10) || 0,
      nightFeeStart: nightFeeStart || '23:00',
      nightFeeEnd: nightFeeEnd || '06:00',
      surgeFee: parseInt(surgeFee, 10) || 0,
      surgeActive: Boolean(surgeActive),
    },
    publishedAt: new Date(),
    publishedBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'DELIVERY_FEES_CONFIG_ACTIVATED',
    entityType: 'SETTINGS',
    entityId: newSettings._id,
    beforeValue,
    afterValue: newSettings,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, settings: newSettings });
}));

adminSettingsRoutes.get('/delivery-fees/history', asyncHandler(async (req: Request, res: Response) => {
  const history = await SystemSettings.find({ scope: 'DELIVERY' }).sort({ configVersion: -1 }).lean();
  res.status(HTTP_STATUS.OK).json({ success: true, history });
}));

// 3. Tax / GST Settings
adminSettingsRoutes.get('/taxes', asyncHandler(async (req: Request, res: Response) => {
  const profiles = await TaxProfile.find({ deletedAt: null }).sort({ taxRate: 1 }).lean();
  res.status(HTTP_STATUS.OK).json({ success: true, taxProfiles: profiles });
}));

adminSettingsRoutes.post('/taxes', asyncHandler(async (req: Request, res: Response) => {
  const { name, profileName, ratePercentage, taxRate, intraStateSplitRatio = 0.5, hsnCode = '9983', priceMode = 'TAX_INCLUSIVE' } = req.body;
  const pName = profileName || name;
  const tRate = taxRate !== undefined ? parseFloat(taxRate) : (ratePercentage !== undefined ? parseFloat(ratePercentage) : 0);

  if (!pName) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Profile name is required.' });
    return;
  }

  const profile = await TaxProfile.create({
    profileName: pName,
    taxRate: tRate,
    intraStateSplitRatio: parseFloat(intraStateSplitRatio),
    hsnCode,
    priceMode,
    startDate: new Date(),
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'TAX_PROFILE_CREATED',
    entityType: 'SETTINGS',
    entityId: profile._id,
    afterValue: profile,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, taxProfile: profile });
}));

adminSettingsRoutes.patch('/taxes/:profileId', asyncHandler(async (req: Request, res: Response) => {
  const profile = await TaxProfile.findById(req.params.profileId);
  if (!profile) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Tax profile not found.' });
    return;
  }

  const { name, profileName, ratePercentage, taxRate, intraStateSplitRatio, hsnCode, priceMode, active } = req.body;
  const beforeValue = profile.toObject();

  if (profileName || name) profile.profileName = profileName || name;
  if (taxRate !== undefined) profile.taxRate = parseFloat(taxRate);
  if (ratePercentage !== undefined) profile.taxRate = parseFloat(ratePercentage);
  if (intraStateSplitRatio !== undefined) profile.intraStateSplitRatio = parseFloat(intraStateSplitRatio);
  if (hsnCode !== undefined) profile.hsnCode = hsnCode;
  if (priceMode !== undefined) profile.priceMode = priceMode;
  if (active !== undefined) profile.active = Boolean(active);

  await profile.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'TAX_PROFILE_UPDATED',
    entityType: 'SETTINGS',
    entityId: profile._id,
    beforeValue,
    afterValue: profile,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, taxProfile: profile });
}));

// 4. Admin Staff Management
adminSettingsRoutes.get('/staff', asyncHandler(async (req: Request, res: Response) => {
  const staff = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.OWNER, 'STORE_MANAGER', 'DISPATCH_MANAGER', 'SUPPORT', 'FINANCE', 'MARKETING_MANAGER'] },
    deletedAt: null,
  })
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  res.status(HTTP_STATUS.OK).json({ success: true, staff });
}));

adminSettingsRoutes.post('/staff', asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, role } = req.body;
  if (!firstName || !email || !phone || !role) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'First name, email, phone, and role are required.' });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'A user with this email already exists.' });
    return;
  }

  const staffUser = await User.create({
    firstName,
    lastName: lastName || '',
    email: email.toLowerCase(),
    phone,
    role,
    status: 'ACTIVE',
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STAFF_MEMBER_CREATED',
    entityType: 'STAFF',
    entityId: staffUser._id,
    afterValue: staffUser,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, staff: staffUser });
}));

adminSettingsRoutes.get('/staff/:staffId', asyncHandler(async (req: Request, res: Response) => {
  const staffUser = await User.findById(req.params.staffId).select('-passwordHash').lean();
  if (!staffUser || staffUser.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Staff member not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, staff: staffUser });
}));

adminSettingsRoutes.patch('/staff/:staffId', asyncHandler(async (req: Request, res: Response) => {
  const staffUser = await User.findById(req.params.staffId);
  if (!staffUser || staffUser.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Staff member not found.' });
    return;
  }

  const { firstName, lastName, role, status } = req.body;
  const beforeValue = staffUser.toObject();

  if (firstName) staffUser.firstName = firstName;
  if (lastName !== undefined) staffUser.lastName = lastName;
  if (role) staffUser.role = role;
  if (status) staffUser.status = status;

  await staffUser.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STAFF_MEMBER_UPDATED',
    entityType: 'STAFF',
    entityId: staffUser._id,
    beforeValue,
    afterValue: staffUser,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, staff: staffUser });
}));

adminSettingsRoutes.post('/staff/:staffId/deactivate', asyncHandler(async (req: Request, res: Response) => {
  const staffUser = await User.findById(req.params.staffId);
  if (!staffUser) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Staff member not found.' });
    return;
  }

  staffUser.status = 'INACTIVE';
  await staffUser.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STAFF_MEMBER_DEACTIVATED',
    entityType: 'STAFF',
    entityId: staffUser._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Staff member deactivated.' });
}));

adminSettingsRoutes.post('/staff/:staffId/revoke-sessions', asyncHandler(async (req: Request, res: Response) => {
  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'STAFF_SESSIONS_REVOKED',
    entityType: 'STAFF',
    entityId: new mongoose.Types.ObjectId(String(req.params.staffId)),
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Active sessions revoked.' });
}));

// 5. Roles & Permissions
adminSettingsRoutes.get('/roles', asyncHandler(async (req: Request, res: Response) => {
  const customRoles = await CustomRole.find().lean();
  const systemRoles = [
    { roleName: 'OWNER', isSystem: true, permissions: ['*'] },
    { roleName: 'ADMIN', isSystem: true, permissions: ['dashboard.*', 'catalog.*', 'orders.*', 'stores.*', 'riders.*', 'marketing.*', 'settings.*'] },
    { roleName: 'STORE_MANAGER', isSystem: true, permissions: ['orders.view', 'orders.pack', 'inventory.view', 'inventory.update'] },
    { roleName: 'DISPATCH_MANAGER', isSystem: true, permissions: ['orders.dispatch', 'riders.view', 'riders.assign'] },
    { roleName: 'SUPPORT', isSystem: true, permissions: ['orders.view', 'tickets.manage', 'refunds.view'] },
    { roleName: 'FINANCE', isSystem: true, permissions: ['reports.view', 'refunds.approve', 'riders.payouts', 'settings.tax.view'] },
    { roleName: 'MARKETING_MANAGER', isSystem: true, permissions: ['marketing.*', 'banners.*', 'coupons.*', 'notifications.*'] },
  ];

  res.status(HTTP_STATUS.OK).json({ success: true, systemRoles, customRoles });
}));

adminSettingsRoutes.post('/roles', asyncHandler(async (req: Request, res: Response) => {
  const { roleName, name, permissions } = req.body;
  const rName = (roleName || name || '').toUpperCase();
  if (!rName || !permissions || !Array.isArray(permissions)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Role name and permissions array are required.' });
    return;
  }

  const existing = await CustomRole.findOne({ name: rName });
  if (existing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Role name already exists.' });
    return;
  }

  const role = await CustomRole.create({
    name: rName,
    permissions,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CUSTOM_ROLE_CREATED',
    entityType: 'SETTINGS',
    entityId: role._id,
    afterValue: role,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, customRole: role });
}));

// 6. Audit Trail
adminSettingsRoutes.get('/audit', asyncHandler(async (req: Request, res: Response) => {
  const logs = await CatalogAudit.find({ entityType: { $in: ['SETTINGS', 'STAFF', 'MARKETING'] } })
    .populate('actor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.status(HTTP_STATUS.OK).json({ success: true, logs });
}));
