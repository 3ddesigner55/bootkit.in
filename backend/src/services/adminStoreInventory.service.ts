import { isValidObjectId } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import Product, { type ProductVariantDocument } from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import CatalogAudit from '../models/catalogAudit.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AdminStoreInventoryListQuery,
  CreateAdminStoreInventoryInput,
  UpdateAdminStoreInventoryInput,
} from '../validators/adminStoreInventory.validator';

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

export async function getAdminStoreInventories(
  query: AdminStoreInventoryListQuery,
  allowedStoreIds?: string[] | null,
) {
  const filter: Record<string, unknown> = {
    deletedAt: null,
  };

  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    if (query.storeId) {
      if (!allowedStoreIds.includes(query.storeId)) {
        return {
          items: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      filter.store = query.storeId;
    } else {
      filter.store = { $in: allowedStoreIds };
    }
  } else if (query.storeId) {
    validateObjectId(query.storeId, 'Store');
    filter.store = query.storeId;
  }

  if (query.productId) {
    validateObjectId(query.productId, 'Product');
    filter.product = query.productId;
  }

  if (query.active !== undefined) {
    filter.active = query.active;
  }

  if (query.lowStock) {
    filter.stock = { $lte: 10 };
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

    const matchingProductIds = matchingProducts.map((p) => p._id);
    filter.$or = [
      { product: { $in: matchingProductIds } },
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
      .populate('store', 'name slug city state active')
      .populate(
        'product',
        'name slug thumbnail unit sku mrp sellingPrice stock fallbackIcon category brand',
      )
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

export async function getAdminStoreInventoryById(
  id: string,
  allowedStoreIds?: string[] | null,
) {
  validateObjectId(id, 'Store Inventory');

  const inventory = await StoreInventory.findOne({
    _id: id,
    deletedAt: null,
  })
    .populate('store', 'name slug city state active')
    .populate('product', 'name slug thumbnail unit sku mrp sellingPrice stock')
    .lean();

  if (!inventory) {
    throw serviceError(
      'Store inventory record not found.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const storeId =
    typeof inventory.store === 'object' &&
    inventory.store &&
    '_id' in inventory.store
      ? (inventory.store as { _id: { toString(): string } })._id.toString()
      : inventory.store?.toString();

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    (!storeId || !allowedStoreIds.includes(storeId))
  ) {
    throw serviceError(
      'Store inventory record not found.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  return inventory;
}

export async function createAdminStoreInventory(
  input: CreateAdminStoreInventoryInput,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateObjectId(input.storeId, 'Store');
  validateObjectId(input.productId, 'Product');

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    !allowedStoreIds.includes(input.storeId)
  ) {
    throw serviceError(
      'Access denied: You do not have permission to manage inventory for this store.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const [store, product] = await Promise.all([
    Store.findOne({ _id: input.storeId, deletedAt: null }),
    Product.findOne({ _id: input.productId, deletedAt: null }),
  ]);

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  const normalizedSku = (input.variantSku || '').trim();
  if (normalizedSku) {
    const hasVariant = product.variants?.some(
      (variant: ProductVariantDocument) => variant.sku === normalizedSku,
    );

    if (!hasVariant) {
      throw serviceError(
        `Variant SKU "${normalizedSku}" does not exist on product "${product.name}".`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  const existing = await StoreInventory.findOne({
    store: input.storeId,
    product: input.productId,
    variantSku: normalizedSku,
    deletedAt: null,
  });

  if (existing) {
    throw serviceError(
      'An inventory record already exists for this store, product, and variant.',
      HTTP_STATUS.CONFLICT,
    );
  }

  const inventory = await StoreInventory.create({
    store: input.storeId,
    product: input.productId,
    variantSku: normalizedSku,
    stock: input.stock,
    reservedStock: input.reservedStock ?? 0,
    sellingPrice: input.sellingPrice,
    mrp: input.mrp,
    costPrice: input.costPrice,
    discountPercent: input.discountPercent,
    active: input.active ?? true,
    trackInventory: input.trackInventory ?? true,
    createdBy: userId,
    updatedBy: userId,
  });

  return inventory;
}

export async function updateAdminStoreInventory(
  id: string,
  input: UpdateAdminStoreInventoryInput,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateObjectId(id, 'Store Inventory');

  const existing = await StoreInventory.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!existing) {
    throw serviceError(
      'Store inventory record not found.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    !allowedStoreIds.includes(existing.store.toString())
  ) {
    throw serviceError(
      'Access denied: You do not have permission to modify inventory for this store.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const stock = input.stock !== undefined ? input.stock : existing.stock;
  const reservedStock =
    input.reservedStock !== undefined
      ? input.reservedStock
      : existing.reservedStock;

  if (reservedStock > stock) {
    throw serviceError(
      'reservedStock cannot exceed total stock.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const sellingPrice =
    input.sellingPrice !== undefined
      ? input.sellingPrice
      : existing.sellingPrice;
  const mrp = input.mrp !== undefined ? input.mrp : existing.mrp;

  if (mrp > 0 && sellingPrice > mrp) {
    throw serviceError(
      'sellingPrice cannot exceed mrp.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const updated = await StoreInventory.findOneAndUpdate(
    { _id: id, deletedAt: null },
    {
      $set: {
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.reservedStock !== undefined
          ? { reservedStock: input.reservedStock }
          : {}),
        ...(input.sellingPrice !== undefined
          ? { sellingPrice: input.sellingPrice }
          : {}),
        ...(input.mrp !== undefined ? { mrp: input.mrp } : {}),
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
        updatedBy: userId,
      },
    },
    { new: true, runValidators: true },
  );

  if (updated) {
    const actor = await User.findById(userId);
    await CatalogAudit.create({
      actor: userId as any,
      role: actor?.role || 'ADMIN',
      action: 'INVENTORY_ITEM_UPDATED',
      entityType: 'STORE_INVENTORY',
      entityId: updated._id,
      beforeValue: existing.toObject(),
      afterValue: updated.toObject(),
      reason: input.reason || '',
    });
  }

  return updated;
}

export async function deleteAdminStoreInventory(
  id: string,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateObjectId(id, 'Store Inventory');

  const existing = await StoreInventory.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!existing) {
    throw serviceError(
      'Store inventory record not found.',
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    !allowedStoreIds.includes(existing.store.toString())
  ) {
    throw serviceError(
      'Access denied: You do not have permission to delete inventory for this store.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  await StoreInventory.findOneAndUpdate(
    { _id: id, deletedAt: null },
    {
      $set: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    },
    { new: true },
  );

  return { id, deleted: true };
}

export async function adjustStoreInventoryStock(
  id: string,
  delta: number,
  reason: string,
  currentStock: number,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateObjectId(id, 'Store Inventory');

  const existing = await StoreInventory.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!existing) {
    throw serviceError('Store inventory record not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    !allowedStoreIds.includes(existing.store.toString())
  ) {
    throw serviceError(
      'Access denied: You do not have permission to modify inventory for this store.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (existing.stock !== currentStock) {
    throw serviceError(
      'Concurrency conflict: The inventory stock has been modified by another process. Please refresh and try again.',
      HTTP_STATUS.CONFLICT,
    );
  }

  const nextStock = existing.stock + delta;
  if (nextStock < 0) {
    throw serviceError('Stock level cannot be adjusted below zero.', HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await StoreInventory.findOneAndUpdate(
    { _id: id, stock: currentStock, deletedAt: null },
    {
      $set: { stock: nextStock, updatedBy: userId },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw serviceError(
      'Concurrency conflict: Failed to update stock. Please refresh and try again.',
      HTTP_STATUS.CONFLICT,
    );
  }

  const actor = await User.findById(userId);
  await CatalogAudit.create({
    actor: userId as any,
    role: actor?.role || 'ADMIN',
    action: 'INVENTORY_STOCK_ADJUSTED',
    entityType: 'STORE_INVENTORY',
    entityId: updated._id,
    beforeValue: existing.toObject(),
    afterValue: updated.toObject(),
    reason: `${reason} (Delta: ${delta > 0 ? '+' : ''}${delta})`,
  });

  return updated;
}
