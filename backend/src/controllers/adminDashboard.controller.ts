import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getAdminDashboardMetrics } from '../services/adminDashboard.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getAdminDashboardMetricsController(
  request: Request,
  response: Response,
) {
  void request;
  const metrics = await getAdminDashboardMetrics(
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    metrics,
    'Dashboard metrics retrieved successfully.',
  );
}
