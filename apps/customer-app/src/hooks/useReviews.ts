"use client";

import { useContext } from "react";
import { ReviewContext } from "@/store/ReviewProvider";

export function useReviews() {
  const context = useContext(ReviewContext);

  if (!context) {
    throw new Error(
      "useReviews must be used inside ReviewProvider"
    );
  }

  return context;
}