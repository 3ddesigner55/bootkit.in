import { getCustomerCategories } from "./customerApi.service";
import type { CustomerCategory } from "./customerApi.types";

export type CategoryData = CustomerCategory;

export function getCategories(): Promise<CategoryData[]> {
  return getCustomerCategories();
}
