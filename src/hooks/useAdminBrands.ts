"use client";

import { useContext } from "react";
import { BrandAdminContext } from "@/store/BrandAdminProvider";

export function useAdminBrands() {
  const context = useContext(BrandAdminContext);
  if (!context) throw new Error("useAdminBrands must be used inside BrandAdminProvider");
  return context;
}
