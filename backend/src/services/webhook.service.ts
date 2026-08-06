import { createHmac, timingSafeEqual } from 'node:crypto';

import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import {
  sendNotificationAsync,
  sendPaymentFailedEmail,
  sendPaymentSuccessEmail,
} from './notification.service';

type RazorpayPaymentPayload = {
  id?: string;
  order_id?: string;
  error_description?: string;
  error_reason?: string;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentPayload;
    };
  };
};

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function getWebhookSecret(): string {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw serviceError(
      'Razorpay webhook configuration is unavailable.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return webhookSecret;
}

function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expectedSignature = createHmac('sha256', getWebhookSecret())
    .update(rawBody)
    .digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function getWebhookPayload(rawBody: Buffer): RazorpayWebhookPayload {
  try {
    return JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload;
  } catch {
    throw serviceError(
      'Invalid Razorpay webhook payload.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

function getPaymentPayload(
  payload: RazorpayWebhookPayload,
): Required<RazorpayPaymentPayload> {
  const payment = payload.payload?.payment?.entity;

  if (!payment?.id || !payment.order_id) {
    throw serviceError(
      'Invalid Razorpay payment payload.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return {
    id: payment.id,
    order_id: payment.order_id,
    error_description: payment.error_description ?? '',
    error_reason: payment.error_reason ?? '',
  };
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
    'payment_success_webhook',
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
    'payment_failed_webhook',
  );
}

export async function processRazorpayWebhook(
  rawBody: Buffer,
  signature: string,
) {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw serviceError(
      'Invalid Razorpay webhook signature.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const payload = getWebhookPayload(rawBody);

  if (
    payload.event !== 'payment.captured' &&
    payload.event !== 'payment.failed'
  ) {
    return { ignored: true };
  }

  const payment = getPaymentPayload(payload);
  const order = await Order.findOne({ razorpayOrderId: payment.order_id });

  if (!order) {
    return { ignored: true };
  }

  if (payload.event === 'payment.captured') {
    if (order.paymentStatus === 'PAID') {
      return { ignored: true };
    }

    order.paymentStatus = 'PAID';
    order.razorpayPaymentId = payment.id;
    order.paymentCompletedAt = new Date();
    await order.save();
    notifyPaymentSuccess(order.user.toString(), order.orderNumber, payment.id);

    return { ignored: false, orderNumber: order.orderNumber };
  }

  if (
    order.paymentStatus === 'FAILED' &&
    order.razorpayPaymentId === payment.id
  ) {
    return { ignored: true };
  }

  if (order.paymentStatus === 'PAID') {
    return { ignored: true };
  }

  order.paymentStatus = 'FAILED';
  order.razorpayPaymentId = payment.id;
  order.paymentFailedAt = new Date();
  order.paymentFailureReason =
    payment.error_description ||
    payment.error_reason ||
    'Razorpay payment failed.';
  await order.save();
  notifyPaymentFailure(
    order.user.toString(),
    order.orderNumber,
    order.paymentFailureReason,
  );

  return { ignored: false, orderNumber: order.orderNumber };
}
