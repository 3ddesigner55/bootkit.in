import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getAdminHeaderNavigation,
  getPublicHeaderNavigation,
  updateHeaderNavigation,
  type HeaderNavigationItemInput,
} from '../services/headerNavigation.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getPublicHeaderNavigationController(
  _request: Request,
  response: Response,
) {
  const items = await getPublicHeaderNavigation();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    items,
    'Header navigation retrieved successfully.',
  );
}

export async function getAdminHeaderNavigationController(
  _request: Request,
  response: Response,
) {
  const items = await getAdminHeaderNavigation();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    items,
    'Admin header navigation retrieved successfully.',
  );
}

export async function updateHeaderNavigationController(
  request: Request,
  response: Response,
) {
  const items = response.locals
    .headerNavigationItems as HeaderNavigationItemInput[];

  const updatedItems = await updateHeaderNavigation(
    items,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    updatedItems,
    'Header navigation updated successfully.',
  );
}