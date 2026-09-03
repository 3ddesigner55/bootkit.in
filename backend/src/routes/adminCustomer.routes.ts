import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
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
import WalletTransaction, { TRANSACTION_TYPES, TRANSACTION_TYPES_LIST } from '../models/walletTransaction.model';
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

export function generateFingerprint(data: {
  operation: string;
  customer: string;
  amount: number;
  direction: string;
  type: string;
  reason: string;
  referenceId?: string | null;
}): string {
  const payload = JSON.stringify({
    operation: data.operation,
    customer: data.customer,
    amount: data.amount,
    direction: data.direction,
    type: data.type,
    reason: (data.reason || '').trim(),
    referenceId: data.referenceId || null,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

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
  const { amount, direction, transactionType, reason, idempotencyKey } = req.body;
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Amount must be a positive integer in paise.' });
    return;
  }
  if (!['CREDIT', 'DEBIT'].includes(direction)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid transaction direction.' });
    return;
  }

  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key is required and must be a non-empty string.' });
    return;
  }
  const trimmedKey = idempotencyKey.trim();
  if (trimmedKey.length > 100) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key must not exceed 100 characters.' });
    return;
  }

  if (reason !== undefined) {
    if (typeof reason !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason must be a string.' });
      return;
    }
    if (reason.trim().length > 500) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason must not exceed 500 characters.' });
      return;
    }
  }

  if (transactionType && !TRANSACTION_TYPES_LIST.includes(transactionType)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid transaction type.' });
    return;
  }

  if (transactionType) {
    if ([TRANSACTION_TYPES.PROMOTIONAL_CREDIT, TRANSACTION_TYPES.CASHBACK_CREDIT, TRANSACTION_TYPES.REFUND_CREDIT, TRANSACTION_TYPES.DEBIT_REVERSAL].includes(transactionType as any) && direction !== 'CREDIT') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Transaction type must match direction CREDIT.' });
      return;
    }
    if ([TRANSACTION_TYPES.ORDER_DEBIT, TRANSACTION_TYPES.EXPIRY_DEBIT, TRANSACTION_TYPES.CREDIT_REVERSAL].includes(transactionType as any) && direction !== 'DEBIT') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Transaction type must match direction DEBIT.' });
      return;
    }
  }

  const finalType = transactionType || (direction === 'CREDIT' ? TRANSACTION_TYPES.PROMOTIONAL_CREDIT : TRANSACTION_TYPES.ADMIN_CORRECTION);
  const currentFingerprint = generateFingerprint({
    operation: 'credit',
    customer: req.params.id as string,
    amount,
    direction: direction as string,
    type: finalType as string,
    reason: (reason as string) || 'Admin wallet adjustment',
  });

  const session = await mongoose.startSession();
  try {
    let resultTx;
    let isConflict = false;
    let isDuplicate = false;
    await session.withTransaction(async () => {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey }).session(session);
      if (existingTx) {
        if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
          isDuplicate = true;
          resultTx = existingTx;
          return;
        } else {
          isConflict = true;
          return;
        }
      }

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
        transactionType: finalType,
        amount,
        idempotencyKey: trimmedKey,
        adminReason: reason || 'Admin wallet adjustment',
        balanceBefore,
        balanceAfter: wallet.balance,
        requestFingerprint: currentFingerprint,
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

    if (isConflict) {
      res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
      return;
    }
    if (isDuplicate) {
      res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
      return;
    }

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    if (err.code === 11000 && (err.message.includes('idempotencyKey') || JSON.stringify(err).includes('idempotencyKey'))) {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey });
      if (existingTx) {
        if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
          res.status(HTTP_STATUS.OK).json({ success: true, transaction: existingTx });
          return;
        } else {
          res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
          return;
        }
      }
    }
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}));

adminCustomerRoutes.post('/:id/wallet/transactions/:transactionId/reverse', asyncHandler(async (req: Request, res: Response) => {
  const { idempotencyKey } = req.body;

  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key is required and must be a non-empty string.' });
    return;
  }
  const trimmedKey = idempotencyKey.trim();
  if (trimmedKey.length > 100) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key must not exceed 100 characters.' });
    return;
  }

  const origTx = await WalletTransaction.findById(req.params.transactionId);
  if (!origTx) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Original transaction not found.' });
    return;
  }

  const reverseDirection = origTx.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';
  const reverseType = origTx.direction === 'CREDIT' ? TRANSACTION_TYPES.CREDIT_REVERSAL : TRANSACTION_TYPES.DEBIT_REVERSAL;
  const currentFingerprint = generateFingerprint({
    operation: 'reversal',
    customer: origTx.customer.toString(),
    amount: origTx.amount,
    direction: reverseDirection,
    type: reverseType,
    reason: `Reversal of transaction #${req.params.transactionId}`,
    referenceId: origTx._id.toString(),
  });

  const session = await mongoose.startSession();
  try {
    let resultTx;
    let isConflict = false;
    let isDuplicate = false;
    await session.withTransaction(async () => {
      const origTxSession = await WalletTransaction.findById(req.params.transactionId).session(session);
      if (!origTxSession) {
        throw new Error('Original transaction not found.');
      }

      if (origTxSession.customer.toString() !== req.params.id) {
        throw new Error('Transaction customer mismatch.');
      }

      if (origTxSession.reversalOf || [TRANSACTION_TYPES.CREDIT_REVERSAL, TRANSACTION_TYPES.DEBIT_REVERSAL].includes(origTxSession.transactionType as any)) {
        throw new Error('Cannot reverse a reversal transaction.');
      }

      const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey }).session(session);
      if (existingTx) {
        if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
          isDuplicate = true;
          resultTx = existingTx;
          return;
        } else {
          isConflict = true;
          return;
        }
      }

      if (origTxSession.isReversed) {
        throw new Error('Transaction is already reversed.');
      }

      const alreadyReversed = await WalletTransaction.findOne({ reversalOf: origTxSession._id }).session(session);
      if (alreadyReversed) {
        throw new Error('Transaction is already reversed.');
      }

      let wallet = await Wallet.findById(origTxSession.wallet).session(session);
      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      const balanceBefore = wallet.balance;

      if (reverseDirection === 'DEBIT') {
        if (wallet.balance < origTxSession.amount) {
          throw new Error('Insufficient balance to reverse credit transaction.');
        }
        wallet.balance -= origTxSession.amount;
      } else {
        wallet.balance += origTxSession.amount;
      }

      await wallet.save({ session });

      origTxSession.isReversed = true;
      origTxSession.reversedAt = new Date();
      await origTxSession.save({ session });

      const tx = await WalletTransaction.create([{
        customer: origTxSession.customer,
        wallet: wallet._id,
        direction: reverseDirection,
        transactionType: reverseType,
        amount: origTxSession.amount,
        idempotencyKey: trimmedKey,
        adminReason: `Reversal of transaction #${req.params.transactionId}`,
        actor: req.user!.id,
        balanceBefore,
        balanceAfter: wallet.balance,
        reversalOf: origTxSession._id,
        requestFingerprint: currentFingerprint,
      }], { session }).then(res => res[0]);

      // Audit trail
      await CatalogAudit.create([{
        actor: req.user!.id,
        role: req.user!.role,
        action: 'WALLET_REVERSAL',
        entityType: 'CUSTOMER',
        entityId: origTxSession.customer,
        reason: `Reversal of transaction #${req.params.transactionId}`,
        afterValue: tx,
      }], { session });

      resultTx = tx;
    });

    if (isConflict) {
      res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
      return;
    }
    if (isDuplicate) {
      res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
      return;
    }

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    if (err.code === 11000) {
      const errMsg = err.message || JSON.stringify(err);
      if (errMsg.includes('reversalOf')) {
        res.status(409).json({ message: 'Transaction is already reversed.' });
        return;
      }
      if (errMsg.includes('idempotencyKey')) {
        const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey });
        if (existingTx) {
          if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
            res.status(HTTP_STATUS.OK).json({ success: true, transaction: existingTx });
            return;
          } else {
            res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
            return;
          }
        }
      }
    }
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

  if (!['CREDIT', 'DEBIT'].includes(direction)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid transaction direction.' });
    return;
  }

  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key is required and must be a non-empty string.' });
    return;
  }
  const trimmedKey = idempotencyKey.trim();
  if (trimmedKey.length > 100) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Idempotency key must not exceed 100 characters.' });
    return;
  }

  if (reason !== undefined) {
    if (typeof reason !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason must be a string.' });
      return;
    }
    if (reason.trim().length > 500) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Reason must not exceed 500 characters.' });
      return;
    }
  }

  if (note !== undefined) {
    if (typeof note !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Note must be a string.' });
      return;
    }
    if (note.trim().length > 500) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Note must not exceed 500 characters.' });
      return;
    }
  }

  if (transactionType && !TRANSACTION_TYPES_LIST.includes(transactionType)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid transaction type.' });
    return;
  }

  if (transactionType) {
    if ([TRANSACTION_TYPES.PROMOTIONAL_CREDIT, TRANSACTION_TYPES.CASHBACK_CREDIT, TRANSACTION_TYPES.REFUND_CREDIT, TRANSACTION_TYPES.DEBIT_REVERSAL].includes(transactionType as any) && direction !== 'CREDIT') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Transaction type must match direction CREDIT.' });
      return;
    }
    if ([TRANSACTION_TYPES.ORDER_DEBIT, TRANSACTION_TYPES.EXPIRY_DEBIT, TRANSACTION_TYPES.CREDIT_REVERSAL].includes(transactionType as any) && direction !== 'DEBIT') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Transaction type must match direction DEBIT.' });
      return;
    }
  }

  const finalType = transactionType || (direction === 'CREDIT' ? TRANSACTION_TYPES.PROMOTIONAL_CREDIT : TRANSACTION_TYPES.ADMIN_CORRECTION);
  const currentFingerprint = generateFingerprint({
    operation: 'adjustment',
    customer: req.params.id as string,
    amount: amountPaise,
    direction: direction as string,
    type: finalType as string,
    reason: (reason as string) || (note as string) || 'Admin wallet adjustment',
  });

  const session = await mongoose.startSession();
  try {
    let resultTx;
    let isConflict = false;
    let isDuplicate = false;
    await session.withTransaction(async () => {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey }).session(session);
      if (existingTx) {
        if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
          isDuplicate = true;
          resultTx = existingTx;
          return;
        } else {
          isConflict = true;
          return;
        }
      }

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
        transactionType: finalType,
        amount: amountPaise,
        idempotencyKey: trimmedKey,
        adminReason: reason || note || 'Admin wallet adjustment',
        actor: req.user!.id,
        balanceBefore,
        balanceAfter: wallet.balance,
        requestFingerprint: currentFingerprint,
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

    if (isConflict) {
      res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
      return;
    }
    if (isDuplicate) {
      res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
      return;
    }

    res.status(HTTP_STATUS.OK).json({ success: true, transaction: resultTx });
  } catch (err: any) {
    if (err.code === 11000 && (err.message.includes('idempotencyKey') || JSON.stringify(err).includes('idempotencyKey'))) {
      const existingTx = await WalletTransaction.findOne({ idempotencyKey: trimmedKey });
      if (existingTx) {
        if (existingTx.requestFingerprint && existingTx.requestFingerprint === currentFingerprint) {
          res.status(HTTP_STATUS.OK).json({ success: true, transaction: existingTx });
          return;
        } else {
          res.status(409).json({ message: 'Idempotency conflict: A different request was already processed with this key.' });
          return;
        }
      }
    }
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
