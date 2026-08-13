import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import type { SearchQuery } from '../validators/search.validator';

type PopulatedCategory = {
  _id?: unknown;
  name?: string;
  slug?: string;
};

type PopulatedBrand = {
  _id?: unknown;
  name?: string;
};

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toProductSearchResult(product: unknown) {
  const record = product as {
    category?: PopulatedCategory | null;
    brand?: PopulatedBrand | null;
    rating?: number;
  } & Record<string, unknown>;
  const category = record.category ?? null;
  const brand = record.brand ?? null;
  const categoryId = category?._id ? String(category._id) : null;
  const brandId = brand?._id ? String(brand._id) : null;

  return {
    ...record,
    categoryId,
    categorySlug: category?.slug ?? null,
    categoryName: category?.name ?? null,
    categoryReference: categoryId
      ? {
          id: categoryId,
          name: category?.name ?? null,
          slug: category?.slug ?? null,
        }
      : null,
    brandId,
    brandName: brand?.name ?? null,
    brandReference: brandId
      ? {
          id: brandId,
          name: brand?.name ?? null,
        }
      : null,
    rating: typeof record.rating === 'number' ? record.rating : 0,
  };
}

export async function globalSearch(query: SearchQuery) {
  const searchExpression = new RegExp(escapeRegularExpression(query.q), 'i');
  const skip = (query.page - 1) * query.limit;

  const productFilters = {
    active: true,
    deletedAt: null,
    $or: [
      { name: searchExpression },
      { slug: searchExpression },
      { shortDescription: searchExpression },
    ],
  };
  const categoryFilters = {
    active: true,
    deletedAt: null,
    $or: [{ name: searchExpression }, { slug: searchExpression }],
  };
  const brandFilters = {
    active: true,
    deletedAt: null,
    $or: [{ name: searchExpression }, { slug: searchExpression }],
  };
  const storeFilters = {
    active: true,
    deletedAt: null,
    $or: [{ name: searchExpression }, { city: searchExpression }],
  };

  const [
    products,
    categories,
    brands,
    stores,
    totalProducts,
    totalCategories,
    totalBrands,
    totalStores,
  ] = await Promise.all([
    Product.find(productFilters)
      .skip(skip)
      .limit(query.limit)
      .populate('category', 'name slug')
      .populate('brand', 'name')
      .lean(),
    Category.find(categoryFilters).skip(skip).limit(query.limit).lean(),
    Brand.find(brandFilters).skip(skip).limit(query.limit).lean(),
    Store.find(storeFilters).skip(skip).limit(query.limit).lean(),
    Product.countDocuments(productFilters),
    Category.countDocuments(categoryFilters),
    Brand.countDocuments(brandFilters),
    Store.countDocuments(storeFilters),
  ]);

  const total = totalProducts + totalCategories + totalBrands + totalStores;

  return {
    products: products.map(toProductSearchResult),
    categories,
    brands,
    stores,
    meta: {
      q: query.q,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      totals: {
        products: totalProducts,
        categories: totalCategories,
        brands: totalBrands,
        stores: totalStores,
      },
    },
  };
}
