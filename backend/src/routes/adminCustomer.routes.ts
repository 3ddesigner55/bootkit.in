import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles';
import {
  getAdminCustomerAddressesController,
  getAdminCustomerController,
  getAdminCustomerOrdersController,
  getAdminCustomersController,
  updateAdminCustomerStatusController,
} from '../controllers/adminCustomer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import WalletTransaction from '../models/walletTransaction.model';
import CatalogAudit from '../models/catalogAudit.model';
import Order from '../models/order.model';
import Refund from '../models/refund.model';
import CustomerRestriction from '../models/customerRestriction.model';
import {
  validateAdminCustomerListQueryRequest,
  validateAdminCustomerOrdersQueryRequest,
  validateAdminCustomerStatusRequest,
} from '../validators/adminCustomer.validator';

export const adminCustomerRoutes = Router();

adminCustomerRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// Summary Metrics Endpoint
adminCustomerRoutes.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      newCustomers7Days,
      activeCustomers,
      accountBlockedCount,
      orderingBlockedCount,
      codDisabledCount,
      walletLiabilityRes,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER', deletedAt: null }),
      User.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: sevenDaysAgo }, deletedAt: null }),
      User.countDocuments({ role: 'CUSTOMER', status: 'ACTIVE', deletedAt: null }),
      CustomerRestriction.countDocuments({ restrictionType: 'ACCOUNT_BLOCKED', active: true }),
      CustomerRestriction.countDocuments({ restrictionType: 'ORDERING_BLOCKED', active: true }),
      CustomerRestriction.countDocuments({ restrictionType: 'COD_DISABLED', active: true }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalCustomers,
        newCustomers7Days,
        activeCustomers,
        accountBlockedCount,
        orderingBlockedCount,
        codDisabledCount,
        totalWalletLiability: (walletLiabilityRes[0]?.total || 0) / 100, // convert paise to rupees
      },
    });
  }),
);

// Keep existing controllers
adminCustomerRoutes.get(
  '/',
  validateAdminCustomerListQueryRequest,
  asyncHandler(getAdminCustomersController),
);
adminCustomerRoutes.get('/:id', asyncHandler(getAdminCustomerController));
adminCustomerRoutes.get(
  '/:id/addresses',
  asyncHandler(getAdminCustomerAddressesController),
);
adminCustomerRoutes.get(
  '/:id/orders',
  validateAdminCustomerOrdersQueryRequest,
  asyncHandler(getAdminCustomerOrdersController),
);
adminCustomerRoutes.patch(
  '/:id/status',
  validateAdminCustomerStatusRequest,
  asyncHandler(updateAdminCustomerStatusController),
);

// Wallet endpoints
adminCustomerRoutes.get('/:id/wallet', asyncHandler(async (req: Request, res: Response) => {
  let wallet = await Wallet.findOne({ customer: req.params.id });
  if (!wallet) {
    wallet = await Wallet.create({ customer: req.params.id, balance: 0 });
  }
  res.status(HTTP_STATUS.OK).json({ success: true, wallet });
}));

adminCustomerRoutes.get('/:id/wallet/transactions', asyncHandler(async (req: Request, res: Response) => {
  const transactions = await WalletTransaction.find({ customer: req.params.id }).sort({ createdAt: -1 });
  res.status(HTTP_STATUS.OK).json({ success: true, transactions });
}));

adminCustomerRoutes.post('/:id/wallet/credits', asyncHandler(async (req: Request, res: Response) => {
  const { amount, direction, transactionType, reason } = req.body;
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Amount must be a positive integer in paise.' });
    return;
  }
  if (!['CREDIT', 'DEBIT'].includes(direction)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid transaction direction.' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let resultTx;
    await session.withTransaction(async () => {
      let wallet = await Wallet.findOne({ customer: req.params.id }).session(session);
      if (!wallet) {
        wallet = await Wallet.create([{ customer: req.params.id, balance: 0 }], { session }).then(res => res[0]);
      }

      const balanceBefore = wallet.balance;
      if (direction === 'CREDIT') {
        wallet.balance += amount;
      } else {
        if (wallet.balance < amount) {
          throw new Error('Insufficient wallet balance.');
        }
        wallet.balance -= amount;
      }

      await wallet.save({ session });

      const tx = await WalletTransaction.create([{
        customer: req.params.id,
        wallet: wallet._id,
        direction,
        transactionType: transactionType || 'ADMIN_ADJUSTMENT',
        amount,
        idempotencyKey: `wallet-credit-${req.params.id}-${Date.now()}`,
        adminReason: reason || 'Admin wallet adjustment',
        balanceBefore,
        balanceAfter: wallet.balance,
      }], { session }).then(res => res[0]);

      // Audit trail
      await CatalogAudit.create([{
        actor: req.user!.id,
        role: req.user!.role,
        action: 'WALLET_ADJUSTMENT',
        entityType: 'CUSTOMER',
        entityId: req.params.id,
        reason: reason || 'Admin wallet adjustment',
        afterValue: tx,
      }], { session });

      resultTx = tx;
    });

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

adminCustomerRoutes.post('/:id/wallet/transactions/:transactionId/reverse', asyncHandler(async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let resultTx;
    await session.withTransaction(async () => {
      const origTx = await WalletTransaction.findById(req.params.transactionId).session(session);
      if (!origTx) {
        throw new Error('Original transaction not found.');
      }
      if (origTx.isReversed) {
        throw new Error('Transaction is already reversed.');
      }

      let wallet = await Wallet.findById(origTx.wallet).session(session);
      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      const balanceBefore = wallet.balance;
      const reverseDirection = origTx.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';

      if (reverseDirection === 'DEBIT') {
        if (wallet.balance < origTx.amount) {
          throw new Error('Insufficient balance to reverse credit transaction.');
        }
        wallet.balance -= origTx.amount;
      } else {
        wallet.balance += origTx.amount;
      }

      await wallet.save({ session });

      origTx.isReversed = true;
      origTx.reversedAt = new Date();
      await origTx.save({ session });

      const tx = await WalletTransaction.create([{
        customer: origTx.customer,
        wallet: wallet._id,
        direction: reverseDirection,
        transactionType: 'REVERSAL',
        amount: origTx.amount,
        idempotencyKey: `wallet-reverse-${req.params.transactionId}-${Date.now()}`,
        adminReason: `Reversal of transaction #${req.params.transactionId}`,
        balanceBefore,
        balanceAfter: wallet.balance,
      }], { session }).then(res => res[0]);

      // Audit trail
      await CatalogAudit.create([{
        actor: req.user!.id,
        role: req.user!.role,
        action: 'WALLET_REVERSAL',
        entityType: 'CUSTOMER',
        entityId: origTx.customer,
        reason: `Reversal of transaction #${req.params.transactionId}`,
        afterValue: tx,
      }], { session });

      resultTx = tx;
    });

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

// Block / Unblock customer
adminCustomerRoutes.post('/:id/block', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason is required to block a customer.' });
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Customer not found.' });
    return;
  }

  user.status = 'BLOCKED';
  user.isActive = false;
  user.refreshToken = ''; // Revoke refresh session tokens
  if (!user.securityHistory) {
    user.securityHistory = [];
  }
  user.securityHistory.push({
    action: 'BLOCKED',
    reason,
    actorId: new mongoose.Types.ObjectId(req.user!.id),
    timestamp: new Date(),
  });

  await user.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CUSTOMER_BLOCKED',
    entityType: 'CUSTOMER',
    entityId: user._id,
    reason,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Customer blocked successfully.', user });
}));

adminCustomerRoutes.post('/:id/unblock', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Customer not found.' });
    return;
  }

  user.status = 'ACTIVE';
  user.isActive = true;
  if (!user.securityHistory) {
    user.securityHistory = [];
  }
  user.securityHistory.push({
    action: 'UNBLOCKED',
    reason: 'Unblocked by Admin',
    actorId: new mongoose.Types.ObjectId(req.user!.id),
    timestamp: new Date(),
  });

  await user.save();

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: 'CUSTOMER_UNBLOCKED',
    entityType: 'CUSTOMER',
    entityId: user._id,
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Customer unblocked successfully.', user });
}));

adminCustomerRoutes.get('/:id/security-history', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('securityHistory');
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Customer not found.' });
    return;
  }
  res.status(HTTP_STATUS.OK).json({ success: true, securityHistory: user.securityHistory || [] });
}));

adminCustomerRoutes.get('/:id/audit', asyncHandler(async (req: Request, res: Response) => {
  const logs = await CatalogAudit.find({ entityId: req.params.id }).sort({ timestamp: -1 });
  res.status(HTTP_STATUS.OK).json({ success: true, logs });
}));

// Risk Signals Endpoint
adminCustomerRoutes.get('/:id/risk-signals', asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.params.id;
  const [orders, refundCount] = await Promise.all([
    Order.find({ user: customerId }).select('status paymentMethod grandTotal').lean(),
    Refund.countDocuments({ customer: customerId }),
  ]);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
  const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0.0';

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      cancellationRate: `${cancellationRate}%`,
      refundCount,
    },
  });
}));

// Wallet Adjustments (Alias)
adminCustomerRoutes.post('/:id/wallet/adjustments', asyncHandler(async (req: Request, res: Response) => {
  const { amount, direction, transactionType, reason, note, idempotencyKey } = req.body;
  if (!amount || amount <= 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Amount must be a positive integer in paise or rupees.' });
    return;
  }
  const amountPaise = Number.isInteger(amount) ? amount : Math.round(amount * 100);

  const session = await mongoose.startSession();
  try {
    let resultTx;
    await session.withTransaction(async () => {
      let wallet = await Wallet.findOne({ customer: req.params.id }).session(session);
      if (!wallet) {
        wallet = await Wallet.create([{ customer: req.params.id, balance: 0 }], { session }).then(res => res[0]);
      }

      const balanceBefore = wallet.balance;
      if (direction === 'CREDIT') {
        wallet.balance += amountPaise;
      } else {
        if (wallet.balance < amountPaise) {
          throw new Error('Insufficient wallet balance.');
        }
        wallet.balance -= amountPaise;
      }

      await wallet.save({ session });

      const tx = await WalletTransaction.create([{
        customer: req.params.id,
        wallet: wallet._id,
        direction,
        transactionType: transactionType || (direction === 'CREDIT' ? 'PROMOTIONAL_CREDIT' : 'ADMIN_CORRECTION'),
        amount: amountPaise,
        idempotencyKey: idempotencyKey || `wallet-adj-${req.params.id}-${Date.now()}`,
        adminReason: reason || note || 'Admin wallet adjustment',
        actor: req.user!.id,
        balanceBefore,
        balanceAfter: wallet.balance,
      }], { session }).then(res => res[0]);

      await CatalogAudit.create([{
        actor: req.user!.id,
        role: req.user!.role,
        action: 'WALLET_ADJUSTMENT',
        entityType: 'CUSTOMER',
        entityId: req.params.id,
        reason: reason || note || 'Admin adjustment',
        afterValue: tx,
      }], { session });

      resultTx = tx;
    });

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

// Customer Restrictions Endpoints
adminCustomerRoutes.get('/:id/restrictions', asyncHandler(async (req: Request, res: Response) => {
  const restrictions = await CustomerRestriction.find({
    customer: req.params.id,
    active: true,
  }).sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json({ success: true, restrictions });
}));

adminCustomerRoutes.post('/:id/restrictions', asyncHandler(async (req: Request, res: Response) => {
  const { restrictionType, reasonCode, note, expiresAt } = req.body;
  if (!['ACCOUNT_BLOCKED', 'ORDERING_BLOCKED', 'COD_DISABLED'].includes(restrictionType)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid restriction type.' });
    return;
  }
  if (!reasonCode) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason code is required.' });
    return;
  }

  // Deactivate any existing active restriction of the same type
  await CustomerRestriction.updateMany(
    { customer: req.params.id, restrictionType, active: true },
    { active: false, removedAt: new Date(), removalReason: 'Superseded by new restriction' },
  );

  const restriction = await CustomerRestriction.create({
    customer: req.params.id,
    restrictionType,
    reasonCode,
    note: note || '',
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: req.user!.id,
    active: true,
  });

  // If ACCOUNT_BLOCKED, revoke user session and mark status
  if (restrictionType === 'ACCOUNT_BLOCKED') {
    await User.findByIdAndUpdate(req.params.id, {
      status: 'BLOCKED',
      isActive: false,
      refreshToken: '',
    });
  }

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: `CUSTOMER_RESTRICTION_${restrictionType}`,
    entityType: 'CUSTOMER',
    entityId: req.params.id,
    reason: `${reasonCode}: ${note}`,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, restriction });
}));

adminCustomerRoutes.delete('/:id/restrictions/:restrictionId', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const restriction = await CustomerRestriction.findOne({
    _id: req.params.restrictionId,
    customer: req.params.id,
    active: true,
  });

  if (!restriction) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Active restriction not found.' });
    return;
  }

  restriction.active = false;
  restriction.removedAt = new Date();
  restriction.removedBy = new mongoose.Types.ObjectId(req.user!.id);
  restriction.removalReason = reason || 'Removed by Admin';
  await restriction.save();

  // If ACCOUNT_BLOCKED was removed and no other account block exists, restore user status
  if (restriction.restrictionType === 'ACCOUNT_BLOCKED') {
    const hasOtherAccountBlock = await CustomerRestriction.exists({
      customer: req.params.id,
      restrictionType: 'ACCOUNT_BLOCKED',
      active: true,
    });
    if (!hasOtherAccountBlock) {
      await User.findByIdAndUpdate(req.params.id, {
        status: 'ACTIVE',
        isActive: true,
      });
    }
  }

  await CatalogAudit.create({
    actor: req.user!.id,
    role: req.user!.role,
    action: `CUSTOMER_RESTRICTION_REMOVED_${restriction.restrictionType}`,
    entityType: 'CUSTOMER',
    entityId: req.params.id,
    reason: reason || 'Removed by Admin',
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Restriction removed.', restriction });
}));

adminCustomerRoutes.get('/:id/restrictions/history', asyncHandler(async (req: Request, res: Response) => {
  const history = await CustomerRestriction.find({ customer: req.params.id })
    .populate('createdBy', 'firstName lastName')
    .populate('removedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json({ success: true, history });
}));
