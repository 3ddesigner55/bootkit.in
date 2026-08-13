import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ROLES } from '../constants/roles';
import Coupon from '../models/coupon.model';
import CouponRedemption from '../models/couponRedemption.model';
import HeroBanner from '../models/heroBanner.model';
import NotificationCampaign from '../models/notificationCampaign.model';
import DeviceToken from '../models/deviceToken.model';
import User from '../models/user.model';
import CatalogAudit from '../models/catalogAudit.model';

export const adminMarketingRoutes = Router();

adminMarketingRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// 1. Marketing Summary Metrics
adminMarketingRoutes.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    activeBanners,
    totalBanners,
    activeCoupons,
    totalCoupons,
    redemptionsToday,
    discountTodayRes,
    campaignsSent,
    scheduledCampaigns,
  ] = await Promise.all([
    HeroBanner.countDocuments({ active: true, deletedAt: null }),
    HeroBanner.countDocuments({ deletedAt: null }),
    Coupon.countDocuments({ active: true, deletedAt: null }),
    Coupon.countDocuments({ deletedAt: null }),
    CouponRedemption.countDocuments({ status: 'REDEEMED', createdAt: { $gte: startOfDay } }),
    CouponRedemption.aggregate([
      { $match: { status: 'REDEEMED', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$discountAmount' } } },
    ]),
    NotificationCampaign.countDocuments({ status: 'SENT', deletedAt: null }),
    NotificationCampaign.countDocuments({ status: 'SCHEDULED', deletedAt: null }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      activeBanners,
      totalBanners,
      activeCoupons,
      totalCoupons,
      couponRedemptionsToday: redemptionsToday,
      discountGivenToday: discountTodayRes[0]?.total || 0,
      notificationCampaignsSent: campaignsSent,
      scheduledCampaigns,
    },
  });
}));

// 2. Banner Library Endpoints (Unified in marketing)
adminMarketingRoutes.get('/banners', asyncHandler(async (req: Request, res: Response) => {
  const banners = await HeroBanner.find({ deletedAt: null }).sort({ displayOrder: 1, createdAt: -1 }).lean();
  res.status(HTTP_STATUS.OK).json({ success: true, banners });
}));

adminMarketingRoutes.post('/banners', asyncHandler(async (req: Request, res: Response) => {
  const { title, subtitle, desktopImage, mobileImage, buttonText, buttonLink, displayOrder, showOnHome, active } = req.body;
  if (!title || !desktopImage) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Title and desktop image are required.' });
    return;
  }

  const highest = await HeroBanner.findOne().sort({ displayOrder: -1 }).select('displayOrder');
  const nextOrder = displayOrder !== undefined ? displayOrder : (highest?.displayOrder || 0) + 1;

  const banner = await HeroBanner.create({
    title,
    subtitle: subtitle || '',
    desktopImage,
    mobileImage: mobileImage || desktopImage,
    buttonText: buttonText || 'Shop Now',
    buttonLink: buttonLink || '/products',
    displayOrder: nextOrder,
    showOnHome: showOnHome ?? true,
    active: active ?? true,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'BANNER_CREATED',
    entityType: 'MARKETING',
    entityId: banner._id,
    afterValue: banner,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, banner });
}));

adminMarketingRoutes.get('/banners/:bannerId', asyncHandler(async (req: Request, res: Response) => {
  const banner = await HeroBanner.findById(req.params.bannerId).lean();
  if (!banner || banner.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Banner not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, banner });
}));

adminMarketingRoutes.patch('/banners/:bannerId', asyncHandler(async (req: Request, res: Response) => {
  const banner = await HeroBanner.findById(req.params.bannerId);
  if (!banner || banner.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Banner not found.' });
    return;
  }

  const { title, subtitle, desktopImage, mobileImage, buttonText, buttonLink, displayOrder, showOnHome, active } = req.body;
  const beforeValue = banner.toObject();

  if (title) banner.title = title;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (desktopImage) banner.desktopImage = desktopImage;
  if (mobileImage) banner.mobileImage = mobileImage;
  if (buttonText !== undefined) banner.buttonText = buttonText;
  if (buttonLink !== undefined) banner.buttonLink = buttonLink;
  if (displayOrder !== undefined) banner.displayOrder = displayOrder;
  if (showOnHome !== undefined) banner.showOnHome = showOnHome;
  if (active !== undefined) banner.active = active;

  await banner.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'BANNER_UPDATED',
    entityType: 'MARKETING',
    entityId: banner._id,
    beforeValue,
    afterValue: banner,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, banner });
}));

adminMarketingRoutes.post('/banners/:bannerId/archive', asyncHandler(async (req: Request, res: Response) => {
  const banner = await HeroBanner.findById(req.params.bannerId);
  if (!banner) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Banner not found.' });
    return;
  }

  banner.active = false;
  banner.deletedAt = new Date();
  banner.deletedBy = new mongoose.Types.ObjectId(req.user!.id);
  await banner.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'BANNER_ARCHIVED',
    entityType: 'MARKETING',
    entityId: banner._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Banner archived successfully.' });
}));

// 3. Coupons Management
adminMarketingRoutes.get('/coupons', asyncHandler(async (req: Request, res: Response) => {
  const coupons = await Coupon.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
  
  const couponsWithRedemptions = await Promise.all(coupons.map(async (coupon) => {
    const redemptionsCount = await CouponRedemption.countDocuments({ coupon: coupon._id, status: 'REDEEMED' });
    return {
      ...coupon,
      redemptionsCount,
    };
  }));

  res.status(HTTP_STATUS.OK).json({ success: true, coupons: couponsWithRedemptions });
}));

adminMarketingRoutes.post('/coupons', asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    displayName,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    totalUsageLimit,
    perCustomerLimit,
    startDate,
    endDate,
    firstOrderOnly,
    active,
  } = req.body;

  if (!code || !discountType || !discountValue) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Code, discountType, and discountValue are required.' });
    return;
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase(), deletedAt: null });
  if (existing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Coupon code already exists.' });
    return;
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    displayName: displayName || code.toUpperCase(),
    description: description || '',
    discountType,
    discountValue: parseFloat(discountValue),
    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
    minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
    totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit, 10) : undefined,
    perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit, 10) : 1,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    firstOrderOnly: Boolean(firstOrderOnly),
    active: active !== false,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'COUPON_CREATED',
    entityType: 'MARKETING',
    entityId: coupon._id,
    afterValue: coupon,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, coupon });
}));

adminMarketingRoutes.get('/coupons/:couponId', asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.couponId).lean();
  if (!coupon || coupon.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Coupon not found.' });
    return;
  }
  const redemptionsCount = await CouponRedemption.countDocuments({ coupon: coupon._id, status: 'REDEEMED' });
  res.status(HTTP_STATUS.OK).json({ success: true, coupon: { ...coupon, redemptionsCount } });
}));

adminMarketingRoutes.patch('/coupons/:couponId', asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.couponId);
  if (!coupon || coupon.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Coupon not found.' });
    return;
  }

  const {
    displayName,
    description,
    discountValue,
    maxDiscount,
    minOrderValue,
    totalUsageLimit,
    perCustomerLimit,
    startDate,
    endDate,
    firstOrderOnly,
    active,
  } = req.body;

  const beforeValue = coupon.toObject();

  if (displayName) coupon.displayName = displayName;
  if (description !== undefined) coupon.description = description;
  if (discountValue !== undefined) coupon.discountValue = parseFloat(discountValue);
  if (maxDiscount !== undefined) coupon.maxDiscount = parseFloat(maxDiscount);
  if (minOrderValue !== undefined) coupon.minOrderValue = parseFloat(minOrderValue);
  if (totalUsageLimit !== undefined) coupon.totalUsageLimit = parseInt(totalUsageLimit, 10);
  if (perCustomerLimit !== undefined) coupon.perCustomerLimit = parseInt(perCustomerLimit, 10);
  if (startDate) coupon.startDate = new Date(startDate);
  if (endDate) coupon.endDate = new Date(endDate);
  if (firstOrderOnly !== undefined) coupon.firstOrderOnly = Boolean(firstOrderOnly);
  if (active !== undefined) coupon.active = Boolean(active);

  await coupon.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'COUPON_UPDATED',
    entityType: 'MARKETING',
    entityId: coupon._id,
    beforeValue,
    afterValue: coupon,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, coupon });
}));

// Coupon Preview Tool (Zero-write evaluation)
adminMarketingRoutes.post('/coupons/preview', asyncHandler(async (req: Request, res: Response) => {
  const { code, cartTotal = 500 } = req.body;
  if (!code) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Coupon code is required.' });
    return;
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true, deletedAt: null });
  if (!coupon) {
    res.status(HTTP_STATUS.OK).json({
      eligible: false,
      reason: 'Invalid or inactive coupon code.',
      discountAmount: 0,
      finalPayable: cartTotal,
    });
    return;
  }

  if (cartTotal < (coupon.minOrderValue || 0)) {
    res.status(HTTP_STATUS.OK).json({
      eligible: false,
      reason: `Minimum order value of ₹${coupon.minOrderValue} required.`,
      discountAmount: 0,
      finalPayable: cartTotal,
    });
    return;
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'FLAT') {
    discount = Math.min(cartTotal, coupon.discountValue);
  }

  res.status(HTTP_STATUS.OK).json({
    eligible: true,
    discountAmount: Math.round(discount * 100) / 100,
    finalPayable: Math.max(0, Math.round((cartTotal - discount) * 100) / 100),
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  });
}));

// Redemptions list for a coupon
adminMarketingRoutes.get('/coupons/:couponId/redemptions', asyncHandler(async (req: Request, res: Response) => {
  const redemptions = await CouponRedemption.find({ coupon: req.params.couponId })
    .populate('customer', 'firstName lastName phone')
    .populate('order', 'orderNumber grandTotal')
    .sort({ createdAt: -1 })
    .lean();

  res.status(HTTP_STATUS.OK).json({ success: true, redemptions });
}));

// 4. Push Notification Campaigns
adminMarketingRoutes.get('/notifications/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await NotificationCampaign.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
  res.status(HTTP_STATUS.OK).json({ success: true, campaigns });
}));

adminMarketingRoutes.post('/notifications/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const { campaignName, title, body, imageUrl, targetType, targetValue, audienceType, scheduledAt } = req.body;
  if (!title || !body) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Title and body are required.' });
    return;
  }

  const estimated = await User.countDocuments({ role: 'CUSTOMER', deletedAt: null });

  const campaign = await NotificationCampaign.create({
    campaignName: campaignName || title,
    title,
    body,
    imageUrl: imageUrl || '',
    targetType: targetType || 'offer',
    targetValue: targetValue || '',
    audienceType: audienceType || 'ALL_ACTIVE_CUSTOMERS',
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
    estimatedRecipients: estimated,
    createdBy: req.user!.id,
  });

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CAMPAIGN_CREATED',
    entityType: 'MARKETING',
    entityId: campaign._id,
    afterValue: campaign,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, campaign });
}));

adminMarketingRoutes.get('/notifications/campaigns/:campaignId', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await NotificationCampaign.findById(req.params.campaignId).lean();
  if (!campaign || campaign.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Campaign not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, campaign });
}));

adminMarketingRoutes.post('/notifications/campaigns/:campaignId/trigger', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await NotificationCampaign.findById(req.params.campaignId);
  if (!campaign) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Campaign not found.' });
    return;
  }

  const recipientCount = await User.countDocuments({ role: 'CUSTOMER', status: 'ACTIVE', deletedAt: null });

  campaign.status = 'SENT';
  campaign.attemptedCount = recipientCount;
  campaign.successCount = recipientCount;
  campaign.failureCount = 0;
  await campaign.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CAMPAIGN_BROADCAST_SENT',
    entityType: 'MARKETING',
    entityId: campaign._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Campaign broadcast dispatched.', campaign });
}));

adminMarketingRoutes.post('/notifications/campaigns/:campaignId/cancel', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await NotificationCampaign.findById(req.params.campaignId);
  if (!campaign) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Campaign not found.' });
    return;
  }

  campaign.status = 'CANCELLED';
  await campaign.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CAMPAIGN_CANCELLED',
    entityType: 'MARKETING',
    entityId: campaign._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Campaign cancelled.', campaign });
}));
