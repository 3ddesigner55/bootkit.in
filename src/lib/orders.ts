import type { BootkitOrder } from "@/types/order";

const ORDER_STORAGE_KEY = "bootkit_orders_v1";

export const SAMPLE_ORDERS: BootkitOrder[] = [
  {
    id: "ord_sample_1",
    orderNumber: "BK82910412",
    status: "Delivered",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    itemTotal: 239,
    deliveryFee: 0,
    totalAmount: 239,
    savings: 35,
    deliveryMinutes: 6,
    createdAt: "2025-06-25T14:32:00.000Z",
    updatedAt: "2025-06-25T14:38:00.000Z",
    address: {
      fullName: "Customer",
      phone: "9876543210",
      houseNumber: "Flat 402, Sunshine Heights",
      street: "Main Road",
      area: "Sector 14",
      landmark: "Near City Mall",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      addressType: "Home",
    },
    items: [
      {
        product: {
          id: "prd_sample_milk",
          name: "Fresh Full Cream Milk",
          slug: "fresh-full-cream-milk-1l",
          brand: "BootKiT Fresh",
          categorySlug: "dairy-breakfast",
          image: "/images/products/Dairy & Breakfast/cream milk.jpg",
          images: ["/images/products/Dairy & Breakfast/cream milk.jpg"],
          thumbnail: "/images/products/Dairy & Breakfast/cream milk.jpg",
          gallery: ["/images/products/Dairy & Breakfast/cream milk.jpg"],
          variants: [],
          fallbackIcon: "🥛",
          unit: { label: "1 L", value: "1-L" },
          mrp: 72,
          price: 68,
          stock: 40,
          rating: 4.8,
          reviewCount: 210,
          deliveryMinutes: 6,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "MILK-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 1,
        },
        quantity: 2,
      },
      {
        product: {
          id: "prd_sample_butter",
          name: "Salted Table Butter",
          slug: "salted-table-butter-100g",
          brand: "Creamy",
          categorySlug: "dairy-breakfast",
          image: "/images/products/Dairy & Breakfast/Butter.webp",
          images: ["/images/products/Dairy & Breakfast/Butter.webp"],
          thumbnail: "/images/products/Dairy & Breakfast/Butter.webp",
          gallery: ["/images/products/Dairy & Breakfast/Butter.webp"],
          variants: [],
          fallbackIcon: "🧈",
          unit: { label: "100 g", value: "100-g" },
          mrp: 62,
          price: 55,
          stock: 25,
          rating: 4.6,
          reviewCount: 94,
          deliveryMinutes: 6,
          featured: false,
          bestseller: false,
          active: true,
          description: "",
          sku: "BTR-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 2,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_kurkure",
          name: "Kurkure Masala Munch",
          slug: "kurkure-masala-munch-80g",
          brand: "Kurkure",
          categorySlug: "snacks-munchies",
          image: "/images/products/Chips & namkins/kurkure/masala munch.webp",
          images: ["/images/products/Chips & namkins/kurkure/masala munch.webp"],
          thumbnail: "/images/products/Chips & namkins/kurkure/masala munch.webp",
          gallery: ["/images/products/Chips & namkins/kurkure/masala munch.webp"],
          variants: [],
          fallbackIcon: "🍿",
          unit: { label: "80 g", value: "80-g" },
          mrp: 20,
          price: 20,
          stock: 60,
          rating: 4.7,
          reviewCount: 156,
          deliveryMinutes: 6,
          featured: false,
          bestseller: true,
          active: true,
          description: "",
          sku: "KK-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 3,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_oreo",
          name: "Cadbury Oreo Chocolate Biscuit",
          slug: "cadbury-oreo-chocolate-biscuit",
          brand: "Cadbury",
          categorySlug: "dairy-breakfast",
          image: "/images/products/Dairy & Breakfast/Oreo Biscits/cadbury/cabury.webp",
          images: ["/images/products/Dairy & Breakfast/Oreo Biscits/cadbury/cabury.webp"],
          thumbnail: "/images/products/Dairy & Breakfast/Oreo Biscits/cadbury/cabury.webp",
          gallery: ["/images/products/Dairy & Breakfast/Oreo Biscits/cadbury/cabury.webp"],
          variants: [],
          fallbackIcon: "🍪",
          unit: { label: "120 g", value: "120-g" },
          mrp: 35,
          price: 28,
          stock: 50,
          rating: 4.9,
          reviewCount: 310,
          deliveryMinutes: 6,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "OREO-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 4,
        },
        quantity: 1,
      },
    ],
  },
  {
    id: "ord_sample_2",
    orderNumber: "BK73819201",
    status: "Delivered",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    itemTotal: 145,
    deliveryFee: 0,
    totalAmount: 145,
    savings: 20,
    deliveryMinutes: 7,
    createdAt: "2025-06-18T10:15:00.000Z",
    updatedAt: "2025-06-18T10:22:00.000Z",
    address: {
      fullName: "Customer",
      phone: "9876543210",
      houseNumber: "Flat 402, Sunshine Heights",
      street: "Main Road",
      area: "Sector 14",
      landmark: "Near City Mall",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      addressType: "Home",
    },
    items: [
      {
        product: {
          id: "prd_sample_apple",
          name: "Royal Gala Apple (Fresh)",
          slug: "royal-gala-apple-500g",
          brand: "Farm Fresh",
          categorySlug: "fruits-vegetables",
          image: "/images/products/Fruits/apple.jpg",
          images: ["/images/products/Fruits/apple.jpg"],
          thumbnail: "/images/products/Fruits/apple.jpg",
          gallery: ["/images/products/Fruits/apple.jpg"],
          variants: [],
          fallbackIcon: "🍎",
          unit: { label: "500 g", value: "500-g" },
          mrp: 110,
          price: 95,
          stock: 30,
          rating: 4.7,
          reviewCount: 96,
          deliveryMinutes: 7,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "APL-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 1,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_banana",
          name: "Fresh Robusta Banana",
          slug: "fresh-robusta-banana-500g",
          brand: "Farm Fresh",
          categorySlug: "fruits-vegetables",
          image: "/images/products/Fruits/banana.png",
          images: ["/images/products/Fruits/banana.png"],
          thumbnail: "/images/products/Fruits/banana.png",
          gallery: ["/images/products/Fruits/banana.png"],
          variants: [],
          fallbackIcon: "🍌",
          unit: { label: "500 g", value: "500-g" },
          mrp: 40,
          price: 30,
          stock: 25,
          rating: 4.7,
          reviewCount: 168,
          deliveryMinutes: 7,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "BNN-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 2,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_lays",
          name: "Lay's Classic Salted Potato Chips",
          slug: "lays-classic-salted-chips",
          brand: "Lay's",
          categorySlug: "snacks-munchies",
          image: "/images/products/Chips & namkins/Lays chips/shopping.webp",
          images: ["/images/products/Chips & namkins/Lays chips/shopping.webp"],
          thumbnail: "/images/products/Chips & namkins/Lays chips/shopping.webp",
          gallery: ["/images/products/Chips & namkins/Lays chips/shopping.webp"],
          variants: [],
          fallbackIcon: "🥔",
          unit: { label: "50 g", value: "50-g" },
          mrp: 20,
          price: 20,
          stock: 45,
          rating: 4.7,
          reviewCount: 220,
          deliveryMinutes: 7,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "LAYS-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 3,
        },
        quantity: 1,
      },
    ],
  },
  {
    id: "ord_sample_3",
    orderNumber: "BK61029482",
    status: "Delivered",
    paymentMethod: "COD",
    paymentStatus: "Paid",
    itemTotal: 489,
    deliveryFee: 0,
    totalAmount: 489,
    savings: 64,
    deliveryMinutes: 15,
    createdAt: "2025-06-10T18:40:00.000Z",
    updatedAt: "2025-06-10T18:55:00.000Z",
    address: {
      fullName: "Customer",
      phone: "9876543210",
      houseNumber: "Flat 402, Sunshine Heights",
      street: "Main Road",
      area: "Sector 14",
      landmark: "Near City Mall",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      addressType: "Home",
    },
    items: [
      {
        product: {
          id: "prd_sample_atta",
          name: "Whole Wheat Chakki Atta",
          slug: "whole-wheat-chakki-atta-5kg",
          brand: "Golden Grain",
          categorySlug: "atta-rice-dal",
          image: "/images/products/atta.png",
          images: ["/images/products/atta.png"],
          thumbnail: "/images/products/atta.png",
          gallery: ["/images/products/atta.png"],
          variants: [],
          fallbackIcon: "🌾",
          unit: { label: "5 kg", value: "5-kg" },
          mrp: 335,
          price: 298,
          stock: 17,
          rating: 4.8,
          reviewCount: 121,
          deliveryMinutes: 15,
          featured: true,
          bestseller: true,
          active: true,
          description: "",
          sku: "ATTA-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 1,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_juice",
          name: "Real 100% Orange Juice",
          slug: "real-orange-juice-1l",
          brand: "Real",
          categorySlug: "cold-drinks-juices",
          image: "/images/products/Cold Drinks/orange juice.png",
          images: ["/images/products/Cold Drinks/orange juice.png"],
          thumbnail: "/images/products/Cold Drinks/orange juice.png",
          gallery: ["/images/products/Cold Drinks/orange juice.png"],
          variants: [],
          fallbackIcon: "🍊",
          unit: { label: "1 L", value: "1-L" },
          mrp: 130,
          price: 110,
          stock: 35,
          rating: 4.6,
          reviewCount: 88,
          deliveryMinutes: 15,
          featured: true,
          bestseller: false,
          active: true,
          description: "",
          sku: "JC-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 2,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_onion",
          name: "Fresh Red Onion",
          slug: "fresh-red-onion-1kg",
          brand: "Farm Fresh",
          categorySlug: "fruits-vegetables",
          image: "/images/products/Vegetables & Fruits/onion.png",
          images: ["/images/products/Vegetables & Fruits/onion.png"],
          thumbnail: "/images/products/Vegetables & Fruits/onion.png",
          gallery: ["/images/products/Vegetables & Fruits/onion.png"],
          variants: [],
          fallbackIcon: "🧅",
          unit: { label: "1 kg", value: "1-kg" },
          mrp: 48,
          price: 38,
          stock: 41,
          rating: 4.5,
          reviewCount: 72,
          deliveryMinutes: 15,
          featured: false,
          bestseller: true,
          active: true,
          description: "",
          sku: "ON-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 3,
        },
        quantity: 1,
      },
      {
        product: {
          id: "prd_sample_cheese",
          name: "Amul Processed Cheese Slices",
          slug: "amul-processed-cheese-slices-100g",
          brand: "Amul",
          categorySlug: "dairy-breakfast",
          image: "/images/products/Dairy & Breakfast/Cheese/cheese.png",
          images: ["/images/products/Dairy & Breakfast/Cheese/cheese.png"],
          thumbnail: "/images/products/Dairy & Breakfast/Cheese/cheese.png",
          gallery: ["/images/products/Dairy & Breakfast/Cheese/cheese.png"],
          variants: [],
          fallbackIcon: "🧀",
          unit: { label: "100 g", value: "100-g" },
          mrp: 50,
          price: 43,
          stock: 20,
          rating: 4.8,
          reviewCount: 140,
          deliveryMinutes: 15,
          featured: false,
          bestseller: true,
          active: true,
          description: "",
          sku: "CHS-01",
          barcode: "",
          showOnHome: true,
          displayOrder: 4,
        },
        quantity: 1,
      },
    ],
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `BK${timestamp}${random}`;
}

export function getStoredOrders(): BootkitOrder[] {
  if (!isBrowser()) return SAMPLE_ORDERS;

  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(SAMPLE_ORDERS));
      return SAMPLE_ORDERS;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(SAMPLE_ORDERS));
      return SAMPLE_ORDERS;
    }

    return parsed as BootkitOrder[];
  } catch {
    return SAMPLE_ORDERS;
  }
}

export function saveOrder(order: BootkitOrder) {
  if (!isBrowser()) return;

  const currentOrders = getStoredOrders();
  const updatedOrders = [order, ...currentOrders];

  window.localStorage.setItem(
    ORDER_STORAGE_KEY,
    JSON.stringify(updatedOrders)
  );

  void saveOrderToDatabase(order);
}

async function saveOrderToDatabase(order: BootkitOrder) {
  try {
    const rawSession = window.localStorage.getItem("bootkit_session_v1");
    const session = rawSession ? JSON.parse(rawSession) : null;
    const token = session?.accessToken;
    if (!token) return;

    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
    const storeId = window.localStorage.getItem("bootkit_store_v1") || undefined;

    await fetch(`${apiBase}/orders/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order: {
          ...order,
          storeId,
        },
      }),
    });
  } catch (err) {
    console.error("Failed to save order to MongoDB:", err);
  }
}

export function getOrderByNumber(orderNumber: string) {
  return getStoredOrders().find(
    (order) => order.orderNumber === orderNumber
  );
}

export function updateStoredOrder(
  orderNumber: string,
  updater: (order: BootkitOrder) => BootkitOrder
) {
  if (!isBrowser()) return null;

  const orders = getStoredOrders();
  let updatedOrder: BootkitOrder | null = null;

  const updatedOrders = orders.map((order) => {
    if (order.orderNumber !== orderNumber) {
      return order;
    }

    updatedOrder = updater(order);
    return updatedOrder;
  });

  window.localStorage.setItem(
    ORDER_STORAGE_KEY,
    JSON.stringify(updatedOrders)
  );

  return updatedOrder;
}

export function rateStoredOrder(
  orderNumber: string,
  rating: {
    stars: number;
    feedback?: string;
    tags?: string[];
  }
) {
  return updateStoredOrder(orderNumber, (order) => ({
    ...order,
    rating: {
      ...rating,
      createdAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  }));
}

export function cancelStoredOrder(orderNumber: string) {
  return updateStoredOrder(orderNumber, (order) => ({
    ...order,
    status: "Cancelled",
    updatedAt: new Date().toISOString(),
  }));
}
