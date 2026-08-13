import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Brand from '../models/brand.model';
import type { ApiError } from '../types/api';
import { uploadImage } from '../utils/upload';
import type {
  AdminBrandListQuery,
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

export async function getBrands(hub?: string) {
  const filter: Record<string, unknown> = { active: true, deletedAt: null };
  if (hub) {
    filter.collectionHub = hub.toLowerCase();
  }

  return Brand.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
}

export async function getBrandOptions() {
  const brands = await Brand.find({ active: true, deletedAt: null })
    .sort({ displayOrder: 1, name: 1 })
    .select('_id name')
    .lean();

  return brands.map((brand) => ({
    id: String(brand._id),
    name: brand.name,
  }));
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAdminBrands(query: AdminBrandListQuery) {
  const filter: {
    deletedAt: null;
    active?: boolean;
    featured?: boolean;
    collectionHub?: string;
    $or?: Array<Record<string, { $regex: string; $options: string }>>;
  } = { deletedAt: null };

  if (query.active !== undefined) {
    filter.active = query.active;
  }

  if (query.featured !== undefined) {
    filter.featured = query.featured;
  }

  if (query.hub) {
    filter.collectionHub = query.hub;
  }

  if (query.search) {
    const expression = escapeRegularExpression(query.search);
    const search = { $regex: expression, $options: 'i' };
    filter.$or = [{ name: search }, { slug: search }, { description: search }];
  }

  const [brands, total] = await Promise.all([
    Brand.find(filter)
      .sort({ [query.sortField]: query.sortDirection, _id: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Brand.countDocuments(filter),
  ]);

  return {
    brands,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
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

export async function uploadBrandImages(files: {
  logo?: Express.Multer.File;
  banner?: Express.Multer.File;
}) {
  if (!files.logo && !files.banner) {
    throw serviceError(
      'At least one image file (logo or banner) is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const result: { logo?: string; banner?: string } = {};

  if (files.logo) {
    const uploadResult = await uploadImage(files.logo.buffer, {
      folder: 'bootkit/brands',
    });
    result.logo = uploadResult.secureUrl;
  }

  if (files.banner) {
    const uploadResult = await uploadImage(files.banner.buffer, {
      folder: 'bootkit/brands',
    });
    result.banner = uploadResult.secureUrl;
  }

  return result;
}

export async function uploadBrandLogo(file?: Express.Multer.File) {
  if (!file) {
    throw serviceError(
      'A brand logo file is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const logo = await uploadImage(file.buffer, { folder: 'bootkit/brands' });

  return { logo: logo.secureUrl };
}
