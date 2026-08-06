import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrands,
  updateBrand,
} from '../services/brand.service';
import { sendSuccess } from '../utils/apiResponse';

function getBrandId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getBrandsController(
  request: Request,
  response: Response,
) {
  void request;
  const brands = await getBrands();

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
