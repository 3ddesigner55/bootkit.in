import { isValidObjectId, type SortOrder, Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Store, { type StoreDocument } from '../models/store.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import { uploadImage } from '../utils/upload';
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

function getStoreFilters(
  query: StoreListQuery,
  includeInactive = false,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    deletedAt: null,
    ...(!includeInactive ? { active: query.active ?? true } : {}),
  };

  if (!includeInactive) {
    filters.$and = [
      {
        $or: [{ latitude: { $ne: 0 } }, { longitude: { $ne: 0 } }],
      },
      { deliveryRadius: { $gt: 0 } },
    ];
  }

  if (includeInactive && query.active !== undefined) {
    filters.active = query.active;
  }

  if (query.search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(query.search),
      'i',
    );
    const searchFilters = [
      { name: searchExpression },
      { slug: searchExpression },
      { description: searchExpression },
      { city: searchExpression },
    ];

    if (filters.$and) {
      (filters.$and as Record<string, unknown>[]).push({
        $or: searchFilters,
      });
    } else {
      filters.$or = searchFilters;
    }
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

type StoreLocationFields = {
  active: StoreDocument['active'];
  latitude?: StoreDocument['latitude'];
  longitude?: StoreDocument['longitude'];
  deliveryRadius?: StoreDocument['deliveryRadius'];
};

function getLocationValidationErrors(store: StoreLocationFields): string[] {
  const errors: string[] = [];

  if (typeof store.latitude !== 'number' || !Number.isFinite(store.latitude)) {
    errors.push('latitude is missing or invalid.');
  } else if (store.latitude < -90 || store.latitude > 90) {
    errors.push('latitude is outside the supported range.');
  }

  if (
    typeof store.longitude !== 'number' ||
    !Number.isFinite(store.longitude)
  ) {
    errors.push('longitude is missing or invalid.');
  } else if (store.longitude < -180 || store.longitude > 180) {
    errors.push('longitude is outside the supported range.');
  }

  if (store.latitude === 0 && store.longitude === 0) {
    errors.push('latitude and longitude cannot both be 0.');
  }

  if (
    typeof store.deliveryRadius !== 'number' ||
    !Number.isFinite(store.deliveryRadius) ||
    store.deliveryRadius <= 0
  ) {
    errors.push('deliveryRadius must be greater than 0.');
  }

  return errors;
}

function withLocationValidation<T extends StoreLocationFields>(store: T) {
  const locationValidationErrors = getLocationValidationErrors(store);

  return {
    ...store,
    locationValid: locationValidationErrors.length === 0,
    locationValidationErrors,
  };
}

function validateActiveStoreLocation(input: StoreLocationFields): void {
  const errors = getLocationValidationErrors(input);
  const blockingErrors = input.active
    ? errors
    : errors.filter((error) => error.startsWith('deliveryRadius'));

  if (blockingErrors.length > 0) {
    throw serviceError(
      `${input.active ? 'Active delivery store location' : 'Store delivery radius'} is invalid: ${blockingErrors.join(' ')}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
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
    items: stores.map(withLocationValidation),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

async function validateAndSyncSellerAssignment(
  storeId: Types.ObjectId | string,
  newSellerId: string | null | undefined,
  oldSellerId?: string | null,
): Promise<void> {
  if (newSellerId === undefined) {
    return;
  }

  if (newSellerId === null) {
    if (oldSellerId) {
      await User.updateOne(
        { _id: oldSellerId },
        { $pull: { assignedStores: storeId } },
      );
    }
    return;
  }

  if (!isValidObjectId(newSellerId)) {
    throw serviceError('Invalid seller user ID.', HTTP_STATUS.BAD_REQUEST);
  }

  const sellerUser = await User.findOne({
    _id: newSellerId,
    deletedAt: null,
  });

  if (!sellerUser) {
    throw serviceError('Seller user not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (sellerUser.role !== 'SELLER') {
    throw serviceError(
      'Assigned user must have SELLER role.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (oldSellerId && oldSellerId.toString() !== newSellerId.toString()) {
    await User.updateOne(
      { _id: oldSellerId },
      { $pull: { assignedStores: storeId } },
    );
  }

  await User.updateOne(
    { _id: newSellerId },
    { $addToSet: { assignedStores: storeId } },
  );
}

export async function getAdminStores(
  query: StoreListQuery,
  allowedStoreIds?: string[] | null,
) {
  const filters = getStoreFilters(query, true);

  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    filters._id = {
      $in: allowedStoreIds.map((id) => new Types.ObjectId(id)),
    };
  }

  const [stores, total] = await Promise.all([
    Store.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('seller', 'firstName lastName email phone sellerStatus')
      .lean(),
    Store.countDocuments(filters),
  ]);

  return {
    items: stores.map(withLocationValidation),
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

  validateActiveStoreLocation(store);

  return withLocationValidation(store);
}

export async function getAdminStoreById(
  id: string,
  allowedStoreIds?: string[] | null,
) {
  validateStoreId(id);

  if (
    allowedStoreIds !== null &&
    allowedStoreIds !== undefined &&
    !allowedStoreIds.includes(id)
  ) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  const store = await Store.findOne({
    _id: id,
    deletedAt: null,
  })
    .populate('seller', 'firstName lastName email phone sellerStatus')
    .lean();

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  return withLocationValidation(store);
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

  validateActiveStoreLocation(store);

  return withLocationValidation(store);
}

export async function createStore(
  input: StoreInput,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    throw serviceError(
      'Access denied: Only administrators can create new stores.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  validateActiveStoreLocation({
    active: input.active ?? true,
    latitude: input.latitude,
    longitude: input.longitude,
    deliveryRadius: input.deliveryRadius,
  });

  const store = await Store.create({
    ...input,
    createdBy: userId,
    updatedBy: userId,
  });

  if (store.isDefault && store.active) {
    await Store.updateMany(
      { _id: { $ne: store._id }, active: true, deletedAt: null },
      { $set: { isDefault: false } },
    );
  }

  if (input.seller) {
    await validateAndSyncSellerAssignment(store._id, input.seller);
  }

  return store;
}

export async function updateStore(
  id: string,
  input: StoreUpdateInput,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateStoreId(id);

  const existingStore = await Store.findOne({ _id: id, deletedAt: null });

  if (!existingStore) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isSellerScoped =
    allowedStoreIds !== null && allowedStoreIds !== undefined;

  if (isSellerScoped) {
    if (!allowedStoreIds.includes(id)) {
      throw serviceError(
        'Access denied: You do not have permission to update this store.',
        HTTP_STATUS.FORBIDDEN,
      );
    }
    // Sellers cannot change the store's seller assignment
    delete input.seller;
  }

  validateActiveStoreLocation({
    active: input.active ?? existingStore.active,
    latitude: input.latitude ?? existingStore.latitude,
    longitude: input.longitude ?? existingStore.longitude,
    deliveryRadius: input.deliveryRadius ?? existingStore.deliveryRadius,
  });

  if (input.seller !== undefined && !isSellerScoped) {
    await validateAndSyncSellerAssignment(
      existingStore._id,
      input.seller,
      existingStore.seller?.toString(),
    );
  }

  const store = await Store.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (store.isDefault && store.active) {
    await Store.updateMany(
      { _id: { $ne: store._id }, active: true, deletedAt: null },
      { $set: { isDefault: false } },
    );
  }

  return store;
}

export async function deleteStore(
  id: string,
  userId: string,
  allowedStoreIds?: string[] | null,
) {
  validateStoreId(id);

  if (allowedStoreIds !== null && allowedStoreIds !== undefined) {
    throw serviceError(
      'Access denied: Sellers cannot delete stores.',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const store = await Store.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { active: false, deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );


  if (!store) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (store.seller) {
    await User.updateOne(
      { _id: store.seller },
      { $pull: { assignedStores: store._id } },
    );
  }

  return store;
}

type StoreUploadFiles = {
  logo?: Express.Multer.File;
  banner?: Express.Multer.File;
};

export async function uploadStoreImages(files: StoreUploadFiles) {
  if (!files.logo && !files.banner) {
    throw serviceError(
      'At least one store image file is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const [logo, banner] = await Promise.all([
    files.logo
      ? uploadImage(files.logo.buffer, { folder: 'bootkit/stores' })
      : undefined,
    files.banner
      ? uploadImage(files.banner.buffer, { folder: 'bootkit/stores' })
      : undefined,
  ]);

  return {
    ...(logo ? { logo: logo.secureUrl } : {}),
    ...(banner ? { banner: banner.secureUrl } : {}),
  };
}

import StoreAudit from '../models/storeAudit.model';

export async function resolveStoreContext(storeId?: string, city?: string) {
  let validatedStore: any = null;

  if (storeId) {
    if (!isValidObjectId(storeId)) {
      throw serviceError('STORE_UNAVAILABLE', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
    validatedStore = await Store.findOne({ _id: storeId, active: true, deletedAt: null }).lean();
    if (!validatedStore) {
      throw serviceError('STORE_UNAVAILABLE', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
  } else {
    // Query active, non-deleted Stores with isDefault: true, limit 2
    const defaultStores = await Store.find({ isDefault: true, active: true, deletedAt: null }).limit(2).lean();
    if (defaultStores.length !== 1) {
      throw serviceError('STORE_UNAVAILABLE', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
    validatedStore = defaultStores[0];
  }

  return validatedStore;
}

export async function changeDefaultStore(storeId: string, actorId: string, actorRole: string) {
  if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') {
    throw serviceError('Unauthorized. Only ADMIN or OWNER can change default store.', HTTP_STATUS.FORBIDDEN);
  }

  if (!isValidObjectId(storeId)) {
    throw serviceError('Store not found.', HTTP_STATUS.NOT_FOUND);
  }

  const targetStore = await Store.findOne({ _id: storeId, active: true, deletedAt: null });
  if (!targetStore) {
    throw serviceError('Selected store is inactive or does not exist.', HTTP_STATUS.BAD_REQUEST);
  }

  const currentDefault = await Store.findOne({ isDefault: true, active: true, deletedAt: null });

  let session: any = null;
  try {
    session = await Store.startSession();
  } catch {
    // Session not supported
  }

  if (session) {
    try {
      session.startTransaction();
      await Store.updateMany(
        { isDefault: true, active: true, deletedAt: null },
        { $set: { isDefault: false } }
      ).session(session);

      await Store.updateOne({ _id: targetStore._id }, { $set: { isDefault: true } }).session(session);

      await StoreAudit.create([{
        action: 'DEFAULT_STORE_CHANGED',
        actor: new Types.ObjectId(actorId),
        actorRole,
        oldStoreId: currentDefault ? currentDefault._id : null,
        newStoreId: targetStore._id,
        metadata: { timestamp: new Date() }
      }], { session });

      await session.commitTransaction();
    } catch (err: any) {
      await session.abortTransaction();
      if (err.code === 11000) {
        throw serviceError('Concurrency conflict. Only one store can be default.', HTTP_STATUS.CONFLICT);
      }
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    try {
      await Store.updateMany(
        { isDefault: true, active: true, deletedAt: null },
        { $set: { isDefault: false } }
      );
      await Store.updateOne({ _id: targetStore._id }, { $set: { isDefault: true } });

      await StoreAudit.create({
        action: 'DEFAULT_STORE_CHANGED',
        actor: new Types.ObjectId(actorId),
        actorRole,
        oldStoreId: currentDefault ? currentDefault._id : null,
        newStoreId: targetStore._id,
        metadata: { timestamp: new Date() }
      });
    } catch (err: any) {
      if (currentDefault) {
        await Store.updateOne({ _id: currentDefault._id }, { $set: { isDefault: true } });
        await Store.updateOne({ _id: targetStore._id }, { $set: { isDefault: false } });
      }
      if (err.code === 11000) {
        throw serviceError('Concurrency conflict. Only one store can be default.', HTTP_STATUS.CONFLICT);
      }
      throw err;
    }
  }
}

