import type { Product } from "@/types/product";

export type ProductCollectionCategory = {
  id?: string;
  title: string;
  slug?: string;
  count?: string;
  images: string[];
  /** Legacy local collections use this client-only matcher. */
  matches?: (product: Product) => boolean;
};

export const BEST_SELLER_CATEGORIES: ProductCollectionCategory[] = [
  {
    title: "Dairy & Breakfast",
    count: "48+ Items",
    images: [
      "/images/products/cream milk.jpg",
      "/images/products/Butter.webp",
      "/images/products/cheese.png",
      "/images/products/Biscuit.png",
    ],
    matches: (product) => product.categorySlug === "dairy-breakfast",
  },
  {
    title: "Fresh Fruits",
    count: "36+ Items",
    images: [
      "/images/products/apple.jpg",
      "/images/products/banana.png",
      "/images/products/orange.png",
      "/images/products/tomato.png",
    ],
    matches: (product) => ["prd_banana_1kg", "prd_apple_1kg"].includes(product.id),
  },
  {
    title: "Cold Drinks",
    count: "24+ Items",
    images: [
      "/images/products/coca-cola.png",
      "/images/products/thums up.png",
      "/images/products/limca.png",
      "/images/products/orange juice.png",
    ],
    matches: (product) => product.categorySlug === "cold-drinks-juices",
  },
  {
    title: "Vegetables",
    count: "30+ Items",
    images: [
      "/images/products/potato.png",
      "/images/products/onion.png",
      "/images/products/tomato.png",
      "/images/products/banana.png",
    ],
    matches: (product) =>
      ["prd_tomato_1kg", "prd_onion_1kg", "prd_spinach"].includes(
        product.id
      ),
  },
  {
    title: "Snacks",
    count: "18+ Items",
    images: [
      "/images/products/Biscuit.png",
      "/images/products/cheese.png",
      "/images/products/Butter.webp",
      "/images/products/orange juice.png",
    ],
    matches: (product) => product.categorySlug === "snacks-munchies",
  },
  {
    title: "Ice & More",
    count: "100+ Items",
    images: [
      "/images/products/apple.jpg",
      "/images/products/coca-cola.png",
      "/images/products/potato.png",
      "/images/products/cream milk.jpg",
    ],
    matches: (product) =>
      !["dairy-breakfast", "cold-drinks-juices", "snacks-munchies"].includes(
        product.categorySlug
      ),
  },
];

export const ORDER_AGAIN_CATEGORIES: ProductCollectionCategory[] = [
  {
    title: "All",
    images: ["/images/products/cream milk.jpg"],
    matches: () => true,
  },
  ...BEST_SELLER_CATEGORIES,
];
