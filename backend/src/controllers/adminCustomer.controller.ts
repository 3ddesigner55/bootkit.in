import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getAdminCustomerAddresses,
  getAdminCustomerById,
  getAdminCustomerOrders,
  getAdminCustomers,
  updateAdminCustomerStatus,
} from '../services/adminCustomer.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  AdminCustomerListQuery,
  AdminCustomerOrdersQuery,
  AdminCustomerStatusInput,
} from '../validators/adminCustomer.validator';

function getCustomerId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getAdminCustomersController(
  _request: Request,
  response: Response,
) {
  const customers = await getAdminCustomers(
    response.locals.adminCustomerListQuery as AdminCustomerListQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    customers,
    'Customers retrieved successfully.',
  );
}

export async function getAdminCustomerController(
  request: Request,
  response: Response,
) {
  const customer = await getAdminCustomerById(getCustomerId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    customer,
    'Customer retrieved successfully.',
  );
}

export async function getAdminCustomerAddressesController(
  request: Request,
  response: Response,
) {
  const addresses = await getAdminCustomerAddresses(getCustomerId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    addresses,
    'Customer addresses retrieved successfully.',
  );
}

export async function getAdminCustomerOrdersController(
  request: Request,
  response: Response,
) {
  const orders = await getAdminCustomerOrders(
    getCustomerId(request),
    response.locals.adminCustomerOrdersQuery as AdminCustomerOrdersQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    orders,
    'Customer orders retrieved successfully.',
  );
}

export async function updateAdminCustomerStatusController(
  request: Request,
  response: Response,
) {
  const customer = await updateAdminCustomerStatus(
    getCustomerId(request),
    response.locals.adminCustomerStatus as AdminCustomerStatusInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    customer,
    'Customer status updated successfully.',
  );
}
