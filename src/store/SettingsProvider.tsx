"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppSettings,
  SettingsContextValue,
} from "@/types/settings";

export const SettingsContext =
  createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "bootkit_app_settings_v1";

const defaultSettings: AppSettings = {
  language: "English",
  orderNotifications: true,
  offerNotifications: true,
  deliveryAlerts: true,
  vibrationEnabled: true,
  compactProductCards: false,
};

function readStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return defaultSettings;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      language:
        parsed.language === "Hindi"
          ? "Hindi"
          : "English",
      orderNotifications:
        typeof parsed.orderNotifications === "boolean"
          ? parsed.orderNotifications
          : true,
      offerNotifications:
        typeof parsed.offerNotifications === "boolean"
          ? parsed.offerNotifications
          : true,
      deliveryAlerts:
        typeof parsed.deliveryAlerts === "boolean"
          ? parsed.deliveryAlerts
          : true,
      vibrationEnabled:
        typeof parsed.vibrationEnabled === "boolean"
          ? parsed.vibrationEnabled
          : true,
      compactProductCards:
        typeof parsed.compactProductCards === "boolean"
          ? parsed.compactProductCards
          : false,
    };
  } catch {
    return defaultSettings;
  }
}

export default function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] =
    useState<AppSettings>(defaultSettings);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readStoredSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch {
      // Local storage failure should not break the app.
    }
  }, [settings, hydrated]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(
      key: K,
      value: AppSettings[K]
    ) => {
      setSettings((current) => ({
        ...current,
        [key]: value,
      }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      hydrated,
      updateSetting,
      resetSettings,
    }),
    [
      settings,
      hydrated,
      updateSetting,
      resetSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}