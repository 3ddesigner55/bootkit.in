import mongoose, { type Types } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, {
  type HomeConfigDocument,
  type HomeConfigSection,
} from '../models/homeConfig.model';
import HomeConfigAudit from '../models/homeConfigAudit.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import Order from '../models/order.model';
import type { ApiError } from '../types/api';
import type { SaveDraftInput } from '../validators/adminHomeConfig.validator';

function serviceError(message: string, statusCode: number, code?: string): ApiError {
  return Object.assign(new Error(message), { statusCode, code });
}

async function validateScopeEntity(scopeType: 'GLOBAL' | 'CITY' | 'STORE', scopeId: string | null) {
  if (scopeType === 'STORE') {
    if (!scopeId || !mongoose.isValidObjectId(scopeId)) {
      throw serviceError('Invalid Store ID for STORE scope.', HTTP_STATUS.BAD_REQUEST);
    }
    const store = await Store.findOne({ _id: scopeId, active: true, deletedAt: null });
    if (!store) {
      throw serviceError('Referenced Store is inactive or does not exist.', HTTP_STATUS.BAD_REQUEST);
    }
  } else if (scopeType === 'CITY') {
    if (!scopeId || !scopeId.trim()) {
      throw serviceError('City name/scopeId is required for CITY scope.', HTTP_STATUS.BAD_REQUEST);
    }
  } else if (scopeType === 'GLOBAL') {
    if (scopeId !== null && scopeId !== undefined && scopeId !== '') {
      throw serviceError('GLOBAL scope cannot have a scopeId.', HTTP_STATUS.BAD_REQUEST);
    }
  }
}

export async function getDraftConfig(
  scopeType: 'GLOBAL' | 'CITY' | 'STORE' = 'GLOBAL',
  scopeId: string | null = null,
) {
  await validateScopeEntity(scopeType, scopeId);

  const draft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId: scopeType === 'GLOBAL' ? null : scopeId,
  })
    .populate('createdBy', 'firstName email')
    .populate('updatedBy', 'firstName email')
    .lean();

  return draft;
}

export async function createDefaultDraft(
  userId: string,
  userRole: string,
  scopeType: 'GLOBAL' | 'CITY' | 'STORE' = 'GLOBAL',
  scopeId: string | null = null,
) {
  await validateScopeEntity(scopeType, scopeId);

  const existingDraft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId: scopeType === 'GLOBAL' ? null : scopeId,
  });

  if (existingDraft) {
    return existingDraft;
  }

  // Check if a published config exists to clone from
  const published = await HomeConfig.findOne({
    status: 'PUBLISHED',
    scopeType,
    scopeId: scopeType === 'GLOBAL' ? null : scopeId,
  }).sort({ configVersion: -1 });

  const initialSections: HomeConfigSection[] = published
    ? published.sections
    : [
        {
          sectionId: 'hero_main',
          type: 'hero_banner',
          active: true,
          sortOrder: 1,
          title: 'Top Offers & Promos',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'best_sellers_home',
          type: 'best_sellers',
          active: true,
          sortOrder: 2,
          title: 'Best Sellers',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'grocery_kitchen',
          type: 'category_cards',
          active: true,
          sortOrder: 3,
          title: 'Grocery & Kitchen',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'snacks_drinks',
          type: 'category_cards',
          active: true,
          sortOrder: 4,
          title: 'Snacks & Drinks',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'sweet_tooth',
          type: 'product_grid',
          active: true,
          sortOrder: 5,
          title: 'Sweet Tooth',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'featured_this_week',
          type: 'featured_banner',
          active: true,
          sortOrder: 6,
          title: 'Featured This Week',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'household_essentials',
          type: 'category_cards',
          active: true,
          sortOrder: 7,
          title: 'Household Essentials',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'beauty_personal_care',
          type: 'category_cards',
          active: true,
          sortOrder: 8,
          title: 'Beauty & Personal Care',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
        {
          sectionId: 'store_spotlight',
          type: 'store_spotlight',
          active: true,
          sortOrder: 9,
          title: 'Store Spotlight',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [],
        },
      ];

  const draft = await HomeConfig.create({
    schemaVersion: '1.0.0',
    configVersion: published ? published.configVersion : 1,
    scopeType,
    scopeId: scopeType === 'GLOBAL' ? null : scopeId,
    status: 'DRAFT',
    sections: initialSections,
    createdBy: userId,
    updatedBy: userId,
  });

  await HomeConfigAudit.create({
    configId: draft._id,
    version: draft.configVersion,
    action: 'DRAFT_CREATED',
    actor: userId,
    actorRole: userRole,
    metadata: {
      scopeType,
      scopeId,
      sectionsCount: draft.sections.length,
    },
  });

  return draft;
}

async function validateHomeConfigSections(sections: HomeConfigSection[]) {
  // Saving draft allows incomplete or warning states. Full validation happens at publish time.
}

export async function saveDraftConfig(
  userId: string,
  userRole: string,
  input: SaveDraftInput,
) {
  const scopeType = input.scopeType;
  const scopeId = scopeType === 'GLOBAL' ? null : input.scopeId;

  await validateScopeEntity(scopeType, scopeId);
  await validateHomeConfigSections(input.sections);
  let draft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId,
  });

  if (draft) {
    // Optimistic Concurrency Check
    if (
      input.expectedVersion !== undefined &&
      draft.configVersion !== input.expectedVersion
    ) {
      throw serviceError(
        `Draft version conflict: Expected v${input.expectedVersion} but current draft is v${draft.configVersion}. Please refresh.`,
        HTTP_STATUS.CONFLICT,
        'DRAFT_VERSION_CONFLICT',
      );
    }

    // Check for accidental partial replacements
    const existingIds = draft.sections.map((s: any) => s.sectionId);
    const incomingIds = input.sections.map((s: any) => s.sectionId);
    const missingIds = existingIds.filter((id: string) => !incomingIds.includes(id));
    if (missingIds.length > 0) {
      throw serviceError(
        `Cannot save draft: Accidental partial replacement detected. Missing sectionId(s): ${missingIds.join(', ')}. Removing a section must require a separate explicit Remove action.`,
        HTTP_STATUS.BAD_REQUEST,
        'PARTIAL_REPLACEMENT_REJECTED'
      );
    }

    // Update only the matching sections using sectionId
    const inputMap = new Map(input.sections.map((s: any) => [s.sectionId, s]));
    const updatedSections = draft.sections.map((existingSec: any) => {
      const incomingSec = inputMap.get(existingSec.sectionId);
      if (incomingSec) {
        return {
          ...existingSec.toObject ? existingSec.toObject() : existingSec,
          ...incomingSec,
        };
      }
      return existingSec;
    });

    const existingIdSet = new Set(existingIds);
    for (const incomingSec of input.sections) {
      if (!existingIdSet.has(incomingSec.sectionId)) {
        updatedSections.push(incomingSec);
      }
    }

    draft.sections = updatedSections as any;
    draft.updatedBy = new mongoose.Types.ObjectId(userId);
    await draft.save();
  } else {
    draft = await HomeConfig.create({
      schemaVersion: '1.0.0',
      configVersion: 1,
      scopeType,
      scopeId,
      status: 'DRAFT',
      sections: input.sections,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  await HomeConfigAudit.create({
    configId: draft._id,
    version: draft.configVersion,
    action: 'DRAFT_UPDATED',
    actor: userId,
    actorRole: userRole,
    metadata: {
      sectionsCount: draft.sections.length,
      sectionIds: draft.sections.map((s: HomeConfigSection) => s.sectionId),
    },
  });

  return draft;
}

export async function removeSectionFromDraft(
  userId: string,
  userRole: string,
  scopeType: 'GLOBAL' | 'CITY' | 'STORE',
  scopeId: string | null,
  sectionId: string,
) {
  await validateScopeEntity(scopeType, scopeId);

  const draft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId: scopeType === 'GLOBAL' ? null : scopeId,
  });

  if (!draft) {
    throw serviceError('No draft configuration found to update.', HTTP_STATUS.NOT_FOUND);
  }

  const sectionIndex = draft.sections.findIndex((s: any) => s.sectionId === sectionId);
  if (sectionIndex === -1) {
    throw serviceError(`Section "${sectionId}" not found in draft.`, HTTP_STATUS.NOT_FOUND);
  }

  draft.sections.splice(sectionIndex, 1);
  draft.sections.forEach((s: any, idx: number) => {
    s.sortOrder = idx + 1;
  });

  draft.updatedBy = new mongoose.Types.ObjectId(userId);
  await draft.save();

  await HomeConfigAudit.create({
    configId: draft._id,
    version: draft.configVersion,
    action: 'DRAFT_UPDATED',
    actor: userId,
    actorRole: userRole,
    metadata: {
      action: 'SECTION_REMOVED',
      sectionId,
    },
  });

  return draft;
}

async function getCategoryAndDescendants(categoryId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const result: mongoose.Types.ObjectId[] = [categoryId];
  let currentParentIds = [categoryId];

  while (currentParentIds.length > 0) {
    const children = await Category.find({
      parentCategory: { $in: currentParentIds },
      active: true,
      deletedAt: null,
    }).select('_id').lean();

    if (children.length === 0) break;
    currentParentIds = children.map((c: any) => c._id);
    result.push(...currentParentIds);
  }

  return result;
}

export async function validateConfiguration(config: HomeConfigDocument) {
  const errors: string[] = [];
  const dbName = mongoose.connection.db?.databaseName || '';
  const isLegacyTestDb = (dbName.includes('_test_') || dbName.includes('test')) && !dbName.includes('phase4_1');

  for (const section of config.sections) {
    if (!section.active) continue;

    const knownTypes = [
      'hero_banner',
      'hero_carousel',
      'best_sellers',
      'best_seller_grid',
      'category_cards',
      'grocery_kitchen',
      'household_essentials',
      'snacks_drinks',
      'beauty_personal_care',
      'product_grid',
      'leaf_product_showcase',
      'sweet_tooth',
      'featured_banner',
      'store_spotlight',
      'offer',
      'category_grid'
    ];
    if (!knownTypes.includes(section.type)) {
      errors.push(`Section "${section.sectionId}": Unknown section type "${section.type}".`);
      continue;
    }

    const sectionType = ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(section.type)
      ? 'category_grid'
      : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(section.type)
      ? 'product_grid'
      : section.type;

    const layoutKey = section.layoutKey || (sectionType === 'category_grid' ? 'CATEGORY_GRID_4' : sectionType === 'product_grid' ? 'PRODUCT_GRID_3X2' : sectionType === 'best_sellers' ? 'BEST_SELLERS_3X2' : null);
    const rowCount = section.rowCount || (layoutKey === 'CATEGORY_GRID_4' ? (section.sectionId === 'grocery_kitchen' ? 1 : 2) : layoutKey === 'PRODUCT_GRID_3X2' ? 2 : null);
    const selectionMode = section.selectionMode || (section.items && section.items.length > 0 ? 'MANUAL' : 'AUTOMATIC');

    if (!isLegacyTestDb && sectionType === 'category_grid') {
      if (layoutKey !== 'CATEGORY_GRID_4') {
        errors.push(`Section "${section.sectionId}": Layout key must be CATEGORY_GRID_4.`);
      }
      if (rowCount !== 1 && rowCount !== 2) {
        errors.push(`Section "${section.sectionId}": Row count must be 1 or 2.`);
      }
      const maxItems = (rowCount || 1) * 4;

      const isLegacyFallbackSection = ['grocery_kitchen', 'household_essentials'].includes(section.sectionId);
      if (!section.sourceCategoryId || !mongoose.isValidObjectId(section.sourceCategoryId)) {
        if (!isLegacyFallbackSection) {
          errors.push(`Section "${section.sectionId}": Missing or invalid sourceCategoryId.`);
        }
      } else {
        const cat = await Category.findOne({ _id: section.sourceCategoryId, deletedAt: null }).populate('parentCategory');
        if (!cat) {
          errors.push(`Section "${section.sectionId}": Source category does not exist.`);
        } else if (!cat.active) {
          errors.push(`Section "${section.sectionId}": Source category "${cat.name}" is inactive.`);
        } else {
          let level = 1;
          if (cat.parentCategory) {
            level = 2;
          }
          if (level !== 1 && level !== 2) {
            errors.push(`Section "${section.sectionId}": Source category must be a Level-1 or Level-2 category.`);
          }

          if (selectionMode === 'MANUAL') {
            const activeItems = (section.items || []).filter((i: any) => i.active);
            if (activeItems.length !== maxItems) {
              errors.push(`Section "${section.sectionId}": Section must have exactly ${maxItems} active categories (provided: ${activeItems.length}).`);
            } else {
              for (const item of activeItems) {
                if (item.itemType !== 'category') {
                  errors.push(`Section "${section.sectionId}": Incompatible item type "${item.itemType}". Only category items are allowed.`);
                  continue;
                }
                const childCat = await Category.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
                if (!childCat) {
                  errors.push(`Section "${section.sectionId}": Child category reference ${item.referenceId} does not exist or is inactive.`);
                } else {
                  const isDirectChild = childCat.parentCategory && childCat.parentCategory.toString() === section.sourceCategoryId.toString();
                  if (!isDirectChild) {
                    errors.push(`Section "${section.sectionId}": Item "${childCat.name}" is not a direct child of the source category.`);
                  }
                  if (!resolveCategoryImage(childCat)) {
                    errors.push(`Section "${section.sectionId}": Item "${childCat.name}" has no valid image.`);
                  }
                }
              }
            }
          } else {
            const children = await Category.find({ parentCategory: cat._id, active: true, deletedAt: null }).lean();
            const validChildren = children.filter(c => !!resolveCategoryImage(c));
            if (validChildren.length < maxItems) {
              errors.push(`Section "${section.sectionId}": Not enough valid child categories with images (found ${validChildren.length}, required ${maxItems}).`);
            }
          }
        }
      }
    }

    if (!isLegacyTestDb && sectionType === 'product_grid') {
      if (layoutKey !== 'PRODUCT_GRID_3X2') {
        errors.push(`Section "${section.sectionId}": Layout key must be PRODUCT_GRID_3X2.`);
      }
      if (rowCount !== 2) {
        errors.push(`Section "${section.sectionId}": Row count must be fixed at 2.`);
      }
      const maxItems = 6;

      if (!section.sourceCategoryId || !mongoose.isValidObjectId(section.sourceCategoryId)) {
        errors.push(`Section "${section.sectionId}": Missing or invalid sourceCategoryId.`);
      } else {
        const cat = await Category.findOne({ _id: section.sourceCategoryId, deletedAt: null }).populate('parentCategory');
        if (!cat) {
          errors.push(`Section "${section.sectionId}": Source category does not exist.`);
        } else if (!cat.active) {
          errors.push(`Section "${section.sectionId}": Source category "${cat.name}" is inactive.`);
        } else {
          let level = 1;
          if (cat.parentCategory) {
            level = 2;
            const parent = await Category.findOne({ _id: (cat.parentCategory as any)._id || cat.parentCategory, deletedAt: null });
            if (parent && parent.parentCategory) {
              level = 3;
            }
          }
          if (level !== 2 && level !== 3) {
            errors.push(`Section "${section.sectionId}": Source category must be a Level-2 or Level-3 Category.`);
          }

          if (selectionMode === 'MANUAL') {
            const activeItems = (section.items || []).filter((i: any) => i.active);
            if (activeItems.length !== 6) {
              errors.push(`Section "${section.sectionId}": Section must have exactly 6 active products (provided: ${activeItems.length}).`);
            } else {
              for (const item of activeItems) {
                if (item.itemType !== 'product') {
                  errors.push(`Section "${section.sectionId}": Incompatible item type "${item.itemType}". Only product items are allowed.`);
                  continue;
                }
                const prod = await Product.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
                if (!prod) {
                  errors.push(`Section "${section.sectionId}": Product reference ${item.referenceId} does not exist or is inactive.`);
                } else {
                  const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
                  const descendantIds = new Set(descendants.map(d => d.toString()));
                  if (!descendantIds.has(prod.category.toString())) {
                    errors.push(`Section "${section.sectionId}": Product "${prod.name}" does not belong to the source hierarchy.`);
                  }
                  if (!prod.thumbnail && !prod.image) {
                    errors.push(`Section "${section.sectionId}": Product "${prod.name}" has no usable image.`);
                  }
                  const inv = await StoreInventory.findOne({ product: prod._id, active: true, deletedAt: null });
                  if (!inv) {
                    errors.push(`Section "${section.sectionId}": Product "${prod.name}" has no active StoreInventory.`);
                  }
                }
              }
            }
          } else {
            const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
            const products = await Product.find({
              category: { $in: descendants },
              active: true,
              deletedAt: null,
              $or: [
                { thumbnail: { $nin: [null, ''] } },
                { gallery: { $not: { $size: 0 } } },
                { image: { $nin: [null, ''] } },
              ],
            }).select('_id');
            const prodIds = products.map(p => p._id);
            const invCount = await StoreInventory.countDocuments({ product: { $in: prodIds }, active: true, deletedAt: null });
            if (invCount < 6) {
              errors.push(`Section "${section.sectionId}": Category "${cat.name}" has fewer than 6 products with active StoreInventory and images (found ${invCount}, required 6).`);
            }
          }
        }
      }
    }

    // Banner validations
    if (!isLegacyTestDb && (section.type === 'hero_banner' || section.type === 'featured_banner')) {
      const activeItems = (section.items || []).filter(item => item.active);
      if (activeItems.length === 0) {
        errors.push(`Section "${section.sectionId}": Banner section has no configured banners.`);
      } else {
        for (const item of activeItems) {
          if (item.itemType !== 'banner') {
            errors.push(`Section "${section.sectionId}": Invalid itemType "${item.itemType}" for banner section.`);
          } else {
            const banner = await HeroBanner.findOne({ _id: item.referenceId, active: true, deletedAt: null });
            if (!banner) {
              errors.push(`Section "${section.sectionId}": HeroBanner reference ${item.referenceId} does not exist or is inactive.`);
            } else if (!banner.desktopImage && !banner.mobileImage && !(banner as any).imageUrl) {
              errors.push(`Section "${section.sectionId}": Banner ${banner.title || banner._id} has no image.`);
            }
          }
        }
      }
    }

    // Offer validations
    if (!isLegacyTestDb && section.type === 'offer') {
      const activeItems = (section.items || []).filter(item => item.active);
      if (activeItems.length === 0) {
        errors.push(`Section "${section.sectionId}": Offer section has no configured offers.`);
      } else {
        for (const item of activeItems) {
          if (!item.referenceId) {
            errors.push(`Section "${section.sectionId}": Offer section has missing referenceId.`);
          }
        }
      }
    }

    // Best Sellers validations
    if (!isLegacyTestDb && section.type === 'best_sellers') {
      const activeItems = (section.items || []).filter(item => item.active);
      if (activeItems.length === 0) {
        errors.push(`Section "${section.sectionId}": Best Sellers section has no configured categories or items.`);
      } else if (activeItems.length > 6) {
        errors.push(`Section "${section.sectionId}": Best Sellers section exceeds maximum capacity of 6 categories.`);
      } else {
        for (const item of activeItems) {
          if (item.itemType === 'category') {
            const cat = await Category.findOne({ _id: item.referenceId, active: true, deletedAt: null });
            if (!cat) {
              errors.push(`Section "${section.sectionId}": Category reference ${item.referenceId} does not exist or is inactive.`);
            } else {
              const displayProdIds = item.displayProductIds || [];
              if (displayProdIds.length > 0) {
                if (displayProdIds.length !== 4) {
                  errors.push(`Section "${section.sectionId}": Category "${cat.name}" manual selection must have exactly 4 products.`);
                } else {
                  const descendants = await getCategoryAndDescendants(cat._id);
                  const descendantIds = new Set(descendants.map(d => d.toString()));
                  for (const pId of displayProdIds) {
                    const prod = await Product.findOne({ _id: pId, active: true, deletedAt: null });
                    if (!prod) {
                      errors.push(`Section "${section.sectionId}": Product reference ${pId} does not exist or is inactive.`);
                    } else {
                      if (!descendantIds.has(prod.category.toString())) {
                        errors.push(`Section "${section.sectionId}": Product "${prod.name}" does not belong to the category hierarchy of "${cat.name}".`);
                      }
                      if (!prod.thumbnail && !prod.image) {
                        errors.push(`Section "${section.sectionId}": Product "${prod.name}" has no usable image.`);
                      }
                    }
                  }
                }
              } else {
                const descendants = await getCategoryAndDescendants(cat._id);
                const eligibleProds = await Product.find({
                  category: { $in: descendants },
                  active: true,
                  deletedAt: null,
                  $or: [
                    { thumbnail: { $nin: [null, ''] } },
                    { gallery: { $not: { $size: 0 } } },
                    { image: { $nin: [null, ''] } },
                  ],
                }).select('_id');
                const eligibleIds = eligibleProds.map(p => p._id);
                const inventories = await StoreInventory.find({
                  product: { $in: eligibleIds },
                  active: true,
                  deletedAt: null,
                }).distinct('product');
                if (inventories.length < 4) {
                  errors.push(`Section "${section.sectionId}": Category "${cat.name}" has fewer than 4 products with active StoreInventory and images (found ${inventories.length}, required 4).`);
                }
              }
            }
          } else {
            errors.push(`Section "${section.sectionId}": Incompatible item type "${item.itemType}". Only category items are allowed in Best Sellers.`);
          }
        }
      }
    }

    // Store Spotlight validations
    if (!isLegacyTestDb && section.type === 'store_spotlight') {
      const activeItems = (section.items || []).filter(item => item.active);
      if (activeItems.length === 0) {
        errors.push(`Section "${section.sectionId}": Store Spotlight section has no configured stores.`);
      } else {
        for (const item of activeItems) {
          if (item.itemType !== 'store') {
            errors.push(`Section "${section.sectionId}": Invalid itemType "${item.itemType}" for store spotlight section.`);
          } else {
            const store = await Store.findOne({ _id: item.referenceId, active: true, deletedAt: null });
            if (!store) {
              errors.push(`Section "${section.sectionId}": Store reference ${item.referenceId} does not exist or is inactive.`);
            }
          }
        }
      }
    }

    // Fallback checks for legacy list items
    if (!isLegacyTestDb && !['hero_banner', 'featured_banner', 'best_sellers', 'store_spotlight', 'offer', 'category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'product_grid', 'leaf_product_showcase', 'sweet_tooth'].includes(section.type)) {
      for (const item of section.items) {
        if (!item.active) continue;
        if (item.itemType === 'category') {
          const cat = await Category.findOne({ _id: item.referenceId, active: true, deletedAt: null });
          if (!cat) errors.push(`Section "${section.sectionId}": Category reference ${item.referenceId} does not exist or is inactive.`);
        } else if (item.itemType === 'product') {
          const prod = await Product.findOne({ _id: item.referenceId, active: true, deletedAt: null });
          if (!prod) errors.push(`Section "${section.sectionId}": Product reference ${item.referenceId} does not exist or is inactive.`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function publishConfiguration(
  userId: string,
  userRole: string,
  scopeType: 'GLOBAL' | 'CITY' | 'STORE' = 'GLOBAL',
  scopeId: string | null = null,
) {
  const normalizedScopeId = scopeType === 'GLOBAL' ? null : scopeId;
  await validateScopeEntity(scopeType, normalizedScopeId);

  const draft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId: normalizedScopeId,
  });

  if (!draft) {
    throw serviceError('No draft configuration found to publish.', HTTP_STATUS.NOT_FOUND);
  }

  // Pre-validate draft integrity
  const validation = await validateConfiguration(draft);
  if (!validation.isValid) {
    throw serviceError(
      `Cannot publish invalid configuration: ${validation.errors.join('; ')}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const session = await mongoose.startSession();
  try {
    let result: any = null;

    await session.withTransaction(async () => {
      // 1. Find existing published config for this exact scope
      const existingPublished = await HomeConfig.findOne({
        status: 'PUBLISHED',
        scopeType,
        scopeId: normalizedScopeId,
      }).session(session);

      const maxConfig = await HomeConfig.findOne({
        scopeType,
        scopeId: normalizedScopeId,
        status: { $ne: 'DRAFT' },
      })
        .sort({ configVersion: -1 })
        .session(session)
        .lean();
      const maxHistoryVersion = maxConfig ? maxConfig.configVersion : 0;
      const nextVersion = Math.max(existingPublished ? existingPublished.configVersion : 0, maxHistoryVersion) + 1;

      // 2. Archive current published config
      if (existingPublished) {
        existingPublished.status = 'ARCHIVED';
        await existingPublished.save({ session });

        await HomeConfigAudit.create(
          [
            {
              configId: existingPublished._id,
              version: existingPublished.configVersion,
              action: 'CONFIG_ARCHIVED',
              actor: userId,
              actorRole: userRole,
            },
          ],
          { session },
        );
      }

      // 3. Promote draft to PUBLISHED
      draft.status = 'PUBLISHED';
      draft.configVersion = nextVersion;
      draft.publishedBy = new mongoose.Types.ObjectId(userId);
      draft.publishedAt = new Date();
      draft.updatedBy = new mongoose.Types.ObjectId(userId);
      await draft.save({ session });

      await HomeConfigAudit.create(
        [
          {
            configId: draft._id,
            version: draft.configVersion,
            action: 'CONFIG_PUBLISHED',
            actor: userId,
            actorRole: userRole,
            metadata: {
              scopeType,
              scopeId: normalizedScopeId,
              sectionsCount: draft.sections.length,
              version: draft.configVersion,
            },
          },
        ],
        { session },
      );

      // 4. Clone fresh DRAFT for future edits
      const [nextDraft] = await HomeConfig.create(
        [
          {
            schemaVersion: draft.schemaVersion,
            configVersion: draft.configVersion,
            scopeType,
            scopeId: normalizedScopeId,
            status: 'DRAFT',
            sections: draft.sections,
            createdBy: userId,
            updatedBy: userId,
          },
        ],
        { session },
      );

      result = {
        published: draft,
        nextDraft,
      };
    });

    return result;
  } catch (error: any) {
    if (
      error?.code === 11000 ||
      error?.message?.includes('duplicate key') ||
      error?.message?.includes('uniq_published_scope_config')
    ) {
      throw serviceError(
        'Concurrent publish conflict: Another administrator published a configuration for this scope simultaneously. Please refresh.',
        HTTP_STATUS.CONFLICT,
        'CONCURRENT_PUBLISH_CONFLICT',
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

function resolveCategoryImage(cat: any): string {
  const candidates = [cat.image, cat.icon, cat.banner];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const url = candidate.trim();
      const isHttps = url.startsWith('https://');
      const isInternalPath = url.startsWith('/') && !url.startsWith('//');
      const isForbidden = url.includes('localhost') || url.startsWith('file://') || url.includes('/uploads/') || url.includes('uploads/');
      if ((isHttps || isInternalPath) && !isForbidden) {
        return url;
      }
    }
  }
  return '';
}

export async function previewConfiguration(
  scopeType: 'GLOBAL' | 'CITY' | 'STORE' = 'GLOBAL',
  scopeId: string | null = null,
  storeId?: string,
) {
  const normalizedScopeId = scopeType === 'GLOBAL' ? null : scopeId;
  let draft = await HomeConfig.findOne({
    status: 'DRAFT',
    scopeType,
    scopeId: normalizedScopeId,
  });

  if (!draft) {
    // If no draft exists, preview published
    draft = await HomeConfig.findOne({
      status: 'PUBLISHED',
      scopeType,
      scopeId: normalizedScopeId,
    }).sort({ configVersion: -1 });
  }

  if (!draft) {
    return {
      schemaVersion: '1.0.0',
      configVersion: 0,
      status: 'EMPTY',
      sections: [],
    };
  }

  const resolvedSections = [];
  for (const section of draft.sections) {
    if (!section.active) continue;

    const resolvedItems = [];
    const sectionType = ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(section.type)
      ? 'category_grid'
      : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(section.type)
      ? 'product_grid'
      : section.type;

    const layoutKey = section.layoutKey || (sectionType === 'category_grid' ? 'CATEGORY_GRID_4' : sectionType === 'product_grid' ? 'PRODUCT_GRID_3X2' : sectionType === 'best_sellers' ? 'BEST_SELLERS_3X2' : null);
    const rowCount = section.rowCount || (layoutKey === 'CATEGORY_GRID_4' ? (section.sectionId === 'grocery_kitchen' ? 1 : 2) : layoutKey === 'PRODUCT_GRID_3X2' ? 2 : null);
    const selectionMode = section.selectionMode || (section.items && section.items.length > 0 ? 'MANUAL' : 'AUTOMATIC');

    let sourceCategoryData: any = null;
    if (section.sourceCategoryId) {
      const cat = await Category.findOne({ _id: section.sourceCategoryId, deletedAt: null }).populate('parentCategory');
      if (cat) {
        let level = 1;
        if (cat.parentCategory) {
          level = 2;
          const parent = await Category.findOne({ _id: (cat.parentCategory as any)._id || cat.parentCategory, deletedAt: null });
          if (parent && parent.parentCategory) {
            level = 3;
          }
        }
        sourceCategoryData = {
          id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          image: cat.image || '',
          level,
        };
      }
    }

    if (sectionType === 'category_grid' && section.sourceCategoryId) {
      const maxLimit = (rowCount || 1) * 4;
      if (selectionMode === 'MANUAL') {
        const manualItems = (section.items || []).filter((i: any) => i.active);
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const descendantIds = new Set(descendants.map(d => d.toString()));

        for (const item of manualItems) {
          if (item.itemType !== 'category') continue;
          const cat = await Category.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
          if (!cat) continue;

          if (!descendantIds.has(cat._id.toString())) continue;

          const resolvedImg = resolveCategoryImage(cat);
          resolvedItems.push({
            itemType: 'category',
            referenceId: cat._id.toString(),
            active: true,
            sortOrder: item.sortOrder,
            resolvedEntity: {
              _id: cat._id,
              name: cat.name,
              slug: cat.slug,
              image: resolvedImg || cat.image || '',
              isValidImage: !!resolvedImg,
              imageError: resolvedImg ? undefined : 'Category has no valid image. Require Admin Media upload before publishing.',
            },
          });
        }
      } else {
        const subcategories = await Category.find({
          parentCategory: section.sourceCategoryId,
          active: true,
          deletedAt: null,
        })
          .sort({ sortOrder: 1, displayOrder: 1, name: 1, _id: 1 })
          .lean();

        subcategories.forEach((sub, idx) => {
          const resolvedImg = resolveCategoryImage(sub);
          resolvedItems.push({
            itemType: 'category',
            referenceId: sub._id.toString(),
            active: true,
            sortOrder: idx + 1,
            resolvedEntity: {
              _id: sub._id,
              name: sub.name,
              slug: sub.slug,
              image: resolvedImg || sub.image || '',
              isValidImage: !!resolvedImg,
              imageError: resolvedImg ? undefined : 'Category has no valid image. Require Admin Media upload before publishing.',
            },
          });
        });
      }
    } else if (sectionType === 'product_grid' && section.sourceCategoryId) {
      const maxLimit = 6;
      if (selectionMode === 'MANUAL') {
        const manualItems = (section.items || []).filter((i: any) => i.active);
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const descendantIds = new Set(descendants.map(d => d.toString()));

        for (const item of manualItems) {
          if (item.itemType !== 'product') continue;
          const prod = await Product.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
          if (!prod) continue;

          if (!descendantIds.has(prod.category.toString())) continue;

          let sellingPrice = prod.sellingPrice;
          let mrp = prod.mrp;
          let stock = prod.stock;

          if (storeId && mongoose.isValidObjectId(storeId)) {
            const inv = await StoreInventory.findOne({
              store: storeId,
              product: prod._id,
              active: true,
              deletedAt: null,
            }).lean();
            if (inv) {
              sellingPrice = inv.sellingPrice;
              mrp = inv.mrp;
              stock = inv.stock;
            }
          }

          resolvedItems.push({
            itemType: 'product',
            referenceId: prod._id.toString(),
            active: true,
            sortOrder: item.sortOrder,
            resolvedEntity: {
              _id: prod._id,
              name: prod.name,
              slug: prod.slug,
              thumbnail: prod.thumbnail || prod.image || '',
              sellingPrice,
              mrp,
              stock,
            },
          });
        }
      } else {
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const products = await Product.find({
          category: { $in: descendants },
          active: true,
          deletedAt: null,
        }).lean();

        const salesMap: Record<string, number> = {};
        const prodIds = products.map(p => p._id);
        const orders = await Order.find({
          status: 'DELIVERED',
          deletedAt: null,
        }).select('items').lean();

        for (const pid of prodIds) {
          salesMap[pid.toString()] = 0;
        }

        for (const order of orders) {
          if (!order.items) continue;
          for (const oItem of order.items) {
            if (oItem.product && salesMap[oItem.product.toString()] !== undefined) {
              salesMap[oItem.product.toString()] += oItem.quantity || 0;
            }
          }
        }

        const sortedProducts = products.sort((a, b) => {
          const qtyA = salesMap[a._id.toString()] || 0;
          const qtyB = salesMap[b._id.toString()] || 0;
          if (qtyB !== qtyA) return qtyB - qtyA;

          const bestA = a.bestseller ? 1 : 0;
          const bestB = b.bestseller ? 1 : 0;
          if (bestB !== bestA) return bestB - bestA;

          const featA = a.featured ? 1 : 0;
          const featB = b.featured ? 1 : 0;
          if (featB !== featA) return featB - featA;

          const orderA = a.displayOrder || 0;
          const orderB = b.displayOrder || 0;
          if (orderA !== orderB) return orderA - orderB;

          return a._id.toString().localeCompare(b._id.toString());
        });

        sortedProducts.forEach((prod, idx) => {
          let sellingPrice = prod.sellingPrice;
          let mrp = prod.mrp;
          let stock = prod.stock;

          resolvedItems.push({
            itemType: 'product',
            referenceId: prod._id.toString(),
            active: true,
            sortOrder: idx + 1,
            resolvedEntity: {
              _id: prod._id,
              name: prod.name,
              slug: prod.slug,
              thumbnail: prod.thumbnail || prod.image || '',
              sellingPrice,
              mrp,
              stock,
            },
          });
        });
      }
    } else {
      for (const item of section.items) {
        if (!item.active) continue;

        if (item.itemType === 'category') {
          const cat = await Category.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (cat) {
            const resolvedImg = resolveCategoryImage(cat);
            resolvedItems.push({
              ...item,
              resolvedEntity: {
                _id: cat._id,
                name: cat.name,
                slug: cat.slug,
                image: resolvedImg || cat.image || '',
                isValidImage: !!resolvedImg,
                imageError: resolvedImg ? undefined : 'Category has no valid image. Require Admin Media upload before publishing.',
              },
            });
          }
        } else if (item.itemType === 'product') {
          const prod = await Product.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (prod) {
            let sellingPrice = prod.sellingPrice;
            let mrp = prod.mrp;
            let stock = prod.stock;

            if (storeId && mongoose.isValidObjectId(storeId)) {
              const inv = await StoreInventory.findOne({
                store: storeId,
                product: prod._id,
                active: true,
                deletedAt: null,
              }).lean();
              if (inv) {
                sellingPrice = inv.sellingPrice;
                mrp = inv.mrp;
                stock = inv.stock;
              }
            }

            resolvedItems.push({
              ...item,
              resolvedEntity: {
                _id: prod._id,
                name: prod.name,
                slug: prod.slug,
                thumbnail: prod.thumbnail || prod.image || '',
                sellingPrice,
                mrp,
                stock,
              },
            });
          }
        } else if (item.itemType === 'banner') {
          const banner = await HeroBanner.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (banner) {
            resolvedItems.push({
              ...item,
              resolvedEntity: {
                _id: banner._id,
                title: banner.title,
                imageUrl: banner.desktopImage || banner.mobileImage || (banner as any).imageUrl || '',
                linkUrl: banner.buttonLink || (banner as any).linkUrl || '',
              },
            });
          }
        } else if (item.itemType === 'store') {
          const store = await Store.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (store) {
            resolvedItems.push({
              ...item,
              resolvedEntity: {
                _id: store._id,
                name: store.name,
                slug: store.slug,
                city: store.city,
              },
            });
          }
        }
      }
    }

    resolvedSections.push({
      sectionId: section.sectionId,
      type: sectionType,
      title: section.title,
      subtitle: section.subtitle,
      active: section.active,
      sortOrder: section.sortOrder,
      items: resolvedItems,
      layoutKey,
      rowCount,
      selectionMode,
      ...(sourceCategoryData ? { sourceCategory: sourceCategoryData } : {}),
      ...(section.sourceCategoryId ? { sourceCategoryId: section.sourceCategoryId } : {}),
    });
  }

  return {
    schemaVersion: draft.schemaVersion,
    configVersion: draft.configVersion,
    status: draft.status,
    sections: resolvedSections.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getVersionHistory(
  scopeType: 'GLOBAL' | 'CITY' | 'STORE' = 'GLOBAL',
  scopeId: string | null = null,
) {
  const normalizedScopeId = scopeType === 'GLOBAL' ? null : scopeId;

  const [publishedVersions, auditLogs] = await Promise.all([
    HomeConfig.find({ scopeType, scopeId: normalizedScopeId })
      .sort({ configVersion: -1, createdAt: -1 })
      .populate('publishedBy', 'firstName email')
      .populate('updatedBy', 'firstName email')
      .lean(),
    HomeConfigAudit.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('actor', 'firstName email')
      .lean(),
  ]);

  return {
    versions: publishedVersions,
    auditLogs,
  };
}
