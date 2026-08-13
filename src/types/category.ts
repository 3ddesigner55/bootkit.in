export type Category = {
  id: string;

  name: string;

  slug: string;

  description: string;

  icon: string;

  background: string;

  image?: string;

  banner?: string;

  featured: boolean;

  active: boolean;

  sortOrder: number;
  showOnHome: boolean;
  homeLayout: "grid" | "slider";
  displayOrder: number;
  collectionHub?:
    "beauty" | "electronics" | "pharmacy" | "decor" | "kids" | "gifting" | null;
  homeSection?:
    | "groceryKitchen"
    | "householdEssentials"
    | "snacksDrinks"
    | "beautyPersonalCare"
    | null;
  parentCategory?:
    | string
    | { id?: string; _id?: string; name: string; slug: string }
    | null;
  level?: 1 | 2 | 3;
  hierarchyPath?: string;
  ancestors?: Array<{ id: string; name: string; slug: string; level: number }>;
};

