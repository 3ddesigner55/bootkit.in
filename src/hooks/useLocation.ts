"use client";

import { useContext } from "react";
import { LocationContext } from "@/store/LocationProvider";

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      "useLocation must be used inside LocationProvider"
    );
  }

  return context;
}