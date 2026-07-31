"use client";

import { useContext } from "react";
import { SettingsContext } from "@/store/SettingsProvider";

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}