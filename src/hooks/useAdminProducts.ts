"use client";

import { useContext } from "react";
import { ProductAdminContext } from "@/store/ProductAdminProvider";

export function useAdminProducts() {
  const context = useContext(
    ProductAdminContext
  );

  if (!context) {
    throw new Error(
      "useAdminProducts must be used inside ProductAdminProvider"
    );
  }

  return context;
}