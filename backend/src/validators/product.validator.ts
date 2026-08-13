import type { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type ProductVariantInput = {
  name: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight?: string;
  image?: string;
  images?: string[];
  attributes?: Record<string, string>;
  unit: {
    label: string;
    value: string;
  };
  mrp: number;
  price: number;
  stock: number;
  active: boolean;
};

export type ProductInput = {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category: string;
  brand?: string;
  mrp?: number;
  sellingPrice: number;
  costPrice?: number;
  discountPercent?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  minStock?: number;
  trackInventory?: boolean;
  thumbnail?: string;
  gallery?: string[];
  variants?: ProductVariantInput[];
  tags?: string[];
  fallbackIcon?: string;
  featured?: boolean;
  bestseller?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  homeSection?: string;
  displayOrder?: number;
  weight?: number;
  unit?: string;
  deliveryMinutes?: number;
  metaTitle?: string;
  metaDescription?: string;
  attributes?: { label: string; value: string }[];
  highlights?: string[];
  videoUrl?: string;
  ingredients?: string;
  storageInstructions?: string;
  usageInstructions?: string;
  replacementPolicy?: string;
};

export type ProductUpdateInput = Partial<ProductInput>;

export type ProductListQuery = {
  page: number;
  limit: number;
  storeId?: string;
  search?: string;
  category?: string;
  brand?: string;
  hub?: 'beauty' | 'electronics' | 'pharmacy' | 'decor' | 'kids' | 'gifting';
  featured?: boolean;
  bestseller?: boolean;
  showOnHome?: boolean;
  active?: boolean;
  stockStatus?: 'in-stock' | 'out-of-stock' | 'low-stock';
  sort:
    | 'newest'
    | 'oldest'
    | 'price-asc'
    | 'price-desc'
    | 'name-asc'
    | 'name-desc'
    | 'stock-asc'
    | 'stock-desc'
    | 'display-order';
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
  field: 'name' | 'slug' | 'category',
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

function getRequiredNumber(
  input: Record<string, unknown>,
  field: 'sellingPrice' | 'stock',
): number {
  const value = input[field];

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw validationError(
      `${field} is required and must be a non-negative number.`,
    );
  }

  return value;
}

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
  requireNonNegative = true,
): number | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (requireNonNegative && value < 0)
  ) {
    throw validationError(
      `${field} must be a valid${requireNonNegative ? ' non-negative' : ''} number.`,
    );
  }

  return value;
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

function getOptionalGallery(
  input: Record<string, unknown>,
): string[] | undefined {
  const value = input.gallery;

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw validationError('gallery must be an array of strings.');
  }

  return value.map((item) => item.trim());
}

function getRequiredVariantString(
  input: Record<string, unknown>,
  field: string,
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`variants.${field} is required.`);
  }

  return value.trim();
}

function getRequiredVariantNumber(
  input: Record<string, unknown>,
  field: string,
): number {
  const value = input[field];

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw validationError(
      `variants.${field} is required and must be a non-negative number.`,
    );
  }

  return value;
}

function getOptionalStringArray(
  input: Record<string, unknown>,
  field: string,
): string[] | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw validationError(`${field} must be an array of strings.`);
  }

  return value.map((item) => item.trim());
}

function getOptionalAttributes(
  input: Record<string, unknown>,
): Record<string, string> | undefined {
  const value = input.attributes;

  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('variants.attributes must be an object.');
  }

  const attributes = value as Record<string, unknown>;

  if (Object.values(attributes).some((item) => typeof item !== 'string')) {
    throw validationError('variants.attributes values must be strings.');
  }

  const stringAttributes = attributes as Record<string, string>;

  return Object.fromEntries(
    Object.entries(stringAttributes).map(([key, item]) => [key, item.trim()]),
  );
}

function getOptionalVariants(
  input: Record<string, unknown>,
): ProductVariantInput[] | undefined {
  const value = input.variants;

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError('variants must be an array.');
  }

  return value.map((item) => {
    const variant = getObject(item);
    const active = variant.active;

    if (typeof active !== 'boolean') {
      throw validationError(
        'variants.active is required and must be a boolean.',
      );
    }

    const unit = getObject(variant.unit);
    const barcode = getOptionalString(variant, 'barcode');
    const color = getOptionalString(variant, 'color');
    const size = getOptionalString(variant, 'size');
    const weight = getOptionalString(variant, 'weight');
    const image = getOptionalString(variant, 'image');
    const images = getOptionalStringArray(variant, 'images');
    const attributes = getOptionalAttributes(variant);

    return {
      name: getRequiredVariantString(variant, 'name'),
      sku: getRequiredVariantString(variant, 'sku'),
      ...(barcode !== undefined ? { barcode } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(size !== undefined ? { size } : {}),
      ...(weight !== undefined ? { weight } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(images !== undefined ? { images } : {}),
      ...(attributes !== undefined ? { attributes } : {}),
      unit: {
        label: getRequiredVariantString(unit, 'label'),
        value: getRequiredVariantString(unit, 'value'),
      },
      mrp: getRequiredVariantNumber(variant, 'mrp'),
      price: getRequiredVariantNumber(variant, 'price'),
      stock: getRequiredVariantNumber(variant, 'stock'),
      active,
    };
  });
}

function getOptionalAttributesArray(
  input: Record<string, unknown>,
): { label: string; value: string }[] | undefined {
  const value = input.attributes;

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError('attributes must be an array.');
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw validationError('attribute item must be an object.');
    }

    const obj = item as Record<string, unknown>;

    if (typeof obj.label !== 'string' || !obj.label.trim()) {
      throw validationError('attribute label is required.');
    }

    if (typeof obj.value !== 'string' || !obj.value.trim()) {
      throw validationError('attribute value is required.');
    }

    return {
      label: obj.label.trim(),
      value: obj.value.trim(),
    };
  });
}

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<ProductInput, 'name' | 'slug' | 'category' | 'sellingPrice' | 'stock'> {
  const description = getOptionalString(input, 'description');
  const shortDescription = getOptionalString(input, 'shortDescription');
  const brand = getOptionalString(input, 'brand');
  const mrp = getOptionalNumber(input, 'mrp');
  const costPrice = getOptionalNumber(input, 'costPrice');
  const discountPercent = getOptionalNumber(input, 'discountPercent');
  const sku = getOptionalString(input, 'sku');
  const barcode = getOptionalString(input, 'barcode');
  const minStock = getOptionalNumber(input, 'minStock');
  const trackInventory = getOptionalBoolean(input, 'trackInventory');
  const thumbnail = getOptionalString(input, 'thumbnail');
  const gallery = getOptionalGallery(input);
  const variants = getOptionalVariants(input);
  const tags = getOptionalStringArray(input, 'tags');
  const fallbackIcon = getOptionalString(input, 'fallbackIcon');
  const featured = getOptionalBoolean(input, 'featured');
  const bestseller = getOptionalBoolean(input, 'bestseller');
  const active = getOptionalBoolean(input, 'active');
  const showOnHome = getOptionalBoolean(input, 'showOnHome');
  const homeSection = getOptionalString(input, 'homeSection');
  const displayOrder = getOptionalNumber(input, 'displayOrder', false);
  const weight = getOptionalNumber(input, 'weight');
  const unit = getOptionalString(input, 'unit');
  const deliveryMinutes = getOptionalNumber(input, 'deliveryMinutes');
  const metaTitle = getOptionalString(input, 'metaTitle');
  const metaDescription = getOptionalString(input, 'metaDescription');
  const attributes = getOptionalAttributesArray(input);
  const highlights = getOptionalStringArray(input, 'highlights');
  const videoUrl = getOptionalString(input, 'videoUrl');
  const ingredients = getOptionalString(input, 'ingredients');
  const storageInstructions = getOptionalString(input, 'storageInstructions');
  const usageInstructions = getOptionalString(input, 'usageInstructions');
  const replacementPolicy = getOptionalString(input, 'replacementPolicy');

  return {
    ...(description !== undefined ? { description } : {}),
    ...(shortDescription !== undefined ? { shortDescription } : {}),
    ...(brand !== undefined ? { brand } : {}),
    ...(mrp !== undefined ? { mrp } : {}),
    ...(costPrice !== undefined ? { costPrice } : {}),
    ...(discountPercent !== undefined ? { discountPercent } : {}),
    ...(sku !== undefined ? { sku } : {}),
    ...(barcode !== undefined ? { barcode } : {}),
    ...(minStock !== undefined ? { minStock } : {}),
    ...(trackInventory !== undefined ? { trackInventory } : {}),
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(gallery !== undefined ? { gallery } : {}),
    ...(variants !== undefined ? { variants } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(fallbackIcon !== undefined ? { fallbackIcon } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(bestseller !== undefined ? { bestseller } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(showOnHome !== undefined ? { showOnHome } : {}),
    ...(homeSection !== undefined ? { homeSection } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(deliveryMinutes !== undefined ? { deliveryMinutes } : {}),
    ...(metaTitle !== undefined ? { metaTitle } : {}),
    ...(metaDescription !== undefined ? { metaDescription } : {}),
    ...(attributes !== undefined ? { attributes } : {}),
    ...(highlights !== undefined ? { highlights } : {}),
    ...(videoUrl !== undefined ? { videoUrl } : {}),
    ...(ingredients !== undefined ? { ingredients } : {}),
    ...(storageInstructions !== undefined ? { storageInstructions } : {}),
    ...(usageInstructions !== undefined ? { usageInstructions } : {}),
    ...(replacementPolicy !== undefined ? { replacementPolicy } : {}),
  };
}

export function validateProductCreate(input: unknown): ProductInput {
  const body = getObject(input);

  return {
    name: getRequiredString(body, 'name'),
    slug: getRequiredString(body, 'slug').toLowerCase(),
    category: getRequiredString(body, 'category'),
    sellingPrice: getRequiredNumber(body, 'sellingPrice'),
    stock: getRequiredNumber(body, 'stock'),
    ...getOptionalFields(body),
  };
}

export function validateProductUpdate(input: unknown): ProductUpdateInput {
  const body = getObject(input);
  const name = getOptionalString(body, 'name');
  const slug = getOptionalString(body, 'slug');
  const category = getOptionalString(body, 'category');
  const sellingPrice = getOptionalNumber(body, 'sellingPrice');
  const stock = getOptionalNumber(body, 'stock');

  if (name !== undefined && !name) {
    throw validationError('name cannot be empty.');
  }

  if (slug !== undefined && !slug) {
    throw validationError('slug cannot be empty.');
  }

  if (category !== undefined && !category) {
    throw validationError('category cannot be empty.');
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(slug !== undefined ? { slug: slug.toLowerCase() } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(sellingPrice !== undefined ? { sellingPrice } : {}),
    ...(stock !== undefined ? { stock } : {}),
    ...getOptionalFields(body),
  };
}

function getQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return value.trim();
}

function getQueryBoolean(value: unknown, field: string): boolean | undefined {
  const normalized = getQueryString(value, field);

  if (normalized === undefined || normalized === '') {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw validationError(`${field} must be true or false.`);
}

function getQueryPositiveInteger(
  value: unknown,
  field: string,
  defaultValue: number,
): number {
  const normalized = getQueryString(value, field);

  if (normalized === undefined || normalized === '') {
    return defaultValue;
  }

  const numberValue = Number(normalized);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw validationError(`${field} must be a positive integer.`);
  }

  return numberValue;
}

export function validateProductListQuery(input: unknown): ProductListQuery {
  const query = input as Record<string, unknown>;
  const page = getQueryPositiveInteger(query.page, 'page', 1);
  const limit = getQueryPositiveInteger(query.limit, 'limit', 20);

  if (limit > 100) {
    throw validationError('limit cannot be greater than 100.');
  }

  const sortValue = getQueryString(query.sort, 'sort') || 'display-order';
  const validSorts: ProductListQuery['sort'][] = [
    'newest',
    'oldest',
    'price-asc',
    'price-desc',
    'name-asc',
    'name-desc',
    'stock-asc',
    'stock-desc',
    'display-order',
  ];

  if (!validSorts.includes(sortValue as ProductListQuery['sort'])) {
    throw validationError('sort is invalid.');
  }

  const stockStatus = getQueryString(query.stockStatus, 'stockStatus');

  if (
    stockStatus !== undefined &&
    stockStatus !== '' &&
    !['in-stock', 'out-of-stock', 'low-stock'].includes(stockStatus)
  ) {
    throw validationError(
      'stockStatus must be in-stock, out-of-stock, or low-stock.',
    );
  }

  const hub = getQueryString(query.hub, 'hub')?.toLowerCase();
  const validHubs: ProductListQuery['hub'][] = [
    'beauty',
    'electronics',
    'pharmacy',
    'decor',
    'kids',
    'gifting',
  ];

  if (
    hub !== undefined &&
    hub !== '' &&
    !validHubs.includes(hub as ProductListQuery['hub'])
  ) {
    throw validationError(
      'hub must be one of beauty, electronics, pharmacy, decor, kids, or gifting.',
    );
  }

  const storeId = getQueryString(query.storeId, 'storeId');
  if (storeId && !isValidObjectId(storeId)) {
    throw validationError('storeId must be a valid ObjectId.');
  }

  return {
    page,
    limit,
    ...(storeId ? { storeId } : {}),
    ...(getQueryString(query.search, 'search')
      ? { search: getQueryString(query.search, 'search') }
      : {}),
    ...(getQueryString(query.category, 'category')
      ? { category: getQueryString(query.category, 'category') }
      : {}),
    ...(getQueryString(query.brand, 'brand')
      ? { brand: getQueryString(query.brand, 'brand') }
      : {}),
    ...(hub ? { hub: hub as ProductListQuery['hub'] } : {}),
    ...(getQueryBoolean(query.featured, 'featured') !== undefined
      ? { featured: getQueryBoolean(query.featured, 'featured') }
      : {}),
    ...(getQueryBoolean(query.bestseller, 'bestseller') !== undefined
      ? { bestseller: getQueryBoolean(query.bestseller, 'bestseller') }
      : {}),
    ...(getQueryBoolean(query.showOnHome, 'showOnHome') !== undefined
      ? { showOnHome: getQueryBoolean(query.showOnHome, 'showOnHome') }
      : {}),
    ...(getQueryBoolean(query.active, 'active') !== undefined
      ? { active: getQueryBoolean(query.active, 'active') }
      : {}),
    ...(stockStatus
      ? {
          stockStatus: stockStatus as ProductListQuery['stockStatus'],
        }
      : {}),
    sort: sortValue as ProductListQuery['sort'],
  };
}

export function validateProductCreateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateProductCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateProductUpdateRequest(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    request.body = validateProductUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
