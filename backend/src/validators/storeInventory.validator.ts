import { isValidObjectId } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type UpsertStoreInventoryInput = {
  productId: string;
  variantSku?: string;
  stock: number;
  reservedStock?: number;
  sellingPrice: number;
  mrp: number;
  costPrice?: number;
  discountPercent?: number;
  active?: boolean;
  trackInventory?: boolean;
};

export type StoreInventoryListQuery = {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  productId?: string;
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

export function validateUpsertStoreInventory(
  input: unknown,
): UpsertStoreInventoryInput {
  const body = getObject(input);
  const productId = body.productId;

  if (typeof productId !== 'string' || !isValidObjectId(productId.trim())) {
    throw validationError('productId must be a valid ObjectId.');
  }

  const stock = Number(body.stock ?? 0);
  if (!Number.isFinite(stock) || stock < 0) {
    throw validationError('stock must be a non-negative number.');
  }

  const reservedStock = Number(body.reservedStock ?? 0);
  if (!Number.isFinite(reservedStock) || reservedStock < 0) {
    throw validationError('reservedStock must be a non-negative number.');
  }

  if (reservedStock > stock) {
    throw validationError('reservedStock cannot exceed stock.');
  }

  const sellingPrice = Number(body.sellingPrice);
  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    throw validationError('sellingPrice must be a non-negative number.');
  }

  const mrp = Number(body.mrp);
  if (!Number.isFinite(mrp) || mrp < 0) {
    throw validationError('mrp must be a non-negative number.');
  }

  if (mrp > 0 && sellingPrice > mrp) {
    throw validationError('sellingPrice cannot be greater than mrp.');
  }

  const costPrice =
    body.costPrice !== undefined ? Number(body.costPrice) : undefined;
  if (
    costPrice !== undefined &&
    (!Number.isFinite(costPrice) || costPrice < 0)
  ) {
    throw validationError('costPrice must be a non-negative number.');
  }

  let discountPercent =
    body.discountPercent !== undefined
      ? Number(body.discountPercent)
      : undefined;
  if (
    discountPercent !== undefined &&
    (!Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100)
  ) {
    throw validationError('discountPercent must be between 0 and 100.');
  }

  if (discountPercent === undefined && mrp > 0 && sellingPrice < mrp) {
    discountPercent = Math.round(((mrp - sellingPrice) / mrp) * 100);
  }

  const variantSku =
    typeof body.variantSku === 'string' ? body.variantSku.trim() : '';

  const active = body.active !== undefined ? Boolean(body.active) : undefined;
  const trackInventory =
    body.trackInventory !== undefined
      ? Boolean(body.trackInventory)
      : undefined;

  return {
    productId: productId.trim(),
    variantSku,
    stock,
    reservedStock,
    sellingPrice,
    mrp,
    ...(costPrice !== undefined ? { costPrice } : {}),
    ...(discountPercent !== undefined ? { discountPercent } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(trackInventory !== undefined ? { trackInventory } : {}),
  };
}

export function validateStoreInventoryListQuery(
  input: unknown,
): StoreInventoryListQuery {
  const query = (
    input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  ) as Record<string, unknown>;

  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(query.limit || '20'), 10) || 20),
  );

  const search =
    typeof query.search === 'string' && query.search.trim()
      ? query.search.trim()
      : undefined;

  const productId =
    typeof query.productId === 'string' &&
    isValidObjectId(query.productId.trim())
      ? query.productId.trim()
      : undefined;

  let active: boolean | undefined;
  if (query.active !== undefined) {
    active = String(query.active).toLowerCase() === 'true';
  }

  return {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(productId ? { productId } : {}),
    ...(active !== undefined ? { active } : {}),
  };
}
