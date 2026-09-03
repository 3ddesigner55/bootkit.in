import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { HeaderHubSlug } from '../models/headerHubConfig.model';
import {
  getAdminHeaderHubConfig,
  getPublicHeaderHubContent,
  updateHeaderHubConfig,
} from '../services/headerHubConfig.service';
import { sendSuccess } from '../utils/apiResponse';
import type { HeaderHubConfigInput } from '../validators/headerHubConfig.validator';

export async function getPublicHeaderHubContentController(
  _request: Request,
  response: Response,
) {
  const hub = response.locals.headerHub as HeaderHubSlug;
  const content = await getPublicHeaderHubContent(hub);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    content,
    'Header hub content retrieved successfully.',
  );
}

export async function getAdminHeaderHubConfigController(
  _request: Request,
  response: Response,
) {
  const hub = response.locals.headerHub as HeaderHubSlug;
  const config = await getAdminHeaderHubConfig(hub);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    config,
    'Admin header hub configuration retrieved successfully.',
  );
}

export async function updateHeaderHubConfigController(
  request: Request,
  response: Response,
) {
  const hub = response.locals.headerHub as HeaderHubSlug;

  const input = response.locals
    .headerHubConfigInput as HeaderHubConfigInput;

  const config = await updateHeaderHubConfig(
    hub,
    input,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    config,
    'Header hub configuration updated successfully.',
  );
}