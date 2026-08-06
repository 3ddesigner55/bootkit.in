import { Router } from 'express';

import {
  createAddressController,
  deleteAddressController,
  getAddressController,
  getAddressesController,
  setDefaultAddressController,
  updateAddressController,
} from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateAddressCreateRequest,
  validateAddressUpdateRequest,
} from '../validators/address.validator';

export const addressRoutes = Router();

addressRoutes.use(authenticate);
addressRoutes.get('/', asyncHandler(getAddressesController));
addressRoutes.get('/:id', asyncHandler(getAddressController));
addressRoutes.post(
  '/',
  validateAddressCreateRequest,
  asyncHandler(createAddressController),
);
addressRoutes.patch(
  '/:id',
  validateAddressUpdateRequest,
  asyncHandler(updateAddressController),
);
addressRoutes.patch('/:id/default', asyncHandler(setDefaultAddressController));
addressRoutes.delete('/:id', asyncHandler(deleteAddressController));
