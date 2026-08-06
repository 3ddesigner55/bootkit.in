import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '../services/address.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  AddressInput,
  AddressUpdateInput,
} from '../validators/address.validator';

function getAddressId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getAddressesController(
  request: Request,
  response: Response,
) {
  const addresses = await getAddresses(request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    addresses,
    'Addresses retrieved successfully.',
  );
}

export async function getAddressController(
  request: Request,
  response: Response,
) {
  const address = await getAddressById(request.user!.id, getAddressId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    address,
    'Address retrieved successfully.',
  );
}

export async function createAddressController(
  request: Request,
  response: Response,
) {
  const address = await createAddress(
    request.user!.id,
    response.locals.addressCreate as AddressInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    address,
    'Address created successfully.',
  );
}

export async function updateAddressController(
  request: Request,
  response: Response,
) {
  const address = await updateAddress(
    request.user!.id,
    getAddressId(request),
    response.locals.addressUpdate as AddressUpdateInput,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    address,
    'Address updated successfully.',
  );
}

export async function setDefaultAddressController(
  request: Request,
  response: Response,
) {
  const address = await setDefaultAddress(
    request.user!.id,
    getAddressId(request),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    address,
    'Default address updated successfully.',
  );
}

export async function deleteAddressController(
  request: Request,
  response: Response,
) {
  const address = await deleteAddress(request.user!.id, getAddressId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    address,
    'Address deleted successfully.',
  );
}
