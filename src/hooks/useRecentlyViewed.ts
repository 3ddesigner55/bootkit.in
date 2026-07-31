"use client";

import { useContext } from "react";
import { RecentlyViewedContext } from "@/store/RecentlyViewedProvider";

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);

  if (!context) {
    throw new Error(
      "useRecentlyViewed must be used inside RecentlyViewedProvider"
    );
  }

  return context;
}