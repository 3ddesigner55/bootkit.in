import { isValidObjectId, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Product, { type ProductVariantDocument } from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory, {
  type StoreInventoryDocument,
} from '../models/storeInventory.model';
import type { ApiError } from '../types/api';
import { uploadImage } from '../utils/upload';
import type {
  ProductInput,
  ProductListQuery,
  ProductUpdateInput,
} from '../validators/product.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateProductId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }
}

async function validateCategory(categoryId: string): Promise<void> {
  if (!isValidObjectId(categoryId)) {
    throw serviceError('Category not found.', HTTP_STATUS.BAD_REQUEST);
  }

  const categoryDoc = await Category.findOne({ _id: categoryId, deletedAt: null }).lean();

  if (!categoryDoc) {
    throw serviceError('Category not found.', HTTP_STATUS.BAD_REQUEST);
  }

  const { computeCategoryLevelAndPath } = await import('./category.service');
  const { level } = await computeCategoryLevelAndPath(categoryDoc);

  if (level !== 3) {
    throw serviceError('Product must be assigned to a Level-3 Leaf Category.', HTTP_STATUS.BAD_REQUEST);
  }
}


async function validateBrand(brandId: string): Promise<void> {
  if (!isValidObjectId(brandId)) {
    throw serviceError('Brand not found.', HTTP_STATUS.BAD_REQUEST);
  }

  const brand = await Brand.exists({ _id: brandId, deletedAt: null });

  if (!brand) {
    throw serviceError('Brand not found.', HTTP_STATUS.BAD_REQUEST);
  }
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSort(sort: ProductListQuery['sort']): Record<string, SortOrder> {
  switch (sort) {
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'price-asc':
      return { sellingPrice: 1 };
    case 'price-desc':
      return { sellingPrice: -1 };
    case 'name-asc':
      return { name: 1 };
    case 'name-desc':
      return { name: -1 };
    case 'stock-asc':
      return { stock: 1 };
    case 'stock-desc':
      return { stock: -1 };
    default:
      return { displayOrder: 1, createdAt: -1 };
  }
}

async function getProductFilters(
  query: ProductListQuery,
  includeInactive = false,
): Promise<Record<string, unknown>> {
  const filters: Record<string, unknown> = {
    deletedAt: null,
    ...(!includeInactive ? { active: query.active ?? true } : {}),
  };

  if (includeInactive && query.active !== undefined) {
    filters.active = query.active;
  }

  if (query.search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(query.search),
      'i',
    );
    filters.$or = [
      { name: searchExpression },
      { slug: searchExpression },
      { description: searchExpression },
      { shortDescription: searchExpression },
    ];
  }

  if (query.category) {
    let targetCat: any = null;
    if (isValidObjectId(query.category)) {
      targetCat = await Category.findOne({ _id: query.category, deletedAt: null })
        .select('_id')
        .lean();
    } else {
      targetCat = await Category.findOne({
        slug: query.category.toLowerCase(),
        deletedAt: null,
      })
        .select('_id')
        .lean();
    }

    if (targetCat) {
      const { getCategoryDescendantIds } = await import('./category.service');
      const descendants = await getCategoryDescendantIds(targetCat._id);
      filters.category = { $in: [targetCat._id, ...descendants] };
    } else {
      filters.category = query.category;
    }
  } else if (query.hub) {
    const hubCategories = await Category.find({
      collectionHub: query.hub,
      active: true,
      deletedAt: null,
    })
      .select('_id')
      .lean();

    const categoryIds = hubCategories.map((c) => c._id);
    filters.category = { $in: categoryIds };
  }

  if (query.brand) {
    if (isValidObjectId(query.brand)) {
      filters.brand = query.brand;
    } else {
      const brandDoc = await Brand.findOne({
        slug: query.brand.toLowerCase(),
        deletedAt: null,
      })
        .select('_id')
        .lean();
      if (brandDoc) {
        filters.brand = brandDoc._id;
      } else {
        filters.brand = query.brand;
      }
    }
  }


  if (query.featured !== undefined) {
    filters.featured = query.featured;
  }

  if (query.bestseller !== undefined) {
    filters.bestseller = query.bestseller;
  }

  if (query.showOnHome !== undefined) {
    filters.showOnHome = query.showOnHome;
  }

  if (query.stockStatus === 'in-stock') {
    filters.stock = { $gt: 0 };
  }

  if (query.stockStatus === 'out-of-stock') {
    filters.stock = { $lte: 0 };
  }

  if (query.stockStatus === 'low-stock') {
    filters.$expr = {
      $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }],
    };
  }

  return filters;
}

async function validateStoreContext(storeId?: string) {
  if (!storeId) return null;
  if (!isValidObjectId(storeId)) {
    throw serviceError('Store not found.', HTTP_STATUS.BAD_REQUEST);
  }
  const store = await Store.findOne({
    _id: storeId,
    active: true,
    deletedAt: null,
  }).lean();
  if (!store) {
    throw serviceError('Store not found or inactive.', HTTP_STATUS.BAD_REQUEST);
  }
  return store;
}

export function mapProductWithStoreInventory(
  product: Record<string, unknown>,
  inventoryMap: Map<string, StoreInventoryDocument>,
  storeId?: string,
) {
  if (!storeId) {
    return product;
  }

  const productIdStr = String(product._id);
  const baseKey = `${productIdStr}_`;
  const baseInv = inventoryMap.get(baseKey);

  // If variants exist on product
  const rawVariants = product.variants as ProductVariantDocument[] | undefined;
  let variants = rawVariants;
  if (rawVariants && rawVariants.length > 0) {
    variants = rawVariants.map((v) => {
      const vKey = `${productIdStr}_${v.sku}`;
      const vInv = inventoryMap.get(vKey);
      if (vInv) {
        const availableStock = Math.max(
          0,
          (vInv.stock ?? 0) - (vInv.reservedStock ?? 0),
        );
        const isAvailable =
          vInv.active && (!vInv.trackInventory || availableStock > 0);
        return {
          ...v,
          stock: vInv.stock,
          availableStock,
          price: vInv.sellingPrice,
          mrp: vInv.mrp,
          active: isAvailable,
          isAvailable,
        };
      }
      return {
        ...v,
        stock: 0,
        availableStock: 0,
        active: false,
        isAvailable: false,
      };
    });
  }

  if (baseInv) {
    const availableStock = Math.max(
      0,
      (baseInv.stock ?? 0) - (baseInv.reservedStock ?? 0),
    );
    const isAvailable =
      baseInv.active && (!baseInv.trackInventory || availableStock > 0);
    return {
      ...product,
      stock: baseInv.stock,
      availableStock,
      sellingPrice: baseInv.sellingPrice,
      mrp: baseInv.mrp,
      discountPercent:
        baseInv.discountPercent ??
        (product.discountPercent as number | undefined),
      active: isAvailable,
      isAvailable,
      ...(variants ? { variants } : {}),
    };
  }

  if (variants && variants.length > 0) {
    const hasAnyAvailableVariant = variants.some(
      (v) => (v as unknown as { isAvailable: boolean }).isAvailable,
    );
    const totalVariantStock = variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0,
    );
    const totalAvailableStock = variants.reduce(
      (sum, v) =>
        sum +
        ((v as unknown as { availableStock?: number }).availableStock || 0),
      0,
    );
    const prices = variants
      .map((v) => v.price)
      .filter((p) => Number.isFinite(p) && p > 0);
    const minPrice =
      prices.length > 0
        ? Math.min(...prices)
        : (product.sellingPrice as number);
    return {
      ...product,
      stock: totalVariantStock,
      availableStock: totalAvailableStock,
      sellingPrice: minPrice,
      active: hasAnyAvailableVariant,
      isAvailable: hasAnyAvailableVariant,
      variants,
    };
  }

  // If storeId is supplied and no StoreInventory record exists for this product in that store:
  return {
    ...product,
    stock: 0,
    availableStock: 0,
    active: false,
    isAvailable: false,
    ...(variants ? { variants } : {}),
  };
}

export async function getProducts(query: ProductListQuery) {
  if (query.storeId) {
    await validateStoreContext(query.storeId);
  }

  const filters = await getProductFilters(query);
  const [products, total] = await Promise.all([
    Product.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filters),
  ]);

  let items = products as Record<string, unknown>[];
  if (query.storeId && products.length > 0) {
    const productIds = products.map((p) => p._id);
    const inventories = await StoreInventory.find({
      store: query.storeId,
      product: { $in: productIds },
      deletedAt: null,
    }).lean();

    const inventoryMap = new Map<string, StoreInventoryDocument>();
    for (const inv of inventories) {
      inventoryMap.set(
        `${String(inv.product)}_${inv.variantSku || ''}`,
        inv as unknown as StoreInventoryDocument,
      );
    }

    items = products.map((product) =>
      mapProductWithStoreInventory(
        product as unknown as Record<string, unknown>,
        inventoryMap,
        query.storeId,
      ),
    );
  }

  const normalizedItems = items.map((item) => normalizeProductDto(item));

  return {
    items: normalizedItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export function normalizeProductDto(product: Record<string, any>) {
  const thumbnail = product.thumbnail || product.image || '';
  const gallery =
    Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : thumbnail
          ? [thumbnail]
          : [];

  return {
    ...product,
    id: String(product._id || product.id),
    _id: String(product._id || product.id),
    image: thumbnail,
    thumbnail: thumbnail,
    images: gallery,
    gallery: gallery,
    price: product.sellingPrice ?? product.price ?? 0,
    sellingPrice: product.sellingPrice ?? product.price ?? 0,
    mrp: product.mrp ?? product.sellingPrice ?? product.price ?? 0,
    stock: product.stock ?? 0,
    availableStock: product.availableStock ?? product.stock ?? 0,
  };
}


export async function getAdminProducts(query: ProductListQuery) {
  const filters = await getProductFilters(query, true);
  const [products, total] = await Promise.all([
    Product.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean(),
    Product.countDocuments(filters),
  ]);

  const items = products.map((product) => {
    const record = product as typeof product & {
      category?: { _id?: unknown; name?: string; slug?: string } | null;
      brand?: {
        _id?: unknown;
        name?: string;
        slug?: string;
        logo?: string;
      } | null;
    };
    const category = record.category ?? null;
    const brand = record.brand ?? null;

    return {
      ...record,
      category,
      categoryId: category?._id ? String(category._id) : null,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      brand,
      brandId: brand?._id ? String(brand._id) : null,
      brandName: brand?.name ?? null,
    };
  });

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductById(id: string, storeId?: string) {
  validateProductId(id);
  if (storeId) {
    await validateStoreContext(storeId);
  }

  const product = await Product.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  }).lean();

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (storeId) {
    const inventories = await StoreInventory.find({
      store: storeId,
      product: id,
      deletedAt: null,
    }).lean();

    const inventoryMap = new Map<string, StoreInventoryDocument>();
    for (const inv of inventories) {
      inventoryMap.set(
        `${String(inv.product)}_${inv.variantSku || ''}`,
        inv as unknown as StoreInventoryDocument,
      );
    }

    return normalizeProductDto(
      mapProductWithStoreInventory(
        product as unknown as Record<string, unknown>,
        inventoryMap,
        storeId,
      ),
    );
  }

  return normalizeProductDto(product);
}

export async function getProductBySlug(slug: string, storeId?: string) {
  if (storeId) {
    await validateStoreContext(storeId);
  }

  const product = await Product.findOne({
    slug: slug.toLowerCase(),
    active: true,
    deletedAt: null,
  }).lean();

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  const [category, brand, relatedProducts] = await Promise.all([
    Category.findOne({ _id: product.category, deletedAt: null }).lean(),
    product.brand
      ? Brand.findOne({ _id: product.brand, deletedAt: null }).lean()
      : null,
    Product.find({
      category: product.category,
      _id: { $ne: product._id },
      active: true,
      deletedAt: null,
    })
      .sort({ displayOrder: 1 })
      .limit(8)
      .lean(),
  ]);

  let mappedProduct: Record<string, unknown> = product as unknown as Record<
    string,
    unknown
  >;
  let mappedRelated = relatedProducts as unknown as Record<string, unknown>[];

  if (storeId) {
    const allProductIds = [product._id, ...relatedProducts.map((p) => p._id)];
    const inventories = await StoreInventory.find({
      store: storeId,
      product: { $in: allProductIds },
      deletedAt: null,
    }).lean();

    const inventoryMap = new Map<string, StoreInventoryDocument>();
    for (const inv of inventories) {
      inventoryMap.set(
        `${String(inv.product)}_${inv.variantSku || ''}`,
        inv as unknown as StoreInventoryDocument,
      );
    }

    mappedProduct = mapProductWithStoreInventory(
      product as unknown as Record<string, unknown>,
      inventoryMap,
      storeId,
    );
    mappedRelated = relatedProducts.map((p) =>
      mapProductWithStoreInventory(
        p as unknown as Record<string, unknown>,
        inventoryMap,
        storeId,
      ),
    );
  }

  return {
    ...normalizeProductDto(mappedProduct),
    category,
    brand,
    relatedProducts: mappedRelated.map((p) => normalizeProductDto(p)),
  };
}


export async function createProduct(input: ProductInput, userId: string) {
  await validateCategory(input.category);

  if (input.brand) {
    await validateBrand(input.brand);
  }

  return Product.create({ ...input, createdBy: userId, updatedBy: userId });
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
  userId: string,
) {
  validateProductId(id);

  if (input.category) {
    await validateCategory(input.category);
  }

  if (input.brand) {
    await validateBrand(input.brand);
  }

  const product = await Product.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  return product;
}

export async function deleteProduct(id: string, userId: string) {
  validateProductId(id);

  const product = await Product.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  return product;
}

type ProductUploadFiles = {
  thumbnail?: Express.Multer.File;
  gallery?: Express.Multer.File[];
};

export async function uploadProductImages(files: ProductUploadFiles) {
  if (!files.thumbnail && !files.gallery?.length) {
    throw serviceError(
      'At least one product image file is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const [thumbnail, gallery] = await Promise.all([
    files.thumbnail
      ? uploadImage(files.thumbnail.buffer, { folder: 'bootkit/products' })
      : undefined,
    Promise.all(
      (files.gallery ?? []).map((file) =>
        uploadImage(file.buffer, { folder: 'bootkit/products' }),
      ),
    ),
  ]);

  return {
    ...(thumbnail ? { thumbnail: thumbnail.secureUrl } : {}),
    ...(gallery.length
      ? { gallery: gallery.map((image) => image.secureUrl) }
      : {}),
  };
}

export async function getLegacyProductsReport() {
  const products = await Product.find({ deletedAt: null }).lean();
  const allCategories = await Category.find({ deletedAt: null }).select('_id name slug parentCategory').lean();

  const { computeCategoryLevelAndPath } = await import('./category.service');
  const catMap = new Map<string, any>();
  allCategories.forEach((c) => catMap.set(String(c._id), c));

  const legacyProducts = [];
  for (const product of products) {
    if (!product.category) continue;
    const catDoc = catMap.get(String(product.category));
    if (!catDoc) continue;
    const { level } = await computeCategoryLevelAndPath(catDoc, catMap);
    if (level < 3) {
      legacyProducts.push({
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        sku: product.sku || '',
        category: {
          id: String(catDoc._id),
          name: catDoc.name,
          slug: catDoc.slug,
          level,
        },
      });
    }
  }

  return legacyProducts;
}

