import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getAdminOrderByOrderNumber,
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/adminOrder.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  AdminOrderListQuery,
  AdminOrderStatusInput,
} from '../validators/adminOrder.validator';

function getOrderNumber(request: Request): string {
  return Array.isArray(request.params.orderNumber)
    ? ''
    : request.params.orderNumber;
}

export async function getAdminOrdersController(
  request: Request,
  response: Response,
) {
  void request;
  const orders = await getAdminOrders(
    response.locals.adminOrderListQuery as AdminOrderListQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    orders,
    'Orders retrieved successfully.',
  );
}

export async function getAdminOrderController(
  request: Request,
  response: Response,
) {
  const order = await getAdminOrderByOrderNumber(getOrderNumber(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    order,
    'Order retrieved successfully.',
  );
}

export async function updateAdminOrderStatusController(
  request: Request,
  response: Response,
) {
  const order = await updateAdminOrderStatus(
    getOrderNumber(request),
    response.locals.adminOrderStatus as AdminOrderStatusInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    order,
    'Order status updated successfully.',
  );
}
