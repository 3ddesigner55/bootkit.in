import { isValidObjectId } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import Product, { type ProductVariantDocument } from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import type { ApiError } from '../types/api';
import type {
  StoreInventoryListQuery,
  UpsertStoreInventoryInput,
} from '../validators/storeInventory.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateObjectId(id: string, name: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError(`${name} not found.`, HTTP_STATUS.NOT_FOUND);
  }
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function validateStoreAndProduct(
  storeId: string,
  productId: string,
  variantSku = '',
) {
  validateObjectId(storeId, 'Store');
  validateObjectId(productId, 'Product');

  const [store, product] = await Promise.all([
    Store.findOne({ _id: storeId, deletedAt: null }),
    Product.findOne({ _id: productId, deletedAt: null }),
  ]);

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  const normalizedSku = variantSku.trim();
  if (normalizedSku) {
    const hasVariant = product.variants?.some(
      (variant: ProductVariantDocument) => variant.sku === normalizedSku,
    );

    if (!hasVariant) {
      throw serviceError(
        `Variant with SKU "${normalizedSku}" does not belong to product "${product.name}".`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  return { store, product, normalizedSku };
}

export async function getStoreInventory(
  storeId: string,
  productId: string,
  variantSku = '',
) {
  validateObjectId(storeId, 'Store');
  validateObjectId(productId, 'Product');

  return StoreInventory.findOne({
    store: storeId,
    product: productId,
    variantSku: variantSku.trim(),
    deletedAt: null,
  })
    .populate('store', 'name slug city state active')
    .populate('product', 'name slug thumbnail mrp sellingPrice unit')
    .lean();
}

export async function listStoreInventory(
  storeId: string,
  query: StoreInventoryListQuery,
) {
  validateObjectId(storeId, 'Store');

  const store = await Store.findOne({ _id: storeId, deletedAt: null });
  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  const filter: Record<string, unknown> = {
    store: storeId,
    deletedAt: null,
  };

  if (query.active !== undefined) {
    filter.active = query.active;
  }

  if (query.productId) {
    filter.product = query.productId;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegularExpression(query.search), 'i');
    const matchingProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { sku: searchRegex },
        { 'variants.sku': searchRegex },
      ],
      deletedAt: null,
    }).select('_id');

    const matchingIds = matchingProducts.map((p) => p._id);
    filter.$or = [
      { product: { $in: matchingIds } },
      { variantSku: searchRegex },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [total, items] = await Promise.all([
    StoreInventory.countDocuments(filter),
    StoreInventory.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('product', 'name slug thumbnail unit sku mrp sellingPrice')
      .lean(),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function upsertStoreInventory(
  storeId: string,
  input: UpsertStoreInventoryInput,
  userId?: string,
) {
  const { normalizedSku } = await validateStoreAndProduct(
    storeId,
    input.productId,
    input.variantSku,
  );

  const inventory = await StoreInventory.findOneAndUpdate(
    {
      store: storeId,
      product: input.productId,
      variantSku: normalizedSku,
    },
    {
      $set: {
        stock: input.stock,
        reservedStock: input.reservedStock ?? 0,
        sellingPrice: input.sellingPrice,
        mrp: input.mrp,
        ...(input.costPrice !== undefined
          ? { costPrice: input.costPrice }
          : {}),
        ...(input.discountPercent !== undefined
          ? { discountPercent: input.discountPercent }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.trackInventory !== undefined
          ? { trackInventory: input.trackInventory }
          : {}),
        ...(userId ? { updatedBy: userId } : {}),
        deletedAt: null,
      },
      $setOnInsert: {
        ...(userId ? { createdBy: userId } : {}),
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return inventory;
}

export async function checkAvailableStock(
  storeId: string,
  productId: string,
  quantity: number,
  variantSku = '',
): Promise<{ available: boolean; currentAvailableStock: number }> {
  validateObjectId(storeId, 'Store');
  validateObjectId(productId, 'Product');

  const inventory = await StoreInventory.findOne({
    store: storeId,
    product: productId,
    variantSku: variantSku.trim(),
    active: true,
    deletedAt: null,
  }).lean();

  if (!inventory) {
    return { available: false, currentAvailableStock: 0 };
  }

  const availableStock = Math.max(
    0,
    (inventory.stock || 0) - (inventory.reservedStock || 0),
  );

  return {
    available: !inventory.trackInventory || availableStock >= quantity,
    currentAvailableStock: availableStock,
  };
}

export async function reserveStock(
  storeId: string,
  productId: string,
  quantity: number,
  variantSku = '',
) {
  if (quantity <= 0) {
    throw serviceError(
      'Reservation quantity must be greater than 0.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Atomic update: only reserve if trackInventory is false OR available stock is sufficient
  const result = await StoreInventory.findOneAndUpdate(
    {
      store: storeId,
      product: productId,
      variantSku: variantSku.trim(),
      active: true,
      deletedAt: null,
      $expr: {
        $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity],
      },
    },
    {
      $inc: { reservedStock: quantity },
    },
    { new: true },
  );

  if (!result) {
    throw serviceError(
      'Insufficient available inventory for reservation.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return result;
}

export async function releaseStock(
  storeId: string,
  productId: string,
  quantity: number,
  variantSku = '',
) {
  if (quantity <= 0) {
    throw serviceError(
      'Release quantity must be greater than 0.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Atomic decrement reserved stock down to min 0
  const result = await StoreInventory.findOneAndUpdate(
    {
      store: storeId,
      product: productId,
      variantSku: variantSku.trim(),
      deletedAt: null,
      reservedStock: { $gte: quantity },
    },
    {
      $inc: { reservedStock: -quantity },
    },
    { new: true },
  );

  if (!result) {
    throw serviceError(
      'Reserved stock could not be released.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return result;
}
