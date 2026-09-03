export type CustomerPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerProductVariant = {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight?: string;
  image?: string;
  images?: string[];
  attributes?: Record<string, string>;
  unit?: {
    label: string;
    value: string;
  };
  mrp: number;
  price: number;
  stock: number;
  availableStock?: number;
  active: boolean;
  isAvailable?: boolean;
};

export type CustomerCategoryReference = {
  id: string;
  name: string;
  slug: string;
};

export type CustomerBrandReference = {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
};

export type CustomerProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  category?: CustomerCategoryReference;
  brandId?: string;
  brandName?: string;
  brand?: CustomerBrandReference;
  mrp?: number;
  sellingPrice: number;
  discountPercent?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  availableStock?: number;
  minStock?: number;
  trackInventory?: boolean;
  thumbnail?: string;
  gallery?: string[];
  variants?: CustomerProductVariant[];
  tags?: string[];
  fallbackIcon?: string;
  rating?: number;
  featured: boolean;
  bestseller?: boolean;
  active: boolean;
  isAvailable?: boolean;
  showOnHome: boolean;
  homeSection?: string;
  displayOrder: number;
  weight?: number;
  unit?: string;
  deliveryMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  background?: string;
  image?: string;
  banner?: string;
  featured?: boolean;
  active: boolean;
  showOnHome?: boolean;
  displayOrder?: number;
  sortOrder?: number;
  homeLayout?: "grid" | "slider";
  collectionHub?: string | null;
  productCount?: number;
  productThumbnails?: string[];
};

export type CustomerBrand = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  featured?: boolean;
  active: boolean;
  displayOrder?: number;
};

export type CustomerStore = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  deliveryRadius?: number;
  minimumOrderAmount?: number;
  active: boolean;
  featured?: boolean;
  displayOrder?: number;
  openingTime?: string;
  closingTime?: string;
};

export type CustomerHeroBanner = {
  id: string;
  title: string;
  subtitle?: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  showOnHome: boolean;
  active: boolean;
};

export type CustomerBestSellerItem = {
  id: string;
  name: string;
  slug: string;
  count: string;
  images: string[];
  sortOrder: number;
};

export type CustomerHomeData = {
  resolvedStoreId?: string | null;
  config?: any | null;
  heroBanners: CustomerHeroBanner[];
  bestSellers: CustomerBestSellerItem[];
  groceryKitchen: CustomerCategory[];
  householdEssentials: CustomerCategory[];
  sweetTooth: CustomerProduct[];
  featuredThisWeek: CustomerHeroBanner[];
  snacksDrinks: CustomerCategory[];
  beautyPersonalCare: CustomerCategory[];
  storeSpotlight: CustomerStore[];
};



export type CustomerProductDetails = {
  product: CustomerProduct;
  category: CustomerCategory | null;
  brand: CustomerBrand | null;
  relatedProducts: CustomerProduct[];
};

export type CustomerCatalogResult = {
  items: CustomerProduct[];
  pagination: CustomerPagination;
};

export type CustomerSearchResult = {
  products: CustomerProduct[];
  categories: CustomerCategory[];
  brands: CustomerBrand[];
  stores: CustomerStore[];
  meta: CustomerPagination & {
    q: string;
    totals: {
      products: number;
      categories: number;
      brands: number;
      stores: number;
    };
  };
};

export type CustomerCatalogParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  search?: string;
  category?: string;
  brand?: string;
  featured?: boolean;
  showOnHome?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "priceAsc" | "priceDesc" | "nameAsc" | "nameDesc";
};

export type CustomerStoreParams = {
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
  featured?: boolean;
  sort?: "newest" | "oldest" | "name-asc" | "display-order";
};
