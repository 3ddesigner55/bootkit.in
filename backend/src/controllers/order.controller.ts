import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  cancelOrder,
  confirmCodOrder,
  getMyOrders,
  getOrderAgainProducts,
  placeOrder,
} from '../services/order.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  CancelOrderInput,
  MyOrdersQuery,
  PlaceOrderInput,
} from '../validators/order.validator';

function getOrderNumber(request: Request): string {
  return Array.isArray(request.params.orderNumber)
    ? ''
    : request.params.orderNumber;
}

export async function placeOrderController(
  request: Request,
  response: Response,
) {
  const order = await placeOrder(
    request.user!.id,
    response.locals.placeOrder as PlaceOrderInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    order,
    'Order created successfully.',
  );
}

export async function cancelOrderController(
  request: Request,
  response: Response,
) {
  const order = await cancelOrder(
    request.user!.id,
    getOrderNumber(request),
    response.locals.cancelOrder as CancelOrderInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    order,
    'Order cancelled successfully.',
  );
}

export async function confirmCodOrderController(
  request: Request,
  response: Response,
) {
  const order = await confirmCodOrder(
    request.user!.id,
    response.locals.confirmCodOrderNumber as string,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    order,
    'Cash on delivery order confirmed successfully.',
  );
}

export async function getMyOrdersController(
  request: Request,
  response: Response,
) {
  const result = await getMyOrders(
    request.user!.id,
    response.locals.myOrdersQuery as MyOrdersQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Orders retrieved successfully.',
  );
}

export async function getOrderAgainController(
  request: Request,
  response: Response,
) {
  const result = await getOrderAgainProducts(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Order again products retrieved successfully.',
  );
}
