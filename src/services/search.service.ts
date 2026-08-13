import { searchCustomerCatalog } from "./customerApi.service";
import type { CustomerSearchResult } from "./customerApi.types";

export type SearchQuery = {
  page?: number;
  limit?: number;
};

export type SearchResult = CustomerSearchResult;

export function searchProducts(
  query: string,
  options: SearchQuery = {}
): Promise<SearchResult> {
  return searchCustomerCatalog(query, options);
}
