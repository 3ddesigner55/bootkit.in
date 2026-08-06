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
};
