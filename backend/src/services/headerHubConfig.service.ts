import Brand from '../models/brand.model';
import Category from '../models/category.model';
import HeaderHubConfig, {
  type HeaderHubSlug,
} from '../models/headerHubConfig.model';
import HeroBanner from '../models/heroBanner.model';
import Product from '../models/product.model';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';
import type { HeaderHubConfigInput } from '../validators/headerHubConfig.validator';

function serviceError(
  message: string,
  statusCode: number,
): ApiError {
  return Object.assign(new Error(message), {
    statusCode,
  });
}

function toIdStrings(values: readonly unknown[]): string[] {
  return values.map((value) => String(value));
}

function sortByConfiguredIds<T extends { _id: unknown }>(
  configuredIds: readonly unknown[],
  documents: T[],
): T[] {
  const order = new Map(
    configuredIds.map((id, index) => [
      String(id),
      index,
    ]),
  );

  return [...documents].sort(
    (first, second) =>
      (order.get(String(first._id)) ??
        Number.MAX_SAFE_INTEGER) -
      (order.get(String(second._id)) ??
        Number.MAX_SAFE_INTEGER),
  );
}

async function ensureHeaderHubConfig(
  hub: HeaderHubSlug,
) {
  const existing = await HeaderHubConfig.findOne({
    hub,
  });

  if (existing) {
    return existing;
  }

  // Existing collectionHub values केवल पहली migration के
  // लिए config में copy किए जाते हैं।
  const [categories, brands, banners] =
    await Promise.all([
      Category.find({
        collectionHub: hub,
        deletedAt: null,
      })
        .sort({ sortOrder: 1, name: 1 })
        .select('_id')
        .lean(),

      Brand.find({
        collectionHub: hub,
        deletedAt: null,
      })
        .sort({ displayOrder: 1, name: 1 })
        .select('_id')
        .lean(),

      HeroBanner.find({
        collectionHub: hub,
        deletedAt: null,
      })
        .sort({ displayOrder: 1 })
        .select('_id')
        .lean(),
    ]);

  const config =
    await HeaderHubConfig.findOneAndUpdate(
      { hub },
      {
        $setOnInsert: {
          hub,
          categoryIds: categories.map(
            (category) => category._id,
          ),
          productIds: [],
          brandIds: brands.map((brand) => brand._id),
          bannerIds: banners.map(
            (banner) => banner._id,
          ),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

  if (!config) {
    throw serviceError(
      'Unable to create header hub configuration.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return config;
}

function toAdminConfig(
  config: Awaited<
    ReturnType<typeof ensureHeaderHubConfig>
  >,
) {
  return {
    hub: config.hub,
    categoryIds: toIdStrings(config.categoryIds),
    productIds: toIdStrings(config.productIds),
    brandIds: toIdStrings(config.brandIds),
    bannerIds: toIdStrings(config.bannerIds),
    updatedAt: config.updatedAt,
  };
}

async function validateHubSelections(
  hub: HeaderHubSlug,
  input: HeaderHubConfigInput,
) {
  const hubCategories = await Category.find({
    collectionHub: hub,
    deletedAt: null,
  })
    .select('_id')
    .lean();

  const hubCategoryIds = new Set(
    hubCategories.map((category) =>
      String(category._id),
    ),
  );

  if (
    input.categoryIds.some(
      (categoryId) =>
        !hubCategoryIds.has(categoryId),
    )
  ) {
    throw serviceError(
      `Only ${hub} categories can be selected for this hub.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const [products, brands, banners] =
    await Promise.all([
      Product.find({
        _id: { $in: input.productIds },
        deletedAt: null,
      })
        .select('_id category')
        .lean(),

      Brand.find({
        _id: { $in: input.brandIds },
        collectionHub: hub,
        deletedAt: null,
      })
        .select('_id')
        .lean(),

      HeroBanner.find({
        _id: { $in: input.bannerIds },
        collectionHub: hub,
        deletedAt: null,
      })
        .select('_id')
        .lean(),
    ]);

  if (
    products.length !== input.productIds.length ||
    products.some(
      (product) =>
        !hubCategoryIds.has(
          String(product.category),
        ),
    )
  ) {
    throw serviceError(
      `Only products from ${hub} categories can be selected.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (brands.length !== input.brandIds.length) {
    throw serviceError(
      `Only ${hub} brands can be selected.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (banners.length !== input.bannerIds.length) {
    throw serviceError(
      `Only ${hub} banners can be selected.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

export async function getAdminHeaderHubConfig(
  hub: HeaderHubSlug,
) {
  const config = await ensureHeaderHubConfig(hub);

  return toAdminConfig(config);
}

export async function updateHeaderHubConfig(
  hub: HeaderHubSlug,
  input: HeaderHubConfigInput,
  userId: string,
) {
  await validateHubSelections(hub, input);

  const config =
    await HeaderHubConfig.findOneAndUpdate(
      { hub },
      {
        $set: {
          categoryIds: input.categoryIds,
          productIds: input.productIds,
          brandIds: input.brandIds,
          bannerIds: input.bannerIds,
          updatedBy: userId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

  if (!config) {
    throw serviceError(
      'Unable to update header hub configuration.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return toAdminConfig(config);
}

export async function getPublicHeaderHubContent(
  hub: HeaderHubSlug,
) {
  const config = await ensureHeaderHubConfig(hub);

  const [categories, products, brands, banners] =
    await Promise.all([
      Category.find({
        _id: { $in: config.categoryIds },
        active: true,
        deletedAt: null,
      }).lean(),

      Product.find({
        _id: { $in: config.productIds },
        active: true,
        deletedAt: null,
      })
        .populate('category', 'name slug collectionHub')
        .populate('brand', 'name slug logo')
        .lean(),

      Brand.find({
        _id: { $in: config.brandIds },
        active: true,
        deletedAt: null,
      }).lean(),

      HeroBanner.find({
        _id: { $in: config.bannerIds },
        active: true,
        deletedAt: null,
      }).lean(),
    ]);

  return {
    hub,
    categories: sortByConfiguredIds(
      config.categoryIds,
      categories,
    ),
    products: sortByConfiguredIds(
      config.productIds,
      products,
    ),
    brands: sortByConfiguredIds(
      config.brandIds,
      brands,
    ),
    banners: sortByConfiguredIds(
      config.bannerIds,
      banners,
    ),
  };
}