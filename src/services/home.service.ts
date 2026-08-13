import { getCustomerHomeData } from "./customerApi.service";
import type { CustomerHomeData } from "./customerApi.types";

export type HomeData = CustomerHomeData;
export type HomeCategorySection =
  | "groceryKitchen"
  | "householdEssentials"
  | "snacksDrinks"
  | "beautyPersonalCare";

export type HomeCategoryItem = {
  name: string;
  slug: string;
  image: string;
};

export function getHome(storeId?: string, city?: string): Promise<HomeData> {
  return getCustomerHomeData(storeId, city);
}



export async function getHomeCategorySection(
  section: HomeCategorySection,
): Promise<HomeCategoryItem[]> {
  const home = await getHome();

  return home[section].map((category) => {
    const image =
      typeof category.image === "string" && category.image.trim()
        ? category.image
        : category.icon || "📦";
    return {
      name: category.name,
      slug: category.slug,
      image,
    };
  });
}
