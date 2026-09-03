"use client";

import { useContext } from "react";
import { AddressContext } from "@/store/AddressProvider";

export function useAddresses() {
  const context = useContext(AddressContext);
  

  if (!context) {
    throw new Error(
      "useAddresses must be used inside AddressProvider"
    );
  }

  return context;
}