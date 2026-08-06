import { createHmac, timingSafeEqual } from 'node:crypto';

import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type { RazorpayPaymentVerificationInput } from '../validators/paymentVerification.validator';
import {
  sendNotificationAsync,
  sendPaymentFailedEmail,
  sendPaymentSuccessEmail,
} from './notification.service';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function getRazorpayKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw serviceError(
      'Razorpay configuration is unavailable.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return keySecret;
}

function verifyRazorpaySignature(
  input: RazorpayPaymentVerificationInput,
): boolean {
  const expectedSignature = createHmac('sha256', getRazorpayKeySecret())
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(input.razorpaySignature, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function notifyPaymentSuccess(
  userId: string,
  orderNumber: string,
  paymentId: string,
): void {
  sendNotificationAsync(
    (async () => {
      const user = await User.findOne({
        _id: userId,
        isActive: true,
        deletedAt: null,
      })
        .select('email firstName')
        .lean();

      if (!user) {
        return { sent: false, error: 'Notification recipient not found.' };
      }

      return sendPaymentSuccessEmail({
        email: user.email,
        customerName: user.firstName,
        orderNumber,
        paymentId,
      });
    })(),
    'payment_success',
  );
}

function notifyPaymentFailure(
  userId: string,
  orderNumber: string,
  failureReason: string,
): void {
  sendNotificationAsync(
    (async () => {
      const user = await User.findOne({
        _id: userId,
        isActive: true,
        deletedAt: null,
      })
        .select('email firstName')
        .lean();

      if (!user) {
        return { sent: false, error: 'Notification recipient not found.' };
      }

      return sendPaymentFailedEmail({
        email: user.email,
        customerName: user.firstName,
        orderNumber,
        failureReason,
      });
    })(),
    'payment_failed',
  );
}

export async function verifyRazorpayPayment(
  userId: string,
  input: RazorpayPaymentVerificationInput,
) {
  const order = await Order.findOne({
    orderNumber: input.orderNumber,
    user: userId,
  });

  if (!order) {
    throw serviceError('Order not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (order.paymentMethod !== 'RAZORPAY') {
    throw serviceError(
      'This order does not use Razorpay.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (order.paymentStatus !== 'PENDING') {
    throw serviceError(
      'Payment is not pending for this order.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (
    !order.razorpayOrderId ||
    order.razorpayOrderId !== input.razorpayOrderId
  ) {
    throw serviceError(
      'Razorpay order does not match.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!verifyRazorpaySignature(input)) {
    order.paymentStatus = 'FAILED';
    order.paymentFailedAt = new Date();
    order.paymentFailureReason = 'Invalid Razorpay payment signature.';
    await order.save();
    notifyPaymentFailure(userId, order.orderNumber, order.paymentFailureReason);

    throw serviceError(
      'Razorpay signature verification failed.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  order.paymentStatus = 'PAID';
  order.razorpayPaymentId = input.razorpayPaymentId;
  order.razorpaySignature = input.razorpaySignature;
  order.paymentCompletedAt = new Date();
  await order.save();
  notifyPaymentSuccess(userId, order.orderNumber, input.razorpayPaymentId);

  return order;
}
