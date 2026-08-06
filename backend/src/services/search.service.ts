import Brand from '../models/brand.model';
import Category from '../models/category.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import type { SearchQuery } from '../validators/search.validator';

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    Product.find(productFilters).skip(skip).limit(query.limit).lean(),
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
    products,
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
