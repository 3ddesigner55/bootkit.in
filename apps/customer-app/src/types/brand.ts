export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  collectionHub?:
    "beauty" | "electronics" | "pharmacy" | "decor" | "kids" | "gifting" | null;
  description: string;
  active: boolean;
};
