import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  cancelOrder,
  confirmCodOrder,
  placeOrder,
} from '../services/order.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  CancelOrderInput,
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
