import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getCustomersReport,
  getCustomerGrowthReport,
  getOrderStatusesReport,
  getPaymentMethodsReport,
  getSalesReport,
  getStoresReport,
  getTopBrandsReport,
  getTopCategoriesReport,
  getTopProductsReport,
} from '../services/adminReport.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AdminReportQuery } from '../validators/adminReport.validator';

function getQuery(response: Response): AdminReportQuery {
  return response.locals.adminReportQuery as AdminReportQuery;
}

function getAllowedStoreIds(response: Response): string[] | null | undefined {
  return response.locals.allowedStoreIds as string[] | null | undefined;
}

export async function getSalesReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getSalesReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Sales report retrieved successfully.',
  );
}

export async function getTopProductsReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getTopProductsReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Top products report retrieved successfully.',
  );
}

export async function getTopCategoriesReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getTopCategoriesReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Top categories report retrieved successfully.',
  );
}

export async function getTopBrandsReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getTopBrandsReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Top brands report retrieved successfully.',
  );
}

export async function getStoresReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getStoresReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Stores report retrieved successfully.',
  );
}

export async function getCustomersReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getCustomersReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Customers report retrieved successfully.',
  );
}

export async function getCustomerGrowthReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getCustomerGrowthReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Customer growth report retrieved successfully.',
  );
}

export async function getPaymentMethodsReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getPaymentMethodsReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Payment methods report retrieved successfully.',
  );
}

export async function getOrderStatusesReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getOrderStatusesReport(
    getQuery(response),
    getAllowedStoreIds(response),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Order statuses report retrieved successfully.',
  );
}
