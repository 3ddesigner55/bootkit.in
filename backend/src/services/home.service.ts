import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigDocument } from '../models/homeConfig.model';
import HomeSection from '../models/homeSection.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import Order from '../models/order.model';

const APPROVED_CUSTOMER_SECTION_TYPES = new Set([
  'hero_banner',
  'hero_carousel',
  'offer',
  'offer_section',
  'best_sellers',
  'best_seller_grid',
  'grocery_kitchen',
  'dry_food_masala',
  'household_essentials',
  'sweet_tooth',
  'featured_banner',
  'featured_this_week',
  'snacks_drinks',
  'beauty_personal_care',
  'store_spotlight',
  'category_cards',
  'product_grid',
  'category_grid',
]);


function getHomeCategorySection(homeSection: string) {
  return Category.find({
    homeSection,
    parentCategory: null,
    active: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1, sortOrder: 1 })
    .lean();
}

function getHomeProductSection(homeSection: string) {
  return Product.find({
    homeSection,
    active: true,
    showOnHome: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1 })
    .lean();
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

    const childIds = children.map(c => c._id);
    result.push(...childIds);
    currentParentIds = childIds;
  }

  return result;
}

async function resolveCategoryBestSellers(
  categoryId: mongoose.Types.ObjectId,
  productMode: 'auto' | 'manual',
  manualProductIds: any[],
  storeId?: string
) {
  const cat = await Category.findOne({
    _id: categoryId,
    active: true,
    deletedAt: null,
  }).lean();

  if (!cat) return null;

  const descendants = await getCategoryAndDescendants(categoryId);
  let products: any[] = [];

  if (productMode === 'manual' && manualProductIds && manualProductIds.length > 0) {
    const manualIds = manualProductIds.map((id: any) => new mongoose.Types.ObjectId(id.toString()));
    const manualProducts = await Product.find({
      _id: { $in: manualIds },
      active: true,
      deletedAt: null,
    }).lean();

    const validProducts = [];
    const manualMap = new Map(manualProducts.map(p => [p._id.toString(), p]));

    for (const id of manualIds) {
      const prod = manualMap.get(id.toString());
      if (!prod) continue;

      // Check category hierarchy
      const isDescendant = descendants.some(dId => dId.toString() === prod.category.toString());
      if (!isDescendant) continue;

      // Check image
      const hasImage = prod.thumbnail || (prod.gallery && prod.gallery.length > 0) || prod.image;
      if (!hasImage) continue;

      // Check inventory
      if (storeId) {
        const inv = await StoreInventory.findOne({
          store: storeId,
          product: prod._id,
          active: true,
          deletedAt: null,
        }).lean();
        if (!inv) continue;
      }

      validProducts.push(prod);
    }

    if (validProducts.length === 4) {
      products = validProducts;
    } else {
      console.warn(`Category "${cat.name}" manual product selection resolved only ${validProducts.length}/4 products.`);
      return null;
    }
  } else {
    // Automatic Mode
    const eligibleProducts = await Product.find({
      category: { $in: descendants },
      active: true,
      deletedAt: null,
      $or: [
        { thumbnail: { $nin: [null, ''] } },
        { gallery: { $not: { $size: 0 } } },
        { image: { $nin: [null, ''] } },
      ],
    }).lean();

    let filteredProducts = [];
    if (storeId) {
      const productIds = eligibleProducts.map(p => p._id);
      const inventories = await StoreInventory.find({
        store: storeId,
        product: { $in: productIds },
        active: true,
        deletedAt: null,
      }).lean();

      const inventoryMap = new Map(inventories.map(inv => [inv.product.toString(), inv]));
      
      for (const prod of eligibleProducts) {
        const inv = inventoryMap.get(prod._id.toString());
        if (inv) {
          filteredProducts.push(prod);
        }
      }
    } else {
      filteredProducts = eligibleProducts;
    }

    // Get delivered sales quantities
    const orders = await Order.find({
      status: 'DELIVERED',
      'items.product': { $in: filteredProducts.map(p => p._id) },
    }).select('items').lean();

    const salesMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        const pId = item.product.toString();
        salesMap.set(pId, (salesMap.get(pId) || 0) + (item.quantity || 0));
      }
    }

    filteredProducts.sort((a, b) => {
      const salesA = salesMap.get(a._id.toString()) || 0;
      const salesB = salesMap.get(b._id.toString()) || 0;
      if (salesB !== salesA) return salesB - salesA;

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

    products = filteredProducts.slice(0, 4);
  }

  if (products.length < 4) {
    console.warn(`Category "${cat.name}" has only ${products.length} serviceable products.`);
    return null;
  }

  const productThumbnails = products.map(p => p.thumbnail || (p.gallery && p.gallery[0]) || p.image).filter(Boolean);

  let productCount = 0;
  if (storeId) {
    const allCategoryProducts = await Product.find({
      category: { $in: descendants },
      active: true,
      deletedAt: null,
    }).select('_id').lean();
    
    const prodIds = allCategoryProducts.map(p => p._id);
    productCount = await StoreInventory.countDocuments({
      store: storeId,
      product: { $in: prodIds },
      active: true,
      deletedAt: null,
    });
  } else {
    productCount = await Product.countDocuments({
      category: { $in: descendants },
      active: true,
      deletedAt: null,
    });
  }

  return {
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
    count: `${productCount}+ Items`,
    productCount,
    images: productThumbnails,
  };
}

async function getBestSellers(storeId?: string) {
  let section = await HomeSection.findOne({ key: 'bestSellers' });

  if (!section) {
    const targetSlugs = [
      'dairy-bread-eggs',
      'fruits-vegetables',
      'drinks-juices',
      'chips-namkeen',
      'bakery-biscuits',
      'ice-cream-more',
    ];
    const initialCats = await Category.find({
      slug: { $in: targetSlugs },
      active: true,
      deletedAt: null,
    }).limit(6);

    let items = initialCats.map((cat, idx) => ({
      category: cat._id,
      productMode: 'auto' as const,
      active: true,
      sortOrder: idx + 1,
    }));

    if (items.length < 6) {
      const remaining = await Category.find({
        _id: { $nin: initialCats.map((c) => c._id) },
        active: true,
        deletedAt: null,
      }).limit(6 - items.length);

      items = [
        ...items,
        ...remaining.map((cat, idx) => ({
          category: cat._id,
          productMode: 'auto' as const,
          active: true,
          sortOrder: items.length + idx + 1,
        })),
      ];
    }

    section = await HomeSection.create({
      key: 'bestSellers',
      title: 'Best Sellers',
      active: true,
      displayType: 'categoryCards',
      items,
    });
  }

  if (!section.active) {
    return [];
  }

  const resolvedItems = [];
  const activeItems = section.items
    .filter((item: any) => item.active)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  for (const item of activeItems) {
    if (resolvedItems.length >= 6) break;
    const res = await resolveCategoryBestSellers(
      item.category,
      item.productMode || 'auto',
      item.manualProductIds || [],
      storeId
    );
    if (res) {
      resolvedItems.push({
        _id: res._id,
        name: res.name,
        slug: res.slug,
        image: res.image,
        itemCount: res.count,
        productCount: res.productCount,
        images: res.images,
        active: item.active,
        sortOrder: item.sortOrder,
      });
    }
  }

  return resolvedItems;
}

function getSweetToothProducts() {
  return Product.find({
    homeSection: 'sweetTooth',
    active: true,
    showOnHome: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1 })
    .lean();
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

async function resolvePublishedHomeConfig(publishedConfig: HomeConfigDocument, storeId?: string) {
  const resolvedSections = [];
  const now = new Date();

  for (const section of publishedConfig.sections) {
    if (!section.active) continue;

    // Defense: Ignore unknown section types
    if (!APPROVED_CUSTOMER_SECTION_TYPES.has(section.type)) continue;

    // Check date window if set
    if (section.startAt && new Date(section.startAt) > now) continue;
    if (section.endAt && new Date(section.endAt) < now) continue;

    const resolvedItems: any[] = [];
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

    const sectionType = ['category_cards', 'grocery_kitchen', 'household_essentials', 'snacks_drinks', 'beauty_personal_care', 'category_grid'].includes(section.type)
      ? 'category_grid'
      : ['sweet_tooth', 'dry_food_masala', 'product_grid'].includes(section.type)
      ? 'product_grid'
      : section.type;

    const layoutKey = section.layoutKey || (sectionType === 'category_grid' ? 'CATEGORY_GRID_4' : sectionType === 'product_grid' ? 'PRODUCT_GRID_3X2' : sectionType === 'best_sellers' ? 'BEST_SELLERS_3X2' : null);
    const rowCount = section.rowCount || (layoutKey === 'CATEGORY_GRID_4' ? (section.sectionId === 'grocery_kitchen' ? 1 : 2) : layoutKey === 'PRODUCT_GRID_3X2' ? 2 : null);
    const selectionMode = section.selectionMode || (section.items && section.items.length > 0 ? 'MANUAL' : 'AUTOMATIC');

    const viewAllUrl = sourceCategoryData ? `/category/${sourceCategoryData.slug}` : '';

    if (sectionType === 'category_grid' && section.sourceCategoryId) {
      const maxLimit = (rowCount || 1) * 4;
      if (selectionMode === 'MANUAL') {
        const manualItems = (section.items || []).filter((i: any) => i.active);
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const descendantIds = new Set(descendants.map(d => d.toString()));

        const itemsToResolve = [];
        for (const item of manualItems) {
          if (item.itemType !== 'category') continue;
          const cat = await Category.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
          if (!cat) continue;

          const isDirectChild = cat.parentCategory && cat.parentCategory.toString() === section.sourceCategoryId.toString();
          if (!isDirectChild) continue;

          const resolvedImg = resolveCategoryImage(cat);
          if (!resolvedImg) continue;

          itemsToResolve.push({
            itemType: 'category',
            referenceId: cat._id.toString(),
            name: cat.name,
            slug: cat.slug,
            image: resolvedImg,
            targetType: item.targetType || 'category',
            targetValue: item.targetValue || `/category/${cat.slug}`,
            sortOrder: item.sortOrder,
          });
        }
        resolvedItems.push(...itemsToResolve.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, maxLimit));
      } else {
        const subcategories = await Category.find({
          parentCategory: section.sourceCategoryId,
          active: true,
          deletedAt: null,
        })
          .sort({ sortOrder: 1, displayOrder: 1, name: 1, _id: 1 })
          .lean();

        let idx = 0;
        for (const sub of subcategories) {
          if (resolvedItems.length >= maxLimit) break;

          const resolvedImg = resolveCategoryImage(sub);
          if (!resolvedImg) continue;

          resolvedItems.push({
            itemType: 'category',
            referenceId: sub._id.toString(),
            name: sub.name,
            slug: sub.slug,
            image: resolvedImg,
            targetType: 'category',
            targetValue: `/category/${sub.slug}`,
            sortOrder: idx + 1,
          });
          idx++;
        }
      }
    } else if (sectionType === 'product_grid' && section.sourceCategoryId) {
      const maxLimit = 6;
      if (selectionMode === 'MANUAL') {
        const manualItems = (section.items || []).filter((i: any) => i.active);
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const descendantIds = new Set(descendants.map(d => d.toString()));

        const itemsToResolve = [];
        for (const item of manualItems) {
          if (item.itemType !== 'product') continue;
          const prod = await Product.findOne({ _id: item.referenceId, active: true, deletedAt: null }).lean();
          if (!prod) continue;

          if (!descendantIds.has(prod.category.toString())) continue;

          let sellingPrice = prod.sellingPrice;
          let mrp = prod.mrp;
          let stock = prod.stock;
          let invExists = true;

          if (storeId) {
            const inv = await StoreInventory.findOne({
              store: storeId,
              product: prod._id,
              active: true,
              deletedAt: null,
            }).lean();

            if (!inv) {
              invExists = false;
            } else {
              sellingPrice = inv.sellingPrice;
              mrp = inv.mrp;
              stock = inv.stock;
            }
          }

          if (invExists) {
            itemsToResolve.push({
              itemType: 'product',
              referenceId: prod._id.toString(),
              name: prod.name,
              slug: prod.slug,
              thumbnail: prod.thumbnail || prod.image || '',
              sellingPrice,
              mrp,
              stock,
              targetType: item.targetType || 'product',
              targetValue: item.targetValue || `/product/${prod.slug}`,
              sortOrder: item.sortOrder,
            });
          }
        }
        resolvedItems.push(...itemsToResolve.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, maxLimit));
      } else {
        const descendants = await getCategoryAndDescendants(section.sourceCategoryId);
        const products = await Product.find({
          category: { $in: descendants },
          active: true,
          deletedAt: null,
        }).lean();

        // Retrieve delivered sales quantity for all these products
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

        // Sort products: Delivered sales qty (desc) -> bestseller (desc) -> featured (desc) -> displayOrder (asc) -> _id (asc)
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

        for (const prod of sortedProducts) {
          if (resolvedItems.length >= maxLimit) break;

          let sellingPrice = prod.sellingPrice;
          let mrp = prod.mrp;
          let stock = prod.stock;
          let invExists = true;

          if (storeId) {
            const inv = await StoreInventory.findOne({
              store: storeId,
              product: prod._id,
              active: true,
              deletedAt: null,
            }).lean();

            if (!inv) {
              invExists = false;
            } else {
              sellingPrice = inv.sellingPrice;
              mrp = inv.mrp;
              stock = inv.stock;
            }
          }

          if (invExists) {
            resolvedItems.push({
              itemType: 'product',
              referenceId: prod._id.toString(),
              name: prod.name,
              slug: prod.slug,
              thumbnail: prod.thumbnail || prod.image || '',
              sellingPrice,
              mrp,
              stock,
              targetType: 'product',
              targetValue: `/product/${prod.slug}`,
              sortOrder: resolvedItems.length + 1,
            });
          }
        }
      }
    } else {
      // Legacy banner/offer/spotlight resolution
      const activeItems = (section.items || [])
        .filter((i) => i.active)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      for (const item of activeItems) {
        if (item.itemType === 'category') {
          const isBestSellers = ['best_sellers', 'best_seller_grid'].includes(section.type);
          if (isBestSellers) {
            const res = await resolveCategoryBestSellers(
              item.referenceId,
              item.displayProductIds?.length ? 'manual' : 'auto',
              item.displayProductIds || [],
              storeId
            );
            if (res) {
              resolvedItems.push({
                itemType: 'category',
                referenceId: res._id.toString(),
                name: res.name,
                slug: res.slug,
                image: res.image,
                count: res.count,
                productCount: res.productCount,
                images: res.images,
                displayProductIds: (item.displayProductIds || []).map(id => id.toString()),
                targetType: item.targetType || 'category',
                targetValue: item.targetValue || `/category/${res.slug}`,
                sortOrder: item.sortOrder,
              });
            }
          } else {
            const cat = await Category.findOne({
              _id: item.referenceId,
              active: true,
              deletedAt: null,
            }).lean();
            if (cat) {
              const resolvedImg = resolveCategoryImage(cat);
              if (resolvedImg) {
                resolvedItems.push({
                  itemType: 'category',
                  referenceId: cat._id.toString(),
                  name: cat.name,
                  slug: cat.slug,
                  image: resolvedImg,
                  targetType: item.targetType || 'category',
                  targetValue: item.targetValue || `/category/${cat.slug}`,
                  sortOrder: item.sortOrder,
                });
              }
            }
          }
        } else if (item.itemType === 'product') {
          const prod = await Product.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (!prod) continue;

          let sellingPrice = prod.sellingPrice;
          let mrp = prod.mrp;
          let stock = prod.stock;

          if (storeId) {
            const inv = await StoreInventory.findOne({
              store: storeId,
              product: prod._id,
              active: true,
              deletedAt: null,
            }).lean();

            if (!inv) {
              continue;
            }

            sellingPrice = inv.sellingPrice;
            mrp = inv.mrp;
            stock = inv.stock;
          }

          resolvedItems.push({
            itemType: 'product',
            referenceId: prod._id.toString(),
            name: prod.name,
            slug: prod.slug,
            thumbnail: prod.thumbnail || prod.image || '',
            sellingPrice,
            mrp,
            stock,
            targetType: item.targetType || 'product',
            targetValue: item.targetValue || `/product/${prod.slug}`,
            sortOrder: item.sortOrder,
          });
        } else if (item.itemType === 'banner') {
          const banner = await HeroBanner.findOne({
            _id: item.referenceId,
            active: true,
            deletedAt: null,
          }).lean();
          if (banner) {
            resolvedItems.push({
              itemType: 'banner',
              referenceId: banner._id.toString(),
              title: banner.title,
              imageUrl: banner.desktopImage || banner.mobileImage || (banner as any).imageUrl || '',
              linkUrl: banner.buttonLink || (banner as any).linkUrl || '',
              targetType: item.targetType || 'collection',
              targetValue: item.targetValue || banner.buttonLink || (banner as any).linkUrl || '',
              sortOrder: item.sortOrder,
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
              itemType: 'store',
              referenceId: store._id.toString(),
              name: store.name,
              slug: store.slug,
              city: store.city,
              targetType: item.targetType || 'internal_page',
              targetValue: item.targetValue || `/store/${store.slug}`,
              sortOrder: item.sortOrder,
            });
          }
        }
      }
    }

    resolvedSections.push({
      sectionId: section.sectionId,
      type: sectionType,
      layoutKey,
      rowCount,
      active: section.active,
      title: section.title || '',
      subtitle: section.subtitle || '',
      itemMode: selectionMode === 'MANUAL' ? 'MANUAL' : 'CATEGORY',
      sortOrder: section.sortOrder,
      items: resolvedItems,
      viewAllUrl,
      ...(sourceCategoryData ? { sourceCategory: sourceCategoryData } : {}),
      ...(section.sourceCategoryId ? { sourceCategoryId: section.sourceCategoryId } : {}),
    });
  }

  return {
    schemaVersion: publishedConfig.schemaVersion || '1.0.0',
    configVersion: publishedConfig.configVersion,
    scopeType: publishedConfig.scopeType,
    scopeId: publishedConfig.scopeId,
    publishedAt: publishedConfig.publishedAt,
    sections: resolvedSections.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getHomeData(storeId?: string, city?: string) {
  const now = new Date();

  const { resolveStoreContext } = await import('./store.service');
  const validatedStore = await resolveStoreContext(storeId, city);
  let resolvedStoreId: string | undefined = undefined;

  if (validatedStore) {
    resolvedStoreId = validatedStore._id.toString();
  }


  const effectiveCity = validatedStore ? validatedStore.city : city;



  // 1. Hierarchical Scope Precedence: STORE -> CITY -> GLOBAL
  let publishedConfig: any = null;

  if (resolvedStoreId) {
    publishedConfig = await HomeConfig.findOne({
      status: 'PUBLISHED',
      scopeType: 'STORE',
      scopeId: resolvedStoreId,
    })
      .sort({ configVersion: -1 })
      .lean();
  }

  if (!publishedConfig && effectiveCity) {
    publishedConfig = await HomeConfig.findOne({
      status: 'PUBLISHED',
      scopeType: 'CITY',
      scopeId: effectiveCity,
    })
      .sort({ configVersion: -1 })
      .lean();
  }

  if (!publishedConfig) {
    publishedConfig = await HomeConfig.findOne({
      status: 'PUBLISHED',
      scopeType: 'GLOBAL',
      scopeId: null,
    })
      .sort({ configVersion: -1 })
      .lean();
  }

  let versionedConfig = null;
  if (publishedConfig) {
    versionedConfig = await resolvePublishedHomeConfig(publishedConfig, resolvedStoreId);
  }

  // 2. Fetch legacy Home payload for guaranteed backward compatibility
  const [
    heroBanners,
    bestSellers,
    groceryKitchen,
    householdEssentials,
    sweetTooth,
    featuredThisWeek,
    snacksDrinks,
    beautyPersonalCare,
    storeSpotlight,
  ] = await Promise.all([
    HeroBanner.find({
      active: true,
      showOnHome: true,
      placement: { $ne: 'featuredThisWeek' },
      deletedAt: null,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ displayOrder: 1 })
      .lean(),
    getBestSellers(resolvedStoreId),
    getHomeCategorySection('groceryKitchen'),
    getHomeCategorySection('householdEssentials'),
    getSweetToothProducts(),
    HeroBanner.find({
      active: true,
      showOnHome: true,
      placement: 'featuredThisWeek',
      deletedAt: null,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ displayOrder: 1 })
      .lean(),
    getHomeCategorySection('snacksDrinks'),
    getHomeCategorySection('beautyPersonalCare'),
    Store.find({ featured: true, active: true, deletedAt: null })
      .sort({ displayOrder: 1 })
      .lean(),
  ]);

  let finalBestSellers = bestSellers;
  if (versionedConfig && versionedConfig.sections) {
    const bsSection = versionedConfig.sections.find(
      (sec: any) => sec.active && (sec.type === 'best_sellers' || sec.type === 'best_seller_grid')
    );
    if (bsSection && bsSection.items) {
      finalBestSellers = bsSection.items.map((item: any) => ({
        _id: item.referenceId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        itemCount: item.count || '',
        count: item.count || '',
        productCount: item.productCount || 0,
        images: item.images || [],
        active: true,
        sortOrder: item.sortOrder,
      }));
    }
  }

  return {
    resolvedStoreId: resolvedStoreId || null,
    config: versionedConfig,
    heroBanners,
    bestSellers: finalBestSellers,
    groceryKitchen,
    householdEssentials,
    sweetTooth,
    featuredThisWeek,
    snacksDrinks,
    beautyPersonalCare,
    storeSpotlight,
  };
}

