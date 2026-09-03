import type {
  CustomerBrand,
  CustomerBrandReference,
  CustomerCategory,
  CustomerCategoryReference,
  CustomerHeroBanner,
  CustomerProduct,
  CustomerProductVariant,
  CustomerStore,
  CustomerBestSellerItem,
} from "./customerApi.types";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown, entity: string): ApiRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${entity} response is invalid.`);
  }

  return value as ApiRecord;
}

function requiredString(
  record: ApiRecord,
  key: string,
  entity: string,
): string {
  const value = record[key];

  if (typeof value !== "string" || !value) {
    throw new Error(`${entity} response is missing ${key}.`);
  }

  return value;
}

function optionalString(record: ApiRecord, key: string): string | undefined {
  const value = record[key];

  return typeof value === "string" ? value : undefined;
}

function requiredNumber(
  record: ApiRecord,
  key: string,
  entity: string,
): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${entity} response is missing ${key}.`);
  }

  return value;
}

function optionalNumber(record: ApiRecord, key: string): number | undefined {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function requiredBoolean(
  record: ApiRecord,
  key: string,
  entity: string,
): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    throw new Error(`${entity} response is missing ${key}.`);
  }

  return value;
}

function optionalBoolean(record: ApiRecord, key: string): boolean | undefined {
  const value = record[key];

  return typeof value === "boolean" ? value : undefined;
}

function stringArray(record: ApiRecord, key: string): string[] | undefined {
  const value = record[key];

  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    return undefined;
  }

  return value;
}

function getId(record: ApiRecord, entity: string): string {
  const id = optionalString(record, "id") ?? optionalString(record, "_id");

  if (!id) {
    throw new Error(`${entity} response is missing an identifier.`);
  }

  return id;
}

function toCategoryReference(
  value: unknown,
): CustomerCategoryReference | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as ApiRecord;

  return {
    id: getId(record, "Category"),
    name: requiredString(record, "name", "Category"),
    slug: requiredString(record, "slug", "Category"),
  };
}

function toBrandReference(value: unknown): CustomerBrandReference | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as ApiRecord;

  return {
    id: getId(record, "Brand"),
    name: requiredString(record, "name", "Brand"),
    ...(optionalString(record, "slug")
      ? { slug: optionalString(record, "slug") }
      : {}),
    ...(optionalString(record, "logo")
      ? { logo: optionalString(record, "logo") }
      : {}),
  };
}

function toProductVariant(value: unknown): CustomerProductVariant {
  const record = asRecord(value, "Product variant");
  const unit = record.unit;

  return {
    ...(optionalString(record, "_id")
      ? { id: optionalString(record, "_id") }
      : {}),
    name: requiredString(record, "name", "Product variant"),
    sku: requiredString(record, "sku", "Product variant"),
    ...(optionalString(record, "barcode")
      ? { barcode: optionalString(record, "barcode") }
      : {}),
    ...(optionalString(record, "color")
      ? { color: optionalString(record, "color") }
      : {}),
    ...(optionalString(record, "size")
      ? { size: optionalString(record, "size") }
      : {}),
    ...(optionalString(record, "weight")
      ? { weight: optionalString(record, "weight") }
      : {}),
    ...(optionalString(record, "image")
      ? { image: optionalString(record, "image") }
      : {}),
    ...(stringArray(record, "images")
      ? { images: stringArray(record, "images") }
      : {}),
    ...(unit && typeof unit === "object" && !Array.isArray(unit)
      ? {
          unit: {
            label: requiredString(
              unit as ApiRecord,
              "label",
              "Product variant unit",
            ),
            value: requiredString(
              unit as ApiRecord,
              "value",
              "Product variant unit",
            ),
          },
        }
      : {}),
    mrp: requiredNumber(record, "mrp", "Product variant"),
    price: requiredNumber(record, "price", "Product variant"),
    stock: requiredNumber(record, "stock", "Product variant"),
    ...(optionalNumber(record, "availableStock") !== undefined
      ? { availableStock: optionalNumber(record, "availableStock") }
      : {}),
    active: requiredBoolean(record, "active", "Product variant"),
    ...(optionalBoolean(record, "isAvailable") !== undefined
      ? { isAvailable: optionalBoolean(record, "isAvailable") }
      : {}),
  };
}

export function toCustomerProduct(value: unknown): CustomerProduct {
  const record = asRecord(value, "Product");
  const populatedCategory = toCategoryReference(record.category);
  const populatedBrand = toBrandReference(record.brand);
  const categoryId =
    optionalString(record, "categoryId") ?? populatedCategory?.id;
  const categorySlug =
    optionalString(record, "categorySlug") ?? populatedCategory?.slug;
  const categoryName =
    optionalString(record, "categoryName") ?? populatedCategory?.name;
  const brandId = optionalString(record, "brandId") ?? populatedBrand?.id;
  const brandName = optionalString(record, "brandName") ?? populatedBrand?.name;
  const category =
    categoryId && categoryName && categorySlug
      ? { id: categoryId, name: categoryName, slug: categorySlug }
      : undefined;
  const brand =
    brandId && brandName
      ? {
          id: brandId,
          name: brandName,
          ...(populatedBrand?.slug ? { slug: populatedBrand.slug } : {}),
          ...(populatedBrand?.logo ? { logo: populatedBrand.logo } : {}),
        }
      : undefined;
  const variants = Array.isArray(record.variants)
    ? record.variants.map(toProductVariant)
    : undefined;

  return {
    id: getId(record, "Product"),
    name: requiredString(record, "name", "Product"),
    slug: requiredString(record, "slug", "Product"),
    ...(optionalString(record, "description")
      ? { description: optionalString(record, "description") }
      : {}),
    ...(optionalString(record, "shortDescription")
      ? { shortDescription: optionalString(record, "shortDescription") }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(categorySlug ? { categorySlug } : {}),
    ...(categoryName ? { categoryName } : {}),
    ...(category ? { category } : {}),
    ...(brandId ? { brandId } : {}),
    ...(brandName ? { brandName } : {}),
    ...(brand ? { brand } : {}),
    ...(optionalNumber(record, "mrp") !== undefined
      ? { mrp: optionalNumber(record, "mrp") }
      : {}),
    sellingPrice: requiredNumber(record, "sellingPrice", "Product"),
    ...(optionalNumber(record, "discountPercent") !== undefined
      ? { discountPercent: optionalNumber(record, "discountPercent") }
      : {}),
    ...(optionalString(record, "sku")
      ? { sku: optionalString(record, "sku") }
      : {}),
    ...(optionalString(record, "barcode")
      ? { barcode: optionalString(record, "barcode") }
      : {}),
    stock: requiredNumber(record, "stock", "Product"),
    ...(optionalNumber(record, "availableStock") !== undefined
      ? { availableStock: optionalNumber(record, "availableStock") }
      : {}),
    ...(optionalNumber(record, "minStock") !== undefined
      ? { minStock: optionalNumber(record, "minStock") }
      : {}),
    ...(optionalBoolean(record, "trackInventory") !== undefined
      ? { trackInventory: optionalBoolean(record, "trackInventory") }
      : {}),
    ...(optionalString(record, "thumbnail")
      ? { thumbnail: optionalString(record, "thumbnail") }
      : {}),
    ...(stringArray(record, "gallery")
      ? { gallery: stringArray(record, "gallery") }
      : {}),
    ...(variants ? { variants } : {}),
    ...(stringArray(record, "tags")
      ? { tags: stringArray(record, "tags") }
      : {}),
    ...(optionalString(record, "fallbackIcon")
      ? { fallbackIcon: optionalString(record, "fallbackIcon") }
      : {}),
    ...(optionalNumber(record, "rating") !== undefined
      ? { rating: optionalNumber(record, "rating") }
      : {}),
    featured: requiredBoolean(record, "featured", "Product"),
    ...(optionalBoolean(record, "bestseller") !== undefined
      ? { bestseller: optionalBoolean(record, "bestseller") }
      : {}),
    active: requiredBoolean(record, "active", "Product"),
    ...(optionalBoolean(record, "isAvailable") !== undefined
      ? { isAvailable: optionalBoolean(record, "isAvailable") }
      : {}),
    showOnHome: requiredBoolean(record, "showOnHome", "Product"),
    ...(optionalString(record, "homeSection")
      ? { homeSection: optionalString(record, "homeSection") }
      : {}),
    displayOrder: requiredNumber(record, "displayOrder", "Product"),
    ...(optionalNumber(record, "weight") !== undefined
      ? { weight: optionalNumber(record, "weight") }
      : {}),
    ...(optionalString(record, "unit")
      ? { unit: optionalString(record, "unit") }
      : {}),
    ...(optionalNumber(record, "deliveryMinutes") !== undefined
      ? { deliveryMinutes: optionalNumber(record, "deliveryMinutes") }
      : {}),
    ...(optionalString(record, "createdAt")
      ? { createdAt: optionalString(record, "createdAt") }
      : {}),
    ...(optionalString(record, "updatedAt")
      ? { updatedAt: optionalString(record, "updatedAt") }
      : {}),
  };
}

export function toCustomerCategory(value: unknown): CustomerCategory {
  const record = asRecord(value, "Category");

  return {
    id: getId(record, "Category"),
    name: requiredString(record, "name", "Category"),
    slug: requiredString(record, "slug", "Category"),
    ...(optionalString(record, "description")
      ? { description: optionalString(record, "description") }
      : {}),
    ...(optionalString(record, "icon")
      ? { icon: optionalString(record, "icon") }
      : {}),
    ...(optionalString(record, "background")
      ? { background: optionalString(record, "background") }
      : {}),
    ...(optionalString(record, "image")
      ? { image: optionalString(record, "image") }
      : {}),
    ...(optionalString(record, "banner")
      ? { banner: optionalString(record, "banner") }
      : {}),
    ...(optionalBoolean(record, "featured") !== undefined
      ? { featured: optionalBoolean(record, "featured") }
      : {}),
    active: requiredBoolean(record, "active", "Category"),
    ...(optionalBoolean(record, "showOnHome") !== undefined
      ? { showOnHome: optionalBoolean(record, "showOnHome") }
      : {}),
    ...(optionalNumber(record, "displayOrder") !== undefined
      ? { displayOrder: optionalNumber(record, "displayOrder") }
      : {}),
    ...(optionalNumber(record, "sortOrder") !== undefined
      ? { sortOrder: optionalNumber(record, "sortOrder") }
      : {}),
    ...(record.homeLayout === "grid" || record.homeLayout === "slider"
      ? { homeLayout: record.homeLayout }
      : {}),
    ...(record.collectionHub === null ||
    typeof record.collectionHub === "string"
      ? { collectionHub: record.collectionHub }
      : {}),
    ...(optionalNumber(record, "productCount") !== undefined
      ? { productCount: optionalNumber(record, "productCount") }
      : {}),
    ...(Array.isArray(record.productThumbnails)
      ? {
          productThumbnails: record.productThumbnails.filter(
            (t): t is string => typeof t === "string",
          ),
        }
      : {}),
  };
}

export function toCustomerBrand(value: unknown): CustomerBrand {
  const record = asRecord(value, "Brand");

  return {
    id: getId(record, "Brand"),
    name: requiredString(record, "name", "Brand"),
    slug: requiredString(record, "slug", "Brand"),
    ...(optionalString(record, "description")
      ? { description: optionalString(record, "description") }
      : {}),
    ...(optionalString(record, "logo")
      ? { logo: optionalString(record, "logo") }
      : {}),
    ...(optionalString(record, "website")
      ? { website: optionalString(record, "website") }
      : {}),
    ...(optionalBoolean(record, "featured") !== undefined
      ? { featured: optionalBoolean(record, "featured") }
      : {}),
    active: requiredBoolean(record, "active", "Brand"),
    ...(optionalNumber(record, "displayOrder") !== undefined
      ? { displayOrder: optionalNumber(record, "displayOrder") }
      : {}),
  };
}

export function toCustomerStore(value: unknown): CustomerStore {
  const record = asRecord(value, "Store");

  return {
    id: getId(record, "Store"),
    name: requiredString(record, "name", "Store"),
    slug: requiredString(record, "slug", "Store"),
    ...(optionalString(record, "description")
      ? { description: optionalString(record, "description") }
      : {}),
    ...(optionalString(record, "logo")
      ? { logo: optionalString(record, "logo") }
      : {}),
    ...(optionalString(record, "banner")
      ? { banner: optionalString(record, "banner") }
      : {}),
    ...(optionalString(record, "email")
      ? { email: optionalString(record, "email") }
      : {}),
    phone: requiredString(record, "phone", "Store"),
    ...(optionalString(record, "addressLine1")
      ? { addressLine1: optionalString(record, "addressLine1") }
      : {}),
    ...(optionalString(record, "addressLine2")
      ? { addressLine2: optionalString(record, "addressLine2") }
      : {}),
    city: requiredString(record, "city", "Store"),
    state: requiredString(record, "state", "Store"),
    country: requiredString(record, "country", "Store"),
    ...(optionalString(record, "postalCode")
      ? { postalCode: optionalString(record, "postalCode") }
      : {}),
    ...(optionalNumber(record, "deliveryRadius") !== undefined
      ? { deliveryRadius: optionalNumber(record, "deliveryRadius") }
      : {}),
    ...(optionalNumber(record, "minimumOrderAmount") !== undefined
      ? { minimumOrderAmount: optionalNumber(record, "minimumOrderAmount") }
      : {}),
    active: requiredBoolean(record, "active", "Store"),
    ...(optionalBoolean(record, "featured") !== undefined
      ? { featured: optionalBoolean(record, "featured") }
      : {}),
    ...(optionalNumber(record, "displayOrder") !== undefined
      ? { displayOrder: optionalNumber(record, "displayOrder") }
      : {}),
    ...(optionalString(record, "openingTime")
      ? { openingTime: optionalString(record, "openingTime") }
      : {}),
    ...(optionalString(record, "closingTime")
      ? { closingTime: optionalString(record, "closingTime") }
      : {}),
  };
}

export function toCustomerHeroBanner(value: unknown): CustomerHeroBanner {
  const record = asRecord(value, "Hero banner");

  return {
    id: getId(record, "Hero banner"),
    title: requiredString(record, "title", "Hero banner"),
    ...(optionalString(record, "subtitle")
      ? { subtitle: optionalString(record, "subtitle") }
      : {}),
    desktopImage: requiredString(record, "desktopImage", "Hero banner"),
    ...(optionalString(record, "mobileImage")
      ? { mobileImage: optionalString(record, "mobileImage") }
      : {}),
    ...(optionalString(record, "buttonText")
      ? { buttonText: optionalString(record, "buttonText") }
      : {}),
    ...(optionalString(record, "buttonLink")
      ? { buttonLink: optionalString(record, "buttonLink") }
      : {}),
    displayOrder: requiredNumber(record, "displayOrder", "Hero banner"),
    showOnHome: requiredBoolean(record, "showOnHome", "Hero banner"),
    active: requiredBoolean(record, "active", "Hero banner"),
  };
}

export function toCustomerBestSellerItem(value: unknown): CustomerBestSellerItem {
  const record = asRecord(value, "Best seller item");
  const images = Array.isArray(record.images) ? record.images : [];
  const countText = optionalString(record, "count");
  const countNumber =
    optionalNumber(record, "count") ??
    optionalNumber(record, "productCount");

  return {
    id: getId(record, "Best seller item"),
    name: requiredString(record, "name", "Best seller item"),
    slug: requiredString(record, "slug", "Best seller item"),
    count:
      countText ??
      (countNumber !== undefined ? `${countNumber}+ Items` : ""),
    images: images.map((img) => (typeof img === "string" ? img : "")),
    sortOrder: requiredNumber(record, "sortOrder", "Best seller item"),
  };
}
