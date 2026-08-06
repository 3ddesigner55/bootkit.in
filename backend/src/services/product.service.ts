import { isValidObjectId, type SortOrder } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Product from '../models/product.model';
import type { ApiError } from '../types/api';
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

  const category = await Category.exists({ _id: categoryId, deletedAt: null });

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.BAD_REQUEST);
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
    default:
      return { displayOrder: 1, createdAt: -1 };
  }
}

function getProductFilters(query: ProductListQuery): Record<string, unknown> {
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
      { shortDescription: searchExpression },
    ];
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.brand) {
    filters.brand = query.brand;
  }

  if (query.featured !== undefined) {
    filters.featured = query.featured;
  }

  if (query.showOnHome !== undefined) {
    filters.showOnHome = query.showOnHome;
  }

  return filters;
}

export async function getProducts(query: ProductListQuery) {
  const filters = getProductFilters(query);
  const [products, total] = await Promise.all([
    Product.find(filters)
      .sort(getSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filters),
  ]);

  return {
    items: products,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductById(id: string) {
  validateProductId(id);

  const product = await Product.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  }).lean();

  if (!product) {
    throw serviceError('Product not found.', HTTP_STATUS.NOT_FOUND);
  }

  return product;
}

export async function getProductBySlug(slug: string) {
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

  return {
    product,
    category,
    brand,
    relatedProducts,
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
