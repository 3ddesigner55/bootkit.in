import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import HeroBanner from '../models/heroBanner.model';
import type { ApiError } from '../types/api';
import type {
  HeroBannerInput,
  HeroBannerUpdateInput,
} from '../validators/heroBanner.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateHeroBannerId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Hero banner not found.', HTTP_STATUS.NOT_FOUND);
  }
}

export async function getPublicHeroBanners() {
  const now = new Date();

  return HeroBanner.find({
    active: true,
    showOnHome: true,
    deletedAt: null,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  })
    .sort({ displayOrder: 1 })
    .lean();
}

export async function getAdminHeroBanners() {
  return HeroBanner.find({ deletedAt: null }).sort({ displayOrder: 1 }).lean();
}

export async function getAdminHeroBannerById(id: string) {
  validateHeroBannerId(id);

  const heroBanner = await HeroBanner.findOne({
    _id: id,
    deletedAt: null,
  }).lean();

  if (!heroBanner) {
    throw serviceError('Hero banner not found.', HTTP_STATUS.NOT_FOUND);
  }

  return heroBanner;
}

export async function createHeroBanner(input: HeroBannerInput, userId: string) {
  return HeroBanner.create({ ...input, createdBy: userId, updatedBy: userId });
}

export async function updateHeroBanner(
  id: string,
  input: HeroBannerUpdateInput,
  userId: string,
) {
  validateHeroBannerId(id);

  const heroBanner = await HeroBanner.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!heroBanner) {
    throw serviceError('Hero banner not found.', HTTP_STATUS.NOT_FOUND);
  }

  return heroBanner;
}

export async function deleteHeroBanner(id: string, userId: string) {
  validateHeroBannerId(id);

  const heroBanner = await HeroBanner.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!heroBanner) {
    throw serviceError('Hero banner not found.', HTTP_STATUS.NOT_FOUND);
  }

  return heroBanner;
}
