import { isValidObjectId, type SortOrder } from 'mongoose';

import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Product from '../models/product.model';
import type { CatalogQuery } from '../validators/catalog.validator';

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveCategory(category: string): Promise<string | null> {
  const categoryFilter = isValidObjectId(category)
    ? { _id: category }
    : { slug: category };
  const result = await Category.findOne({
    ...categoryFilter,
    active: true,
    deletedAt: null,
  })
    .select('_id')
    .lean();

  return result?._id.toString() ?? null;
}

async function resolveBrand(brand: string): Promise<string | null> {
  const brandFilter = isValidObjectId(brand) ? { _id: brand } : { slug: brand };
  const result = await Brand.findOne({
    ...brandFilter,
    active: true,
    deletedAt: null,
  })
    .select('_id')
    .lean();

  return result?._id.toString() ?? null;
}

function getSort(sort: CatalogQuery['sort']): Record<string, SortOrder> {
  switch (sort) {
    case 'priceAsc':
      return { sellingPrice: 1 };
    case 'priceDesc':
      return { sellingPrice: -1 };
    case 'nameAsc':
      return { name: 1 };
    case 'nameDesc':
      return { name: -1 };
    default:
      return { createdAt: -1 };
  }
}

export async function getCatalogProducts(query: CatalogQuery) {
  const [categoryId, brandId] = await Promise.all([
    query.category ? resolveCategory(query.category) : null,
    query.brand ? resolveBrand(query.brand) : null,
  ]);

  if ((query.category && !categoryId) || (query.brand && !brandId)) {
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

  const filters: Record<string, unknown> = {
    active: true,
    deletedAt: null,
    ...(categoryId ? { category: categoryId } : {}),
    ...(brandId ? { brand: brandId } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.showOnHome !== undefined ? { showOnHome: query.showOnHome } : {}),
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

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filters.sellingPrice = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }

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
