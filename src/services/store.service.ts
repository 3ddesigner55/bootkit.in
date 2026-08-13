import { getCustomerStores } from "./customerApi.service";
import type {
  CustomerPagination,
  CustomerStore,
  CustomerStoreParams,
} from "./customerApi.types";

export type StoreQuery = CustomerStoreParams;
export type StoreListResult = {
  items: CustomerStore[];
  pagination: CustomerPagination;
};

export function getStores(query: StoreQuery = {}): Promise<StoreListResult> {
  return getCustomerStores(query);
}
