export type FilterId =
  | "brand"
  | "price"
  | "rating"
  | "discount"
  | "availability"
  | "delivery"
  | "packSize"
  | "offers";

export type FilterMode = "single" | "multiple";

export type FilterSection = {
  id: FilterId;
  label: string;
  mode: FilterMode;
  options: string[];
  searchable?: boolean;
};

export type SelectedFilters = Partial<Record<FilterId, string[]>>;

export const SORT_OPTIONS = [
  "Relevance",
  "Popularity",
  "Price Low → High",
  "Price High → Low",
  "Discount High → Low",
  "Rating",
] as const;

export const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "brand",
    label: "Brand",
    mode: "multiple",
    searchable: true,
    options: ["Amul", "Mother Dairy", "Nestlé", "Farm Fresh", "Coca-Cola"],
  },
  {
    id: "price",
    label: "Price",
    mode: "single",
    options: ["₹0 – ₹100", "₹100 – ₹250", "₹250 – ₹500", "₹500+"],
  },
  {
    id: "rating",
    label: "Rating",
    mode: "single",
    options: ["4★ & Above", "4.5★ & Above", "5★ Only"],
  },
  {
    id: "discount",
    label: "Discount",
    mode: "multiple",
    options: ["10%+", "20%+", "30%+", "50%+"],
  },
  {
    id: "availability",
    label: "Availability",
    mode: "multiple",
    options: ["In Stock", "Out of Stock"],
  },
  {
    id: "delivery",
    label: "Delivery",
    mode: "multiple",
    options: ["10 mins", "20 mins", "30 mins"],
  },
  {
    id: "packSize",
    label: "Pack Size",
    mode: "multiple",
    options: ["250 g", "500 g", "1 kg", "2 kg"],
  },
  {
    id: "offers",
    label: "Offers",
    mode: "multiple",
    options: ["Buy 1 Get 1", "Combo", "Flash Sale"],
  },
];
