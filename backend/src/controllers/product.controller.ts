import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getProductById,
  getProductBySlug,
  getProducts,
  getLegacyProductsReport,
  uploadProductImages,
  updateProduct,
} from '../services/product.service';
import {
  parseAndValidateCsv,
  executeConfirmImport,
} from '../services/import.service';
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

export async function getAdminProductsController(
  request: Request,
  response: Response,
) {
  const products = await getAdminProducts(
    validateProductListQuery(request.query),
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    products,
    'Admin products retrieved successfully.',
  );
}

export async function getLegacyProductsReportController(
  request: Request,
  response: Response,
) {
  void request;
  const report = await getLegacyProductsReport();

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    report,
    'Legacy products report retrieved successfully.',
  );
}


export async function getProductController(
  request: Request,
  response: Response,
) {
  const storeId =
    typeof request.query.storeId === 'string'
      ? request.query.storeId
      : undefined;
  const product = await getProductById(getParameter(request, 'id'), storeId);

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
  const storeId =
    typeof request.query.storeId === 'string'
      ? request.query.storeId
      : undefined;
  const product = await getProductBySlug(
    getParameter(request, 'slug'),
    storeId,
  );

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

export async function uploadProductImagesController(
  request: Request,
  response: Response,
) {
  const uploadedFiles = request.files;
  const files = Array.isArray(uploadedFiles) ? undefined : uploadedFiles;
  const images = await uploadProductImages({
    thumbnail: files?.thumbnail?.[0],
    gallery: files?.gallery,
  });

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    images,
    'Product images uploaded successfully.',
  );
}

export async function importProductValidateController(
  request: Request,
  response: Response,
) {
  if (!request.file) {
    return sendSuccess(
      response,
      HTTP_STATUS.BAD_REQUEST,
      null,
      'CSV file is required.',
    );
  }

  const results = await parseAndValidateCsv(request.file.buffer);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    results,
    'CSV validated successfully.',
  );
}

export async function importProductConfirmController(
  request: Request,
  response: Response,
) {
  const { products, action } = request.body;

  if (!Array.isArray(products) || !['skip', 'update'].includes(action)) {
    return sendSuccess(
      response,
      HTTP_STATUS.BAD_REQUEST,
      null,
      'Invalid payload.',
    );
  }

  const result = await executeConfirmImport(products, action, request.user!.id);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    result,
    'Products imported successfully.',
  );
}
