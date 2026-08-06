import { razorpayKeyId } from '../config/razorpay';
import razorpay from '../config/razorpay';
import { HTTP_STATUS } from '../constants/httpStatus';
import Order from '../models/order.model';
import type { ApiError } from '../types/api';
import type { RazorpayOrderInput } from '../validators/payment.validator';

const RAZORPAY_CURRENCY = 'INR';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function getPaymentDetails(order: {
  orderNumber: string;
  razorpayOrderId?: string;
  grandTotal: number;
}) {
  return {
    orderNumber: order.orderNumber,
    razorpayOrderId: order.razorpayOrderId,
    amount: Math.round(order.grandTotal * 100),
    currency: RAZORPAY_CURRENCY,
    key: razorpayKeyId,
  };
}

export async function createRazorpayOrder(
  userId: string,
  input: RazorpayOrderInput,
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

  if (order.razorpayOrderId) {
    return getPaymentDetails(order);
  }

  const amount = Math.round(order.grandTotal * 100);

  if (amount < 1) {
    throw serviceError(
      'Order amount must be greater than zero.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const paymentInitiatedAt = new Date();
  const reservedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      razorpayOrderId: { $in: [null, ''] },
      paymentInitiatedAt: null,
    },
    { paymentInitiatedAt },
    { new: true },
  );

  if (!reservedOrder) {
    const existingOrder = await Order.findOne({
      orderNumber: input.orderNumber,
      user: userId,
    });

    if (existingOrder?.razorpayOrderId) {
      return getPaymentDetails(existingOrder);
    }

    throw serviceError(
      'Payment has already been initiated for this order.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: RAZORPAY_CURRENCY,
      receipt: reservedOrder.orderNumber,
    });
    reservedOrder.razorpayOrderId = razorpayOrder.id;
    await reservedOrder.save();

    return getPaymentDetails(reservedOrder);
  } catch {
    await Order.updateOne(
      { _id: reservedOrder._id, razorpayOrderId: { $in: [null, ''] } },
      { paymentInitiatedAt: null },
    );

    throw serviceError(
      'Unable to create Razorpay order.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}
