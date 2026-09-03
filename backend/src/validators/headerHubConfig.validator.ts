import type { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';

import {
  HEADER_HUB_SLUGS,
  type HeaderHubSlug,
} from '../models/headerHubConfig.model';

export type HeaderHubConfigInput = {
  categoryIds: string[];
  productIds: string[];
  brandIds: string[];
  bannerIds: string[];
};

function validationError(message: string) {
  return Object.assign(new Error(message), {
    statusCode: 400,
  });
}

function getIdArray(
  input: Record<string, unknown>,
  field: keyof HeaderHubConfigInput,
  maximumItems: number,
): string[] {
  const value = input[field];

  if (!Array.isArray(value)) {
    throw validationError(`${field} must be an array.`);
  }

  if (value.length > maximumItems) {
    throw validationError(
      `${field} cannot contain more than ${maximumItems} items.`,
    );
  }

  const ids = value.map((item, index) => {
    if (
      typeof item !== 'string' ||
      !isValidObjectId(item)
    ) {
      throw validationError(
        `${field} item ${index + 1} is invalid.`,
      );
    }

    return item;
  });

  if (new Set(ids).size !== ids.length) {
    throw validationError(
      `${field} cannot contain duplicate IDs.`,
    );
  }

  return ids;
}

export const validateHeaderHubParam: RequestHandler = (
  request,
  response,
  next,
) => {
  try {
    const rawHub = request.params.hub;
    const hubValue = Array.isArray(rawHub)
      ? rawHub[0]
      : rawHub;

    const hub =
      typeof hubValue === 'string'
        ? hubValue.trim().toLowerCase()
        : '';

    if (
      !HEADER_HUB_SLUGS.includes(
        hub as HeaderHubSlug,
      )
    ) {
      throw validationError(
        `Header hub must be one of: ${HEADER_HUB_SLUGS.join(', ')}.`,
      );
    }

    response.locals.headerHub = hub as HeaderHubSlug;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateHeaderHubConfigUpdateRequest: RequestHandler = (
  request,
  response,
  next,
) => {
  try {
    if (
      !request.body ||
      typeof request.body !== 'object' ||
      Array.isArray(request.body)
    ) {
      throw validationError(
        'Header hub configuration body is invalid.',
      );
    }

    const input = request.body as Record<string, unknown>;

    response.locals.headerHubConfigInput = {
      categoryIds: getIdArray(
        input,
        'categoryIds',
        300,
      ),
      productIds: getIdArray(
        input,
        'productIds',
        500,
      ),
      brandIds: getIdArray(
        input,
        'brandIds',
        100,
      ),
      bannerIds: getIdArray(
        input,
        'bannerIds',
        50,
      ),
    } satisfies HeaderHubConfigInput;

    next();
  } catch (error) {
    next(error);
  }
};