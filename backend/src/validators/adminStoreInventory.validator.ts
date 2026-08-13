import { isValidObjectId } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type CreateAdminStoreInventoryInput = {
  storeId: string;
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

export type UpdateAdminStoreInventoryInput = {
  stock?: number;
  reservedStock?: number;
  sellingPrice?: number;
  mrp?: number;
  costPrice?: number;
  discountPercent?: number;
  active?: boolean;
  trackInventory?: boolean;
  reason?: string;
};

export type AdminStoreInventoryListQuery = {
  page: number;
  limit: number;
  storeId?: string;
  productId?: string;
  search?: string;
  active?: boolean;
  lowStock?: boolean;
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

export function validateCreateAdminStoreInventory(
  input: unknown,
): CreateAdminStoreInventoryInput {
  const body = getObject(input);
  const storeId = body.storeId;
  const productId = body.productId;

  if (typeof storeId !== 'string' || !isValidObjectId(storeId.trim())) {
    throw validationError('storeId must be a valid ObjectId.');
  }

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

  const active = body.active !== undefined ? Boolean(body.active) : true;
  const trackInventory =
    body.trackInventory !== undefined ? Boolean(body.trackInventory) : true;

  return {
    storeId: storeId.trim(),
    productId: productId.trim(),
    variantSku,
    stock,
    reservedStock,
    sellingPrice,
    mrp,
    ...(costPrice !== undefined ? { costPrice } : {}),
    ...(discountPercent !== undefined ? { discountPercent } : {}),
    active,
    trackInventory,
  };
}

export function validateUpdateAdminStoreInventory(
  input: unknown,
): UpdateAdminStoreInventoryInput {
  const body = getObject(input);
  const result: UpdateAdminStoreInventoryInput = {};

  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      throw validationError('stock must be a non-negative number.');
    }
    result.stock = stock;
  }

  if (body.reservedStock !== undefined) {
    const reservedStock = Number(body.reservedStock);
    if (!Number.isFinite(reservedStock) || reservedStock < 0) {
      throw validationError('reservedStock must be a non-negative number.');
    }
    result.reservedStock = reservedStock;
  }

  if (body.sellingPrice !== undefined) {
    const sellingPrice = Number(body.sellingPrice);
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      throw validationError('sellingPrice must be a non-negative number.');
    }
    result.sellingPrice = sellingPrice;
  }

  if (body.mrp !== undefined) {
    const mrp = Number(body.mrp);
    if (!Number.isFinite(mrp) || mrp < 0) {
      throw validationError('mrp must be a non-negative number.');
    }
    result.mrp = mrp;
  }

  if (
    result.sellingPrice !== undefined &&
    result.mrp !== undefined &&
    result.mrp > 0 &&
    result.sellingPrice > result.mrp
  ) {
    throw validationError('sellingPrice cannot be greater than mrp.');
  }

  if (body.costPrice !== undefined) {
    const costPrice = Number(body.costPrice);
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      throw validationError('costPrice must be a non-negative number.');
    }
    result.costPrice = costPrice;
  }

  if (body.discountPercent !== undefined) {
    const discountPercent = Number(body.discountPercent);
    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      throw validationError('discountPercent must be between 0 and 100.');
    }
    result.discountPercent = discountPercent;
  }

  if (body.active !== undefined) {
    result.active = Boolean(body.active);
  }

  if (body.trackInventory !== undefined) {
    result.trackInventory = Boolean(body.trackInventory);
  }

  if (body.reason !== undefined) {
    result.reason = String(body.reason);
  }

  return result;
}

export function validateAdminStoreInventoryListQuery(
  input: unknown,
): AdminStoreInventoryListQuery {
  const query = (
    input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  ) as Record<string, unknown>;

  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(query.limit || '20'), 10) || 20),
  );

  const storeId =
    typeof query.storeId === 'string' && isValidObjectId(query.storeId.trim())
      ? query.storeId.trim()
      : undefined;

  const productId =
    typeof query.productId === 'string' &&
    isValidObjectId(query.productId.trim())
      ? query.productId.trim()
      : undefined;

  const search =
    typeof query.search === 'string' && query.search.trim()
      ? query.search.trim()
      : undefined;

  let active: boolean | undefined;
  if (query.active !== undefined) {
    active = String(query.active).toLowerCase() === 'true';
  }

  let lowStock: boolean | undefined;
  if (query.lowStock !== undefined) {
    lowStock = String(query.lowStock).toLowerCase() === 'true';
  }

  return {
    page,
    limit,
    ...(storeId ? { storeId } : {}),
    ...(productId ? { productId } : {}),
    ...(search ? { search } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(lowStock !== undefined ? { lowStock } : {}),
  };
}
