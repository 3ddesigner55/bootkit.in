import { isValidObjectId, Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Category from '../models/category.model';
import CatalogAudit from '../models/catalogAudit.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import { uploadImage } from '../utils/upload';
import type {
  AdminCategoryListQuery,
  CategoryInput,
  CategoryUpdateInput,
} from '../validators/category.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateCategoryId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }
}

export async function getCategories() {
  return Category.aggregate([
    {
      $match: {
        active: true,
        deletedAt: null,
      },
    },
    {
      $lookup: {
        from: 'products',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$category', '$$categoryId'] },
                  { $eq: ['$active', true] },
                  { $eq: ['$deletedAt', null] },
                  { $ne: ['$thumbnail', ''] },
                  { $ne: ['$thumbnail', null] },
                ],
              },
            },
          },
          {
            $project: {
              thumbnail: 1,
            },
          },
        ],
        as: 'matchingProducts',
      },
    },
    {
      $addFields: {
        productCount: { $size: '$matchingProducts' },
        productThumbnails: {
          $slice: [
            {
              $reduce: {
                input: '$matchingProducts.thumbnail',
                initialValue: [],
                in: {
                  $cond: [
                    { $in: ['$$this', '$$value'] },
                    '$$value',
                    { $concatArrays: ['$$value', ['$$this']] },
                  ],
                },
              },
            },
            4,
          ],
        },
      },
    },
    {
      $project: {
        matchingProducts: 0,
      },
    },
    {
      $sort: {
        displayOrder: 1,
        sortOrder: 1,
      },
    },
  ]);
}

export async function getCategoryDescendantIds(
  categoryId: string | Types.ObjectId,
): Promise<Types.ObjectId[]> {
  const children = await Category.find({
    parentCategory: categoryId,
    deletedAt: null,
  })
    .select('_id')
    .lean();

  if (children.length === 0) {
    return [];
  }

  const childIds = children.map((c) => c._id as Types.ObjectId);
  const grandchildren = await Category.find({
    parentCategory: { $in: childIds },
    deletedAt: null,
  })
    .select('_id')
    .lean();

  const grandchildIds = grandchildren.map((g) => g._id as Types.ObjectId);
  return [...childIds, ...grandchildIds];
}

export async function computeCategoryLevelAndPath(
  category: Record<string, any>,
  allCategoriesMap?: Map<string, Record<string, any>>,
): Promise<{ level: 1 | 2 | 3; hierarchyPath: string; ancestors: Array<{ id: string; name: string; slug: string; level: number }> }> {
  const ancestors: Array<{ id: string; name: string; slug: string; level: number }> = [];
  let currentParentId = category.parentCategory
    ? typeof category.parentCategory === 'object' && category.parentCategory._id
      ? String(category.parentCategory._id)
      : String(category.parentCategory)
    : null;

  let depth = 0;
  while (currentParentId && depth < 10) {
    let parentDoc: any = null;
    if (allCategoriesMap && allCategoriesMap.has(currentParentId)) {
      parentDoc = allCategoriesMap.get(currentParentId);
    } else {
      parentDoc = await Category.findOne({ _id: currentParentId, deletedAt: null }).select('_id name slug parentCategory').lean();
    }

    if (!parentDoc) break;
    ancestors.unshift({
      id: String(parentDoc._id),
      name: parentDoc.name,
      slug: parentDoc.slug,
      level: 1, // temporary, assigned below
    });

    currentParentId = parentDoc.parentCategory ? String(parentDoc.parentCategory) : null;
    depth++;
  }

  // Assign levels to ancestors
  ancestors.forEach((anc, idx) => {
    anc.level = idx + 1;
  });

  const level = (Math.min(3, ancestors.length + 1)) as 1 | 2 | 3;
  const pathParts = [...ancestors.map((a) => a.name), category.name];
  const hierarchyPath = pathParts.join(' > ');

  return { level, hierarchyPath, ancestors };
}

export async function getCategoryOptions() {
  const categories = await Category.find({ active: true, deletedAt: null })
    .sort({ displayOrder: 1, sortOrder: 1, name: 1 })
    .select('_id name slug parentCategory')
    .lean();

  const map = new Map<string, any>();
  categories.forEach((c) => map.set(String(c._id), c));

  const result = [];
  for (const category of categories) {
    const { level, hierarchyPath } = await computeCategoryLevelAndPath(category, map);
    result.push({
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      parentCategory: category.parentCategory
        ? String(category.parentCategory)
        : null,
      level,
      hierarchyPath,
    });
  }

  return result;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAdminCategories(query: AdminCategoryListQuery) {
  const filter: {
    deletedAt: null;
    active?: boolean;
    featured?: boolean;
    $or?: Array<Record<string, { $regex: string; $options: string }>>;
  } = { deletedAt: null };

  if (query.active !== undefined) {
    filter.active = query.active;
  }

  if (query.featured !== undefined) {
    filter.featured = query.featured;
  }

  if (query.search) {
    const searchExpression = escapeRegularExpression(query.search);
    const search = { $regex: searchExpression, $options: 'i' };
    filter.$or = [{ name: search }, { slug: search }, { description: search }];
  }

  const [categories, total, allCategories] = await Promise.all([
    Category.find(filter)
      .populate('parentCategory', '_id name slug')
      .sort({ [query.sortField]: query.sortDirection, _id: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Category.countDocuments(filter),
    Category.find({ deletedAt: null }).select('_id name slug parentCategory').lean(),
  ]);

  const map = new Map<string, any>();
  allCategories.forEach((c) => map.set(String(c._id), c));

  const enhancedCategories = [];
  for (const cat of categories) {
    const { level, hierarchyPath } = await computeCategoryLevelAndPath(cat, map);
    enhancedCategories.push({
      ...cat,
      level,
      hierarchyPath,
    });
  }

  return {
    categories: enhancedCategories,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getCategoryById(id: string) {
  validateCategoryId(id);

  const category = await Category.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  })
    .populate('parentCategory', '_id name slug')
    .lean();

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  const { level, hierarchyPath, ancestors } = await computeCategoryLevelAndPath(category);
  return {
    ...category,
    level,
    hierarchyPath,
    ancestors,
  };
}

async function validateAndResolveParentHierarchy(
  categoryId: string | undefined,
  parentCategoryId: string | null | undefined,
  currentCollectionHub?: string | null,
  currentHomeSection?: string | null,
) {
  if (parentCategoryId === undefined) {
    return {
      parentCategory: undefined,
      collectionHub: currentCollectionHub,
      homeSection: currentHomeSection,
    };
  }

  if (parentCategoryId === null || parentCategoryId === '') {
    return {
      parentCategory: null,
      collectionHub: currentCollectionHub ?? null,
      homeSection: currentHomeSection ?? null,
    };
  }

  if (!isValidObjectId(parentCategoryId)) {
    throw serviceError('Invalid parent category ID.', HTTP_STATUS.BAD_REQUEST);
  }

  if (categoryId && String(categoryId) === String(parentCategoryId)) {
    throw serviceError(
      'A category cannot be its own parent.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const parent = await Category.findOne({
    _id: parentCategoryId,
    deletedAt: null,
  }).lean();

  if (!parent) {
    throw serviceError('Parent category not found.', HTTP_STATUS.BAD_REQUEST);
  }

  if (!parent.active) {
    throw serviceError(
      'Parent category must be active.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Calculate parent's depth / level from root
  let parentLevel = 1;
  let currentAncestorId = parent.parentCategory;
  let depth = 0;
  const maxDepth = 10;

  while (currentAncestorId && depth < maxDepth) {
    if (categoryId && String(currentAncestorId) === String(categoryId)) {
      throw serviceError(
        'Invalid hierarchy: parent category cannot be a descendant of itself.',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const ancestor = await Category.findOne({
      _id: currentAncestorId,
      deletedAt: null,
    })
      .select('parentCategory')
      .lean();

    if (!ancestor) break;
    parentLevel++;
    currentAncestorId = ancestor.parentCategory;
    depth++;
  }

  // Maximum hierarchy depth is 3:
  // Parent Level 1 -> New Category Level 2 (Allowed)
  // Parent Level 2 -> New Category Level 3 (Allowed - Leaf)
  // Parent Level 3 -> New Category Level 4 (REJECTED)
  if (parentLevel >= 3) {
    throw serviceError(
      'Maximum category hierarchy depth of 3 levels exceeded. A Level-3 Leaf Category cannot have child categories.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // If updating an existing category, verify that its existing children won't be pushed past Level 3
  if (categoryId) {
    const directChildren = await Category.find({
      parentCategory: categoryId,
      deletedAt: null,
    }).select('_id').lean();

    if (directChildren.length > 0) {
      // If this category already has direct children, its new level would be parentLevel + 1
      // If parentLevel is 2, new level is 3, making its children level 4!
      if (parentLevel >= 2) {
        throw serviceError(
          'Cannot assign parent: this category has child subcategories and would exceed the maximum depth of 3 levels.',
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }
  }


  const resolvedCollectionHub =
    currentCollectionHub !== undefined &&
    currentCollectionHub !== null &&
    currentCollectionHub !== ''
      ? currentCollectionHub
      : (parent.collectionHub ?? null);

  const resolvedHomeSection =
    currentHomeSection !== undefined &&
    currentHomeSection !== null &&
    currentHomeSection !== ''
      ? currentHomeSection
      : (parent.homeSection ?? null);

  return {
    parentCategory: parent._id,
    collectionHub: resolvedCollectionHub,
    homeSection: resolvedHomeSection,
  };
}

export async function createCategory(input: CategoryInput, userId: string) {
  const { parentCategory, collectionHub, homeSection } =
    await validateAndResolveParentHierarchy(
      undefined,
      input.parentCategory,
      input.collectionHub,
      input.homeSection,
    );

  return Category.create({
    ...input,
    parentCategory,
    collectionHub,
    homeSection,
    createdBy: userId,
    updatedBy: userId,
  });
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
  userId: string,
) {
  validateCategoryId(id);

  let resolvedFields: Partial<CategoryInput> = {};

  if (input.parentCategory !== undefined) {
    const { parentCategory, collectionHub, homeSection } =
      await validateAndResolveParentHierarchy(
        id,
        input.parentCategory,
        input.collectionHub,
        input.homeSection,
      );

    resolvedFields = {
      parentCategory,
      collectionHub,
      homeSection,
    };
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, ...resolvedFields, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  return category;
}

export async function deleteCategory(id: string, userId: string) {
  validateCategoryId(id);

  const activeChildrenCount = await Category.countDocuments({
    parentCategory: id,
    deletedAt: null,
  });

  if (activeChildrenCount > 0) {
    throw serviceError(
      'Cannot delete a category that has active subcategories. Please reassign or delete its subcategories first.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const Product = (await import('../models/product.model')).default;
  const assignedProductsCount = await Product.countDocuments({
    category: id,
    deletedAt: null,
  });

  if (assignedProductsCount > 0) {
    throw serviceError(
      'Cannot delete a category that has assigned products. Please reassign or delete its products first.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  return category;
}

export async function getCategoryTree() {
  const allCategories = await Category.find({ active: true, deletedAt: null })
    .sort({ displayOrder: 1, sortOrder: 1, name: 1 })
    .select('_id name slug icon image banner parentCategory displayOrder sortOrder')
    .lean();

  const categoryMap = new Map<string, any>();
  allCategories.forEach((cat) => {
    categoryMap.set(String(cat._id), {
      ...cat,
      id: String(cat._id),
      children: [],
    });
  });

  const rootCategories: any[] = [];

  categoryMap.forEach((cat) => {
    if (!cat.parentCategory) {
      cat.level = 1;
      rootCategories.push(cat);
    } else {
      const parentId = String(cat.parentCategory);
      const parent = categoryMap.get(parentId);
      if (parent) {
        cat.level = (parent.level || 1) + 1;
        parent.children.push(cat);
      } else {
        cat.level = 1;
        rootCategories.push(cat);
      }
    }
  });

  return rootCategories;
}

export async function getCategoryBySlug(slug: string) {
  const category = await Category.findOne({
    slug: slug.toLowerCase(),
    active: true,
    deletedAt: null,
  })
    .populate('parentCategory', '_id name slug')
    .lean();

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  const allActiveCategories = await Category.find({ active: true, deletedAt: null })
    .select('_id name slug icon image parentCategory sortOrder displayOrder')
    .sort({ displayOrder: 1, sortOrder: 1 })
    .lean();

  const map = new Map<string, any>();
  allActiveCategories.forEach((c) => map.set(String(c._id), c));

  const { level, hierarchyPath, ancestors } = await computeCategoryLevelAndPath(category, map);

  // Find direct children
  const children = allActiveCategories
    .filter((c) => c.parentCategory && String(c.parentCategory) === String(category._id))
    .map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      image: c.image,
    }));

  // Find sibling categories (same parent)
  const currentParentId = category.parentCategory
    ? typeof category.parentCategory === 'object' && category.parentCategory._id
      ? String(category.parentCategory._id)
      : String(category.parentCategory)
    : null;

  const siblings = allActiveCategories
    .filter((c) => {
      const pId = c.parentCategory ? String(c.parentCategory) : null;
      return pId === currentParentId;
    })
    .map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      image: c.image,
    }));

  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    image: category.image,
    banner: category.banner,
    level,
    hierarchyPath,
    ancestors,
    parentCategory: category.parentCategory,
    children,
    siblings,
  };
}

type CategoryUploadFiles = {
  image?: Express.Multer.File;
  banner?: Express.Multer.File;
};

export async function uploadCategoryImages(files: CategoryUploadFiles) {
  if (!files.image && !files.banner) {
    throw serviceError(
      'At least one category image file is required.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const [image, banner] = await Promise.all([
    files.image
      ? uploadImage(files.image.buffer, { folder: 'bootkit/categories' })
      : undefined,
    files.banner
      ? uploadImage(files.banner.buffer, { folder: 'bootkit/categories' })
      : undefined,
  ]);

  return {
    ...(image ? { image: image.secureUrl } : {}),
    ...(banner ? { banner: banner.secureUrl } : {}),
  };
}

export async function getCategoryProducts(
  slug: string,
  query: {
    storeId?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    limit?: string;
    availability?: string;
  }
) {
  const { resolveStoreContext } = await import('./store.service');
  const store = await resolveStoreContext(query.storeId);
  const storeId = store ? String(store._id) : undefined;

  const category = await Category.findOne({
    slug: slug.toLowerCase(),
    active: true,
    deletedAt: null,
  }).lean();

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  const allActiveCategories = await Category.find({ active: true, deletedAt: null })
    .select('_id name slug icon image parentCategory sortOrder displayOrder')
    .sort({ displayOrder: 1, sortOrder: 1 })
    .lean();

  const map = new Map<string, any>();
  allActiveCategories.forEach((c) => map.set(String(c._id), c));

  const { level, hierarchyPath, ancestors } = await computeCategoryLevelAndPath(category, map);

  // Find all descendant category IDs recursively
  const descendantIds = await getCategoryDescendantIds(category._id);
  const targetCategoryIds = [category._id, ...descendantIds];

  // base filter for products
  const productFilter: any = {
    category: { $in: targetCategoryIds },
    active: true,
    deletedAt: null,
  };

  // If brand is passed, match it by slug or id
  if (query.brand) {
    const Brand = (await import('../models/brand.model')).default;
    if (isValidObjectId(query.brand)) {
      productFilter.brand = query.brand;
    } else {
      const brandDoc = await Brand.findOne({ slug: query.brand.toLowerCase(), deletedAt: null }).select('_id').lean();
      if (brandDoc) {
        productFilter.brand = brandDoc._id;
      } else {
        productFilter.brand = query.brand;
      }
    }
  }

  const Product = (await import('../models/product.model')).default;
  const allCategoryProducts = await Product.find(productFilter)
    .populate('category', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();

  const productIds = allCategoryProducts.map((p) => p._id);

  // Fetch store inventory
  let inventoryMap = new Map<string, any>();
  if (storeId) {
    const StoreInventory = (await import('../models/storeInventory.model')).default;
    const inventories = await StoreInventory.find({
      store: storeId,
      product: { $in: productIds },
      deletedAt: null,
    }).lean();

    for (const inv of inventories) {
      inventoryMap.set(`${String(inv.product)}_${inv.variantSku || ''}`, inv);
    }
  }

  // Map product inventory and normalize DTOs
  const { mapProductWithStoreInventory, normalizeProductDto } = await import('./product.service');
  let productsWithInventory: any[] = allCategoryProducts.map((product) => {
    const mapped = mapProductWithStoreInventory(
      product as any,
      inventoryMap as any,
      storeId,
    );
    return normalizeProductDto(mapped);
  });

  // Filter out unavailable or inactive products in inventory
  productsWithInventory = productsWithInventory.filter((p) => p.active && p.availableStock > 0);

  // Apply price range filter
  if (query.minPrice) {
    const min = parseFloat(query.minPrice);
    if (!isNaN(min)) {
      productsWithInventory = productsWithInventory.filter((p) => p.sellingPrice >= min);
    }
  }
  if (query.maxPrice) {
    const max = parseFloat(query.maxPrice);
    if (!isNaN(max)) {
      productsWithInventory = productsWithInventory.filter((p) => p.sellingPrice <= max);
    }
  }

  // Sort
  if (query.sort === 'price-asc') {
    productsWithInventory.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (query.sort === 'price-desc') {
    productsWithInventory.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (query.sort === 'name-asc') {
    productsWithInventory.sort((a, b) => a.name.localeCompare(b.name));
  } else if (query.sort === 'name-desc') {
    productsWithInventory.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    // default: displayOrder
    productsWithInventory.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  // Dynamic brand facets from available products in the store
  const availableBrandsMap = new Map<string, any>();
  productsWithInventory.forEach((p) => {
    if (p.brand && p.brand._id) {
      availableBrandsMap.set(String(p.brand._id), {
        id: String(p.brand._id),
        name: p.brand.name,
        slug: p.brand.slug,
        logo: p.brand.logo || '',
      });
    }
  });
  const availableBrands = Array.from(availableBrandsMap.values());

  // Pagination
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '20', 10);
  const total = productsWithInventory.length;
  const paginatedProducts = productsWithInventory.slice((page - 1) * limit, page * limit);

  // Sibling categories for sidebar
  const currentParentId = category.parentCategory
    ? typeof category.parentCategory === 'object' && (category.parentCategory as any)._id
      ? String((category.parentCategory as any)._id)
      : String(category.parentCategory)
    : null;

  const siblings = allActiveCategories
    .filter((c) => {
      const pId = c.parentCategory ? String(c.parentCategory) : null;
      return pId === currentParentId;
    })
    .map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      image: c.image,
    }));

  return {
    category: {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      level,
      hierarchyPath,
      ancestors,
    },
    siblings,
    products: paginatedProducts,
    brands: availableBrands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminCategorySummary() {
  const allCategories = await Category.find({ deletedAt: null }).lean();
  const Product = (await import('../models/product.model')).default;

  const categoryMap = new Map<string, any>();
  allCategories.forEach((c) => categoryMap.set(String(c._id), c));

  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;
  let activeCount = 0;
  let inactiveCount = 0;

  for (const cat of allCategories) {
    if (cat.active) activeCount++;
    else inactiveCount++;

    if (!cat.parentCategory) {
      l1Count++;
    } else {
      const parent = categoryMap.get(String(cat.parentCategory));
      if (!parent || !parent.parentCategory) {
        l2Count++;
      } else {
        l3Count++;
      }
    }
  }

  return {
    total: allCategories.length,
    mainCategories: l1Count,
    subcategories: l2Count,
    leafCategories: l3Count,
    active: activeCount,
    inactive: inactiveCount,
  };
}

export async function getAdminCategoryTree() {
  const allCategories = await Category.find({ deletedAt: null })
    .sort({ sortOrder: 1, displayOrder: 1, name: 1 })
    .lean();

  const Product = (await import('../models/product.model')).default;
  const productCounts = await Product.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const productCountMap = new Map<string, number>();
  productCounts.forEach((pc) => {
    if (pc._id) productCountMap.set(String(pc._id), pc.count);
  });

  const categoryMap = new Map<string, any>();
  allCategories.forEach((cat) => {
    categoryMap.set(String(cat._id), {
      ...cat,
      id: String(cat._id),
      productCount: productCountMap.get(String(cat._id)) || 0,
      children: [],
      level: 1,
      fullPath: cat.name,
    });
  });

  const rootCategories: any[] = [];

  categoryMap.forEach((cat) => {
    if (!cat.parentCategory) {
      cat.level = 1;
      cat.fullPath = cat.name;
      rootCategories.push(cat);
    } else {
      const parentId = String(cat.parentCategory);
      const parent = categoryMap.get(parentId);
      if (parent) {
        cat.level = (parent.level || 1) + 1;
        cat.fullPath = `${parent.fullPath} > ${cat.name}`;
        parent.children.push(cat);
      } else {
        cat.level = 1;
        cat.fullPath = cat.name;
        rootCategories.push(cat);
      }
    }
  });

  return rootCategories;
}

export function getCategoryCsvTemplate(): string {
  return `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Grocery & Kitchen,grocery-kitchen,,Daily grocery products,/images/categories/grocery.jpg,/images/icons/grocery.png,,true,1,Grocery & Kitchen,
Fruits & Vegetables,fruits-vegetables,grocery-kitchen,Fresh fruits and vegetables,/images/categories/fruits.jpg,/images/icons/fruits.png,,true,1,Fruits & Vegetables,
Fresh Fruits,fresh-fruits,fruits-vegetables,Fresh seasonal fruits,/images/categories/fresh-fruits.jpg,,,true,1,Fresh Fruits,`;
}

export async function parseAndValidateCategoryCsv(csvText: string) {
  const cleanCsv = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanCsv.split(/\r?\n/).filter((l) => l.trim() !== '');

  if (lines.length <= 1) {
    throw serviceError('CSV file has no data rows.', HTTP_STATUS.BAD_REQUEST);
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['name', 'slug'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw serviceError(`Missing required CSV columns: ${missing.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  let existingDbCategories: any[] = [];
  if (Category.db?.readyState === 1) {
    existingDbCategories = await Category.find({ deletedAt: null }).lean();
  }
  const dbSlugMap = new Map<string, any>();
  existingDbCategories.forEach((c) => dbSlugMap.set(c.slug.toLowerCase(), c));

  const csvRows: any[] = [];
  const seenCsvSlugs = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map((c) => c.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => { record[h] = rawCols[idx] || ''; });

    const name = record['name'] || '';
    const slug = (record['slug'] || createSlug(name)).toLowerCase();
    const parentSlug = (record['parentslug'] || record['parentcategory'] || '').toLowerCase();
    const description = record['description'] || '';
    const image = record['image'] || '';
    const icon = record['icon'] || '';
    const banner = record['banner'] || '';
    const active = record['active'] === '' ? true : record['active'].toLowerCase() === 'true';
    const sortOrder = parseInt(record['sortorder'] || '0', 10) || 0;

    const rowObj = {
      rowIndex: i,
      name,
      slug,
      parentSlug,
      description,
      image,
      icon,
      banner,
      active,
      sortOrder,
      errors: [] as string[],
      status: 'VALID',
      computedLevel: 1,
      fullPath: name,
      action: dbSlugMap.has(slug) ? 'UPDATE' : 'CREATE',
    };

    if (!name) rowObj.errors.push('Category name is required.');
    if (!slug) rowObj.errors.push('Category slug is required.');

    if (seenCsvSlugs.has(slug)) {
      rowObj.errors.push(`Duplicate slug "${slug}" within CSV.`);
    } else {
      seenCsvSlugs.add(slug);
    }

    if (parentSlug && parentSlug === slug) {
      rowObj.errors.push('A category cannot be its own parent.');
    }

    csvRows.push(rowObj);
  }

  // Multi-pass resolution for dependency levels (L1 -> L2 -> L3)
  const csvSlugMap = new Map<string, any>();
  csvRows.forEach((r) => csvSlugMap.set(r.slug, r));

  function resolveParentChain(slug: string, visited = new Set<string>()): { level: number; path: string; error?: string } {
    if (visited.has(slug)) {
      return { level: 1, path: slug, error: 'Hierarchy cycle detected in CSV.' };
    }
    visited.add(slug);

    const inCsv = csvSlugMap.get(slug);
    if (inCsv) {
      if (!inCsv.parentSlug) {
        return { level: 1, path: inCsv.name };
      }
      const parentRes = resolveParentChain(inCsv.parentSlug, new Set(visited));
      return {
        level: parentRes.level + 1,
        path: `${parentRes.path} > ${inCsv.name}`,
        error: parentRes.error,
      };
    }

    const inDb = dbSlugMap.get(slug);
    if (inDb) {
      let dbLevel = 1;
      let dbPath = inDb.name;
      if (inDb.parentCategory) {
        dbLevel = 2;
      }
      return { level: dbLevel, path: dbPath };
    }

    return { level: 1, path: slug, error: `Parent slug "${slug}" not found in database or CSV.` };
  }

  for (const r of csvRows) {
    if (!r.parentSlug) {
      r.computedLevel = 1;
      r.fullPath = r.name;
    } else {
      const parentRes = resolveParentChain(r.parentSlug);
      r.computedLevel = parentRes.level + 1;
      r.fullPath = `${parentRes.path} > ${r.name}`;

      if (parentRes.error) {
        r.errors.push(parentRes.error);
      }

      if (r.computedLevel > 3) {
        r.errors.push(`Maximum category depth of 3 levels exceeded. "${r.parentSlug}" is Level ${parentRes.level} and cannot be a parent.`);
      }
    }

    if (r.computedLevel === 1 && !r.icon) {
      r.errors.push('Main Category (Level 1) must have an icon/emoji.');
    }
    if (r.computedLevel > 1 && !r.image) {
      r.errors.push(`${r.computedLevel === 2 ? 'Sub-Category' : 'Leaf Category'} (Level ${r.computedLevel}) must have an image URL.`);
    }

    if (r.errors.length > 0) {
      r.status = 'ERROR';
    }
  }

  const validCount = csvRows.filter((r) => r.status === 'VALID').length;
  const errorCount = csvRows.filter((r) => r.status === 'ERROR').length;

  return {
    totalRows: csvRows.length,
    validCount,
    errorCount,
    rows: csvRows,
  };
}

export async function executeCategoryCsvImport(
  rows: any[],
  mode: 'CREATE_ONLY' | 'UPSERT_BY_SLUG' = 'CREATE_ONLY',
  userId: string,
) {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Multi-pass execution: Level 1 first, then Level 2, then Level 3
  const sortedRows = [...rows].sort((a, b) => (a.computedLevel || 1) - (b.computedLevel || 1));

  for (const r of sortedRows) {
    try {
      let parentId: any = null;
      if (r.parentSlug) {
        const parentDoc = await Category.findOne({ slug: r.parentSlug, deletedAt: null }).lean();
        if (parentDoc) parentId = parentDoc._id;
      }

      const existing = await Category.findOne({ slug: r.slug, deletedAt: null });

      if (existing) {
        if (mode === 'UPSERT_BY_SLUG') {
          existing.name = r.name;
          if (r.description) existing.description = r.description;
          if (r.image) existing.image = r.image;
          if (r.icon) existing.icon = r.icon;
          if (r.banner) existing.banner = r.banner;
          existing.active = r.active !== false;
          existing.sortOrder = r.sortOrder || 0;
          if (parentId) existing.parentCategory = parentId;
          existing.updatedBy = userId as any;
          await existing.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await Category.create({
          name: r.name,
          slug: r.slug,
          parentCategory: parentId,
          description: r.description || '',
          image: r.image || '',
          icon: r.icon || '',
          banner: r.banner || '',
          active: r.active !== false,
          sortOrder: r.sortOrder || 0,
          createdBy: userId as any,
          updatedBy: userId as any,
        });
        createdCount++;
      }
    } catch (err) {
      failedCount++;
    }
  }

  const batchId = `cat-import-${Date.now()}`;
  const actor = await User.findById(userId);

  await CatalogAudit.create({
    actor: userId as any,
    role: actor?.role || 'ADMIN',
    action: 'CATEGORIES_CSV_IMPORTED',
    entityType: 'CATEGORY',
    afterValue: { createdCount, updatedCount, skippedCount, failedCount, batchId, mode },
    reason: 'Category CSV Bulk Import Execution',
  });

  return {
    batchId,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
  };
}

export async function reorderCategories(
  items: Array<{ id: string; sortOrder: number }>,
  userId: string,
): Promise<void> {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { sortOrder: item.sortOrder, updatedBy: userId } },
    },
  }));

  if (bulkOps.length > 0) {
    await Category.bulkWrite(bulkOps);

    const actor = await User.findById(userId);
    await CatalogAudit.create({
      actor: userId as any,
      role: actor?.role || 'ADMIN',
      action: 'CATEGORIES_REORDERED',
      entityType: 'CATEGORY',
      afterValue: items,
      reason: 'Drag and drop hierarchy sorting reorder',
    });
  }
}



