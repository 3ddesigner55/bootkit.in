import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { globalSearch } from '../services/search.service';
import type { SearchQuery } from '../validators/search.validator';
import { sendSuccess } from '../utils/apiResponse';

export async function globalSearchController(
  request: Request,
  response: Response,
) {
  void request;
  const results = await globalSearch(
    response.locals.searchQuery as SearchQuery,
  );

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    results,
    'Search results retrieved successfully.',
  );
}
