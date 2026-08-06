import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getCatalogProducts } from '../services/catalog.service';
import type { CatalogQuery } from '../validators/catalog.validator';
import { sendSuccess } from '../utils/apiResponse';

export async function getCatalogProductsController(
  request: Request,
  response: Response,
) {
  void request;
  const catalog = await getCatalogProducts(
    response.locals.catalogQuery as CatalogQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    catalog,
    'Catalog products retrieved successfully.',
  );
}
