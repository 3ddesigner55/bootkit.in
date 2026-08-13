import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import HeroBanner from '../models/heroBanner.model';
import type { ApiError } from '../types/api';
import { uploadImage } from '../utils/upload';
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

export async function getPublicHeroBanners(hub?: string) {
  const now = new Date();

  const filter: Record<string, unknown> = {
    active: true,
    deletedAt: null,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  };

  if (hub) {
    filter.collectionHub = hub.toLowerCase();
  } else {
    filter.showOnHome = true;
    filter.$or = [
      { collectionHub: null },
      { collectionHub: { $exists: false } },
    ];
  }

  return HeroBanner.find(filter).sort({ displayOrder: 1 }).lean();
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
  return HeroBanner.create({
    ...input,
    showOnHome: input.showOnHome ?? true,
    createdBy: userId,
    updatedBy: userId,
  });
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

type HeroBannerUploadFiles = {
  desktopImage?: Express.Multer.File;
  mobileImage?: Express.Multer.File;
};

export async function uploadHeroBannerImages(files: HeroBannerUploadFiles) {
  if (!files.desktopImage && !files.mobileImage) {
    throw serviceError(
      'At least one hero banner image file is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const [desktopImage, mobileImage] = await Promise.all([
    files.desktopImage
      ? uploadImage(files.desktopImage.buffer, {
          folder: 'bootkit/hero-banners',
        })
      : undefined,
    files.mobileImage
      ? uploadImage(files.mobileImage.buffer, {
          folder: 'bootkit/hero-banners',
        })
      : undefined,
  ]);

  return {
    ...(desktopImage ? { desktopImage: desktopImage.secureUrl } : {}),
    ...(mobileImage ? { mobileImage: mobileImage.secureUrl } : {}),
  };
}
