import { isValidObjectId, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Store from '../models/store.model';
import type { ApiError } from '../types/api';
import type {
  StoreInput,
  StoreListQuery,
  StoreUpdateInput,
} from '../validators/store.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateStoreId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSort(sort: StoreListQuery['sort']): Record<string, SortOrder> {
  switch (sort) {
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'name-asc':
      return { name: 1 };
    default:
      return { displayOrder: 1, createdAt: -1 };
  }
}

function getStoreFilters(query: StoreListQuery): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    deletedAt: null,
    active: query.active ?? true,
  };

  if (query.search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(query.search),
      'i',
    );
    filters.$or = [
      { name: searchExpression },
      { slug: searchExpression },
      { description: searchExpression },
      { city: searchExpression },
    ];
  }

  if (query.city) {
    filters.city = new RegExp(`^${escapeRegularExpression(query.city)}$`, 'i');
  }

  if (query.state) {
    filters.state = new RegExp(
      `^${escapeRegularExpression(query.state)}$`,
      'i',
    );
  }

  if (query.featured !== undefined) {
    filters.featured = query.featured;
  }

  return filters;
}

export async function getStores(query: StoreListQuery) {
  const filters = getStoreFilters(query);
  const [stores, total] = await Promise.all([
    Store.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Store.countDocuments(filters),
  ]);

  return {
    items: stores,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getStoreById(id: string) {
  validateStoreId(id);

  const store = await Store.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  }).lean();

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  return store;
}

export async function getStoreBySlug(slug: string) {
  const store = await Store.findOne({
    slug: slug.toLowerCase(),
    active: true,
    deletedAt: null,
  }).lean();

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  return store;
}

export async function createStore(input: StoreInput, userId: string) {
  return Store.create({ ...input, createdBy: userId, updatedBy: userId });
}

export async function updateStore(
  id: string,
  input: StoreUpdateInput,
  userId: string,
) {
  validateStoreId(id);

  const store = await Store.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  return store;
}

export async function deleteStore(id: string, userId: string) {
  validateStoreId(id);

  const store = await Store.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  return store;
}
