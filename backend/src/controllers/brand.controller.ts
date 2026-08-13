import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createBrand,
  deleteBrand,
  getAdminBrands,
  getBrandOptions,
  getBrandById,
  getBrands,
  uploadBrandImages,
  updateBrand,
} from '../services/brand.service';
import { sendSuccess } from '../utils/apiResponse';
import { validateAdminBrandListQuery } from '../validators/brand.validator';

function getBrandId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getBrandsController(
  request: Request,
  response: Response,
) {
  const hub =
    typeof request.query.hub === 'string' ? request.query.hub : undefined;
  const brands = await getBrands(hub);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brands,
    'Brands retrieved successfully.',
  );
}

export async function getBrandController(request: Request, response: Response) {
  const brand = await getBrandById(getBrandId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brand,
    'Brand retrieved successfully.',
  );
}

export async function getAdminBrandsController(
  request: Request,
  response: Response,
) {
  const brands = await getAdminBrands(
    validateAdminBrandListQuery(request.query),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brands,
    'Admin brands retrieved successfully.',
  );
}

export async function getBrandOptionsController(
  _request: Request,
  response: Response,
) {
  const brands = await getBrandOptions();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brands,
    'Brand options retrieved successfully.',
  );
}

export async function createBrandController(
  request: Request,
  response: Response,
) {
  const brand = await createBrand(request.body, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    brand,
    'Brand created successfully.',
  );
}

export async function updateBrandController(
  request: Request,
  response: Response,
) {
  const brand = await updateBrand(
    getBrandId(request),
    request.body,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brand,
    'Brand updated successfully.',
  );
}

export async function deleteBrandController(
  request: Request,
  response: Response,
) {
  const brand = await deleteBrand(getBrandId(request), request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    brand,
    'Brand deleted successfully.',
  );
}

export async function uploadBrandImagesController(
  request: Request,
  response: Response,
) {
  const uploadedFiles = request.files;
  const files = Array.isArray(uploadedFiles) ? undefined : uploadedFiles;
  const images = await uploadBrandImages({
    logo: files?.logo?.[0] || request.file,
    banner: files?.banner?.[0],
  });

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    images,
    'Brand image(s) uploaded successfully.',
  );
}

export const uploadBrandLogoController = uploadBrandImagesController;
