import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createStore,
  deleteStore,
  getStoreById,
  getStoreBySlug,
  getStores,
  updateStore,
} from '../services/store.service';
import { sendSuccess } from '../utils/apiResponse';
import type { StoreListQuery } from '../validators/store.validator';

function getParameter(request: Request, parameter: string): string {
  const value = request.params[parameter];

  return Array.isArray(value) ? '' : value;
}

export async function getStoresController(
  request: Request,
  response: Response,
) {
  void request;
  const stores = await getStores(
    response.locals.storeListQuery as StoreListQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    stores,
    'Stores retrieved successfully.',
  );
}

export async function getStoreController(request: Request, response: Response) {
  const store = await getStoreById(getParameter(request, 'id'));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    store,
    'Store retrieved successfully.',
  );
}

export async function getStoreBySlugController(
  request: Request,
  response: Response,
) {
  const store = await getStoreBySlug(getParameter(request, 'slug'));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    store,
    'Store retrieved successfully.',
  );
}

export async function createStoreController(
  request: Request,
  response: Response,
) {
  const store = await createStore(request.body, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    store,
    'Store created successfully.',
  );
}

export async function updateStoreController(
  request: Request,
  response: Response,
) {
  const store = await updateStore(
    getParameter(request, 'id'),
    request.body,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    store,
    'Store updated successfully.',
  );
}

export async function deleteStoreController(
  request: Request,
  response: Response,
) {
  const store = await deleteStore(
    getParameter(request, 'id'),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    store,
    'Store deleted successfully.',
  );
}
