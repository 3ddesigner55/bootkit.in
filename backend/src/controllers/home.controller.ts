import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getHomeData } from '../services/home.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getHomeController(request: Request, response: Response) {
  const storeId = request.query.storeId as string | undefined;
  const city = request.query.city as string | undefined;
  const homeData = await getHomeData(storeId, city);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    homeData,
    'Home data retrieved successfully.',
  );
}

