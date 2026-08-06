import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Brand from '../models/brand.model';
import type { ApiError } from '../types/api';
import type {
  BrandInput,
  BrandUpdateInput,
} from '../validators/brand.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateBrandId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Brand not found.', HTTP_STATUS.NOT_FOUND);
  }
}

export async function getBrands() {
  return Brand.find({ active: true, deletedAt: null })
    .sort({ displayOrder: 1 })
    .lean();
}

export async function getBrandById(id: string) {
  validateBrandId(id);

  const brand = await Brand.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  }).lean();

  if (!brand) {
    throw serviceError('Brand not found.', HTTP_STATUS.NOT_FOUND);
  }

  return brand;
}

export async function createBrand(input: BrandInput, userId: string) {
  return Brand.create({ ...input, createdBy: userId, updatedBy: userId });
}

export async function updateBrand(
  id: string,
  input: BrandUpdateInput,
  userId: string,
) {
  validateBrandId(id);

  const brand = await Brand.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!brand) {
    throw serviceError('Brand not found.', HTTP_STATUS.NOT_FOUND);
  }

  return brand;
}

export async function deleteBrand(id: string, userId: string) {
  validateBrandId(id);

  const brand = await Brand.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!brand) {
    throw serviceError('Brand not found.', HTTP_STATUS.NOT_FOUND);
  }

  return brand;
}
