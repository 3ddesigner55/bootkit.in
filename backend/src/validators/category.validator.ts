import { HTTP_STATUS } from '../constants/httpStatus';
import type { CategoryHomeLayout } from '../models/category.model';
import type { ApiError } from '../types/api';

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  banner?: string;
  featured?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  displayOrder?: number;
  sortOrder?: number;
  homeLayout?: CategoryHomeLayout;
};

export type CategoryUpdateInput = Partial<CategoryInput>;

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

function getObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  return input as Record<string, unknown>;
}

function getRequiredString(
  input: Record<string, unknown>,
  field: 'name' | 'slug',
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  return value.trim();
}

function getOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return value.trim();
}

function getOptionalBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean.`);
  }

  return value;
}

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`${field} must be a valid number.`);
  }

  return value;
}

function getOptionalHomeLayout(
  input: Record<string, unknown>,
): CategoryHomeLayout | undefined {
  const value = input.homeLayout;

  if (value === undefined) {
    return undefined;
  }

  if (value !== 'grid' && value !== 'slider') {
    throw validationError('homeLayout must be grid or slider.');
  }

  return value;
}

function getOptionalFields(
  input: Record<string, unknown>,
): CategoryUpdateInput {
  return {
    ...(getOptionalString(input, 'description') !== undefined
      ? { description: getOptionalString(input, 'description') }
      : {}),
    ...(getOptionalString(input, 'image') !== undefined
      ? { image: getOptionalString(input, 'image') }
      : {}),
    ...(getOptionalString(input, 'banner') !== undefined
      ? { banner: getOptionalString(input, 'banner') }
      : {}),
    ...(getOptionalBoolean(input, 'featured') !== undefined
      ? { featured: getOptionalBoolean(input, 'featured') }
      : {}),
    ...(getOptionalBoolean(input, 'active') !== undefined
      ? { active: getOptionalBoolean(input, 'active') }
      : {}),
    ...(getOptionalBoolean(input, 'showOnHome') !== undefined
      ? { showOnHome: getOptionalBoolean(input, 'showOnHome') }
      : {}),
    ...(getOptionalNumber(input, 'displayOrder') !== undefined
      ? { displayOrder: getOptionalNumber(input, 'displayOrder') }
      : {}),
    ...(getOptionalNumber(input, 'sortOrder') !== undefined
      ? { sortOrder: getOptionalNumber(input, 'sortOrder') }
      : {}),
    ...(getOptionalHomeLayout(input) !== undefined
      ? { homeLayout: getOptionalHomeLayout(input) }
      : {}),
  };
}

export function validateCategoryCreate(input: unknown): CategoryInput {
  const body = getObject(input);

  return {
    name: getRequiredString(body, 'name'),
    slug: getRequiredString(body, 'slug').toLowerCase(),
    ...getOptionalFields(body),
  };
}

export function validateCategoryUpdate(input: unknown): CategoryUpdateInput {
  const body = getObject(input);
  const name = getOptionalString(body, 'name');
  const slug = getOptionalString(body, 'slug');

  if (name !== undefined && !name) {
    throw validationError('name cannot be empty.');
  }

  if (slug !== undefined && !slug) {
    throw validationError('slug cannot be empty.');
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(slug !== undefined ? { slug: slug.toLowerCase() } : {}),
    ...getOptionalFields(body),
  };
}
