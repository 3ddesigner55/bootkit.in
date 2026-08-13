import { HTTP_STATUS } from '../constants/httpStatus';
import type { CategoryHomeLayout } from '../models/category.model';
import type { ApiError } from '../types/api';

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  background?: string;
  image?: string;
  banner?: string;
  featured?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  displayOrder?: number;
  sortOrder?: number;
  homeLayout?: CategoryHomeLayout;
  collectionHub?: string | null;
  homeSection?: string | null;
  parentCategory?: string | null;
};

export type CategoryUpdateInput = Partial<CategoryInput>;

export type AdminCategoryListQuery = {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  featured?: boolean;
  sortField: 'displayOrder' | 'sortOrder' | 'name' | 'createdAt';
  sortDirection: 1 | -1;
};

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

function getOptionalCollectionHub(
  input: Record<string, unknown>,
): string | null | undefined {
  const value = input.collectionHub;

  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError('collectionHub must be a string or null.');
  }

  const allowedHubs = [
    'beauty',
    'electronics',
    'pharmacy',
    'decor',
    'kids',
    'gifting',
  ];
  const normalizedValue = value.trim().toLowerCase();

  if (!allowedHubs.includes(normalizedValue)) {
    throw validationError(
      `collectionHub must be one of: ${allowedHubs.join(', ')}.`,
    );
  }

  return normalizedValue;
}

function getOptionalHomeSection(
  _input: Record<string, unknown>,
): string | null | undefined {
  // Legacy writes disabled in Phase 2.1: Category master does not manage home merchandising.
  // HomeBuilder (/api/admin/home-config) is the exclusive writer for merchandising configurations.
  return undefined;
}


function getOptionalParentCategory(
  input: Record<string, unknown>,
): string | null | undefined {
  const value = input.parentCategory;

  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError('parentCategory must be a valid ID string or null.');
  }

  return value.trim();
}

function getOptionalFields(
  input: Record<string, unknown>,
): CategoryUpdateInput {
  return {
    ...(getOptionalString(input, 'description') !== undefined
      ? { description: getOptionalString(input, 'description') }
      : {}),
    ...(getOptionalString(input, 'icon') !== undefined
      ? { icon: getOptionalString(input, 'icon') }
      : {}),
    ...(getOptionalString(input, 'background') !== undefined
      ? { background: getOptionalString(input, 'background') }
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
    ...(getOptionalCollectionHub(input) !== undefined
      ? { collectionHub: getOptionalCollectionHub(input) }
      : {}),
    ...(getOptionalHomeSection(input) !== undefined
      ? { homeSection: getOptionalHomeSection(input) }
      : {}),
    ...(getOptionalParentCategory(input) !== undefined
      ? { parentCategory: getOptionalParentCategory(input) }
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

function getQueryValue(
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

function getQueryNumber(
  input: Record<string, unknown>,
  field: string,
  defaultValue: number,
  maximum: number,
): number {
  const value = getQueryValue(input, field);

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > maximum
  ) {
    throw validationError(
      `${field} must be an integer between 1 and ${maximum}.`,
    );
  }

  return parsedValue;
}

function getQueryBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = getQueryValue(input, field);

  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw validationError(`${field} must be true or false.`);
}

export function validateAdminCategoryListQuery(
  input: unknown,
): AdminCategoryListQuery {
  const query = getObject(input);
  const search = getQueryValue(query, 'search');
  const sort = getQueryValue(query, 'sort') || 'displayOrder';
  const isDescending = sort.startsWith('-');
  const sortField = isDescending ? sort.slice(1) : sort;

  if (!['displayOrder', 'sortOrder', 'name', 'createdAt'].includes(sortField)) {
    throw validationError(
      'sort must be displayOrder, sortOrder, name, or createdAt. Prefix with - for descending order.',
    );
  }

  return {
    page: getQueryNumber(query, 'page', 1, Number.MAX_SAFE_INTEGER),
    limit: getQueryNumber(query, 'limit', 20, 1000),
    ...(search ? { search } : {}),
    ...(getQueryBoolean(query, 'active') !== undefined
      ? { active: getQueryBoolean(query, 'active') }
      : {}),
    ...(getQueryBoolean(query, 'featured') !== undefined
      ? { featured: getQueryBoolean(query, 'featured') }
      : {}),
    sortField: sortField as AdminCategoryListQuery['sortField'],
    sortDirection: isDescending ? -1 : 1,
  };
}
