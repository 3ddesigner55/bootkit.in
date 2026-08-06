import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../services/category.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  validateCategoryCreate,
  validateCategoryUpdate,
} from '../validators/category.validator';

function getCategoryId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getCategoriesController(
  request: Request,
  response: Response,
) {
  void request;
  const categories = await getCategories();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    categories,
    'Categories retrieved successfully.',
  );
}

export async function getCategoryController(
  request: Request,
  response: Response,
) {
  const category = await getCategoryById(getCategoryId(request));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    category,
    'Category retrieved successfully.',
  );
}

export async function createCategoryController(
  request: Request,
  response: Response,
) {
  const category = await createCategory(
    validateCategoryCreate(request.body),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    category,
    'Category created successfully.',
  );
}

export async function updateCategoryController(
  request: Request,
  response: Response,
) {
  const category = await updateCategory(
    getCategoryId(request),
    validateCategoryUpdate(request.body),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    category,
    'Category updated successfully.',
  );
}

export async function deleteCategoryController(
  request: Request,
  response: Response,
) {
  const category = await deleteCategory(
    getCategoryId(request),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    category,
    'Category deleted successfully.',
  );
}
