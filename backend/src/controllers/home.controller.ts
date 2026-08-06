import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getHomeData } from '../services/home.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getHomeController(request: Request, response: Response) {
  void request;
  const homeData = await getHomeData();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    homeData,
    'Home data retrieved successfully.',
  );
}
