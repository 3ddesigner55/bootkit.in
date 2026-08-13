import { Router } from 'express';

import { ROLES } from '../constants/roles';
import {
  createHeroBannerController,
  deleteHeroBannerController,
  getAdminHeroBannerController,
  getAdminHeroBannersController,
  getPublicHeroBannersController,
  uploadHeroBannerImagesController,
  updateHeroBannerController,
} from '../controllers/heroBanner.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateHeroBannerCreateRequest,
  validateHeroBannerUpdateRequest,
} from '../validators/heroBanner.validator';

export const heroBannerRoutes = Router();
export const adminHeroBannerRoutes = Router();

heroBannerRoutes.get('/', asyncHandler(getPublicHeroBannersController));

adminHeroBannerRoutes.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(getAdminHeroBannersController),
);
adminHeroBannerRoutes.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(getAdminHeroBannerController),
);
adminHeroBannerRoutes.post(
  '/upload',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.OWNER),
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
  ]),
  asyncHandler(uploadHeroBannerImagesController),
);
adminHeroBannerRoutes.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateHeroBannerCreateRequest,
  asyncHandler(createHeroBannerController),
);
adminHeroBannerRoutes.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validateHeroBannerUpdateRequest,
  asyncHandler(updateHeroBannerController),
);
adminHeroBannerRoutes.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(deleteHeroBannerController),
);
