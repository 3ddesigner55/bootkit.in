"use client";

import { useContext } from "react";
import { CategoryAdminContext } from "@/store/CategoryAdminProvider";

export function useAdminCategories() {
  const context = useContext(
    CategoryAdminContext
  );

  if (!context) {
    throw new Error(
      "useAdminCategories must be used inside CategoryAdminProvider"
    );
  }

  return context;
}