"use client";

import { useContext } from "react";
import { DeliveryAreaAdminContext } from "@/store/DeliveryAreaAdminProvider";

export function useAdminDeliveryAreas() {
  const context = useContext(
    DeliveryAreaAdminContext
  );

  if (!context) {
    throw new Error(
      "useAdminDeliveryAreas must be used inside DeliveryAreaAdminProvider"
    );
  }

  return context;
}