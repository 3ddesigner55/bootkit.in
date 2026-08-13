import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createHeroBanner,
  deleteHeroBanner,
  getAdminHeroBannerById,
  getAdminHeroBanners,
  getPublicHeroBanners,
  uploadHeroBannerImages,
  updateHeroBanner,
} from '../services/heroBanner.service';
import { sendSuccess } from '../utils/apiResponse';

function getHeroBannerId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getPublicHeroBannersController(
  request: Request,
  response: Response,
) {
  const hub =
    typeof request.query.hub === 'string' ? request.query.hub : undefined;
  const heroBanners = await getPublicHeroBanners(hub);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    heroBanners,
    'Hero banners retrieved successfully.',
  );
}

export async function getAdminHeroBannersController(
  request: Request,
  response: Response,
) {
  void request;
  const heroBanners = await getAdminHeroBanners();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    heroBanners,
    'Hero banners retrieved successfully.',
  );
}

export async function getAdminHeroBannerController(
  request: Request,
  response: Response,
) {
  const heroBanner = await getAdminHeroBannerById(getHeroBannerId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    heroBanner,
    'Hero banner retrieved successfully.',
  );
}

export async function createHeroBannerController(
  request: Request,
  response: Response,
) {
  const heroBanner = await createHeroBanner(request.body, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    heroBanner,
    'Hero banner created successfully.',
  );
}

export async function updateHeroBannerController(
  request: Request,
  response: Response,
) {
  const heroBanner = await updateHeroBanner(
    getHeroBannerId(request),
    request.body,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    heroBanner,
    'Hero banner updated successfully.',
  );
}

export async function deleteHeroBannerController(
  request: Request,
  response: Response,
) {
  const heroBanner = await deleteHeroBanner(
    getHeroBannerId(request),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    heroBanner,
    'Hero banner deleted successfully.',
  );
}

export async function uploadHeroBannerImagesController(
  request: Request,
  response: Response,
) {
  const uploadedFiles = request.files;
  const files = Array.isArray(uploadedFiles) ? undefined : uploadedFiles;
  const images = await uploadHeroBannerImages({
    desktopImage: files?.desktopImage?.[0],
    mobileImage: files?.mobileImage?.[0],
  });

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    images,
    'Hero banner images uploaded successfully.',
  );
}
