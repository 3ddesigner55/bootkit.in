import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  getProducts,
  updateProduct,
} from '../services/product.service';
import { sendSuccess } from '../utils/apiResponse';
import { validateProductListQuery } from '../validators/product.validator';

function getParameter(request: Request, parameter: string): string {
  const value = request.params[parameter];

  return Array.isArray(value) ? '' : value;
}

export async function getProductsController(
  request: Request,
  response: Response,
) {
  const products = await getProducts(validateProductListQuery(request.query));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    products,
    'Products retrieved successfully.',
  );
}

export async function getProductController(
  request: Request,
  response: Response,
) {
  const product = await getProductById(getParameter(request, 'id'));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    product,
    'Product retrieved successfully.',
  );
}

export async function getProductBySlugController(
  request: Request,
  response: Response,
) {
  const product = await getProductBySlug(getParameter(request, 'slug'));

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    product,
    'Product retrieved successfully.',
  );
}

export async function createProductController(
  request: Request,
  response: Response,
) {
  const product = await createProduct(request.body, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    product,
    'Product created successfully.',
  );
}

export async function updateProductController(
  request: Request,
  response: Response,
) {
  const product = await updateProduct(
    getParameter(request, 'id'),
    request.body,
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    product,
    'Product updated successfully.',
  );
}

export async function deleteProductController(
  request: Request,
  response: Response,
) {
  const product = await deleteProduct(
    getParameter(request, 'id'),
    request.user!.id,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    product,
    'Product deleted successfully.',
  );
}
