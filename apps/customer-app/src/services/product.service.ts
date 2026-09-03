import {
  getCustomerCatalogProducts,
  getCustomerProductBySlug,
} from "./customerApi.service";
import type {
  CustomerCatalogParams,
  CustomerCatalogResult,
  CustomerProductDetails,
} from "./customerApi.types";

export type ProductQuery = CustomerCatalogParams;
export type ProductListResult = CustomerCatalogResult;
export type ProductDetails = CustomerProductDetails;

export function getProducts(
  query: ProductQuery = {}
): Promise<ProductListResult> {
  return getCustomerCatalogProducts(query);
}

export function getProduct(
  slug: string,
  storeId?: string
): Promise<ProductDetails> {
  return getCustomerProductBySlug(slug, storeId);
}
