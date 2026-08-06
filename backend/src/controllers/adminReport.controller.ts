import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getCustomersReport,
  getSalesReport,
  getStoresReport,
  getTopCategoriesReport,
  getTopProductsReport,
} from '../services/adminReport.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AdminReportQuery } from '../validators/adminReport.validator';

function getQuery(response: Response): AdminReportQuery {
  return response.locals.adminReportQuery as AdminReportQuery;
}

export async function getSalesReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getSalesReport(getQuery(response));

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
  const report = await getTopProductsReport(getQuery(response));

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
  const report = await getTopCategoriesReport(getQuery(response));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Top categories report retrieved successfully.',
  );
}

export async function getStoresReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getStoresReport(getQuery(response));

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
  const report = await getCustomersReport(getQuery(response));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Customers report retrieved successfully.',
  );
}
