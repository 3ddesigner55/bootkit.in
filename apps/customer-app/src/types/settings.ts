export type AppLanguage = "English" | "Hindi";

export type AppSettings = {
  language: AppLanguage;
  orderNotifications: boolean;
  offerNotifications: boolean;
  deliveryAlerts: boolean;
  vibrationEnabled: boolean;
  compactProductCards: boolean;
};

export type SettingsContextValue = {
  settings: AppSettings;
  hydrated: boolean;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  resetSettings: () => void;
};