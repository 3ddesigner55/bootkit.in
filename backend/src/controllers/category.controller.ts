import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategoryOptions,
  getCategories,
  getCategoryById,
  getCategoryTree,
  getCategoryBySlug,
  getCategoryProducts,
  uploadCategoryImages,
  updateCategory,
  reorderCategories,
} from '../services/category.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateAdminCategoryListQuery,
} from '../validators/category.validator';

function getCategoryId(request: Request): string {
  return Array.isArray(request.params.id) ? '' : request.params.id;
}

export async function getCategoryTreeController(
  _request: Request,
  response: Response,
) {
  const tree = await getCategoryTree();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    tree,
    'Category tree retrieved successfully.',
  );
}

export async function getCategoryBySlugController(
  request: Request,
  response: Response,
) {
  const slug = Array.isArray(request.params.slug) ? request.params.slug[0] : request.params.slug;
  const category = await getCategoryBySlug(slug);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    category,
    'Category retrieved successfully.',
  );
}

export async function getCategoryProductsController(
  request: Request,
  response: Response,
) {
  const slug = Array.isArray(request.params.slug) ? request.params.slug[0] : request.params.slug;
  const result = await getCategoryProducts(slug, request.query as any);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Category products retrieved successfully.',
  );
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


export async function getAdminCategoriesController(
  request: Request,
  response: Response,
) {
  const categories = await getAdminCategories(
    validateAdminCategoryListQuery(request.query),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    categories,
    'Admin categories retrieved successfully.',
  );
}

export async function getCategoryOptionsController(
  _request: Request,
  response: Response,
) {
  const categories = await getCategoryOptions();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    categories,
    'Category options retrieved successfully.',
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

export async function uploadCategoryImagesController(
  request: Request,
  response: Response,
) {
  const uploadedFiles = request.files;
  const files = Array.isArray(uploadedFiles) ? undefined : uploadedFiles;
  const images = await uploadCategoryImages({
    image: files?.image?.[0],
    banner: files?.banner?.[0],
  });

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    images,
    'Category images uploaded successfully.',
  );
}

export async function reorderCategoriesController(
  request: Request,
  response: Response,
) {
  const { items } = request.body;
  if (!items || !Array.isArray(items)) {
    throw Object.assign(new Error('Invalid request payload: items array is required.'), {
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  await reorderCategories(items, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    null,
    'Categories reordered successfully.',
  );
}
