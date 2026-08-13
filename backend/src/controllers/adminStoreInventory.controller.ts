import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createAdminStoreInventory,
  deleteAdminStoreInventory,
  getAdminStoreInventories,
  getAdminStoreInventoryById,
  updateAdminStoreInventory,
} from '../services/adminStoreInventory.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  AdminStoreInventoryListQuery,
  CreateAdminStoreInventoryInput,
  UpdateAdminStoreInventoryInput,
} from '../validators/adminStoreInventory.validator';

function getInventoryId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getAdminStoreInventoriesController(
  request: Request,
  response: Response,
) {
  const result = await getAdminStoreInventories(
    response.locals.inventoryListQuery as AdminStoreInventoryListQuery,
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Store inventories retrieved successfully.',
  );
}

export async function getAdminStoreInventoryByIdController(
  request: Request,
  response: Response,
) {
  const result = await getAdminStoreInventoryById(
    getInventoryId(request),
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Store inventory retrieved successfully.',
  );
}

export async function createAdminStoreInventoryController(
  request: Request,
  response: Response,
) {
  const result = await createAdminStoreInventory(
    response.locals.createInventory as CreateAdminStoreInventoryInput,
    request.user!.id,
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    result,
    'Store inventory created successfully.',
  );
}

export async function updateAdminStoreInventoryController(
  request: Request,
  response: Response,
) {
  const result = await updateAdminStoreInventory(
    getInventoryId(request),
    response.locals.updateInventory as UpdateAdminStoreInventoryInput,
    request.user!.id,
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Store inventory updated successfully.',
  );
}

export async function deleteAdminStoreInventoryController(
  request: Request,
  response: Response,
) {
  const result = await deleteAdminStoreInventory(
    getInventoryId(request),
    request.user!.id,
    response.locals.allowedStoreIds as string[] | null | undefined,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Store inventory deleted successfully.',
  );
}
