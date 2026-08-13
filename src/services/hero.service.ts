import { getCustomerHeroBanners } from "./customerApi.service";
import type { CustomerHeroBanner } from "./customerApi.types";

export type HeroBannerData = CustomerHeroBanner;

export function getHeroBanners(): Promise<HeroBannerData[]> {
  return getCustomerHeroBanners();
}
