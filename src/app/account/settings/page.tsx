"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Languages,
  LayoutGrid,
  RotateCcw,
  Settings,
  Smartphone,
  Tag,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useSettings } from "@/hooks/useSettings";
import type { AppLanguage } from "@/types/settings";

export default function AccountSettingsPage() {
  const {
    settings,
    hydrated,
    updateSetting,
    resetSettings,
  } = useSettings();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-6">
          <div className="h-[540px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  const resetAllSettings = () => {
    const confirmed = window.confirm(
      "Reset all BootKiT app settings?"
    );

    if (!confirmed) return;

    resetSettings();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/account"
              aria-label="Back to account"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                App settings
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Control notifications and app preferences
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <SectionTitle
                  icon={Languages}
                  title="Language"
                  description="Choose your preferred app language"
                />

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {(["English", "Hindi"] as AppLanguage[]).map(
                    (language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() =>
                          updateSetting("language", language)
                        }
                        className={`h-12 rounded-2xl border text-sm font-black transition ${
                          settings.language === language
                            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                            : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                        }`}
                      >
                        {language === "English"
                          ? "English"
                          : "हिन्दी"}
                      </button>
                    )
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <SectionTitle
                  icon={Bell}
                  title="Notifications"
                  description="Choose which updates BootKiT should show"
                />

                <div className="mt-5 divide-y divide-[var(--border)]">
                  <SettingToggle
                    icon={BellRing}
                    title="Order notifications"
                    description="Order confirmation and status updates"
                    checked={settings.orderNotifications}
                    onChange={(checked) =>
                      updateSetting(
                        "orderNotifications",
                        checked
                      )
                    }
                  />

                  <SettingToggle
                    icon={Tag}
                    title="Offers and coupons"
                    description="Discounts and promotional alerts"
                    checked={settings.offerNotifications}
                    onChange={(checked) =>
                      updateSetting(
                        "offerNotifications",
                        checked
                      )
                    }
                  />

                  <SettingToggle
                    icon={Smartphone}
                    title="Delivery alerts"
                    description="Packing and out-for-delivery updates"
                    checked={settings.deliveryAlerts}
                    onChange={(checked) =>
                      updateSetting(
                        "deliveryAlerts",
                        checked
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
                <SectionTitle
                  icon={Settings}
                  title="App experience"
                  description="Adjust mobile app behaviour"
                />

                <div className="mt-5 divide-y divide-[var(--border)]">
                  <SettingToggle
                    icon={Smartphone}
                    title="Vibration feedback"
                    description="Vibrate after important actions when supported"
                    checked={settings.vibrationEnabled}
                    onChange={(checked) => {
                      updateSetting(
                        "vibrationEnabled",
                        checked
                      );

                      if (
                        checked &&
                        typeof navigator !== "undefined" &&
                        "vibrate" in navigator
                      ) {
                        navigator.vibrate(35);
                      }
                    }}
                  />

                  <SettingToggle
                    icon={LayoutGrid}
                    title="Compact product cards"
                    description="Show more products on small screens"
                    checked={settings.compactProductCards}
                    onChange={(checked) =>
                      updateSetting(
                        "compactProductCards",
                        checked
                      )
                    }
                  />
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-[104px] lg:self-start">
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
                  <Settings size={22} />
                </span>

                <h2 className="mt-4 text-lg font-black text-[var(--text-primary)]">
                  Current preferences
                </h2>

                <div className="mt-5 space-y-3 text-xs">
                  <PreferenceRow
                    label="Language"
                    value={settings.language}
                  />

                  <PreferenceRow
                    label="Order alerts"
                    value={
                      settings.orderNotifications
                        ? "Enabled"
                        : "Disabled"
                    }
                  />

                  <PreferenceRow
                    label="Offer alerts"
                    value={
                      settings.offerNotifications
                        ? "Enabled"
                        : "Disabled"
                    }
                  />

                  <PreferenceRow
                    label="Delivery alerts"
                    value={
                      settings.deliveryAlerts
                        ? "Enabled"
                        : "Disabled"
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={resetAllSettings}
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-xs font-black text-[var(--danger)]"
                >
                  <RotateCcw size={15} />
                  Reset settings
                </button>

                <p className="mt-4 text-center text-[10px] leading-4 text-[var(--text-muted)]">
                  These settings remain saved only on this device.
                </p>
              </section>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}

type SectionTitleProps = {
  icon: typeof Settings;
  title: string;
  description: string;
};

function SectionTitle({
  icon: Icon,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={19} />
      </span>

      <div>
        <h2 className="text-lg font-black text-[var(--text-primary)]">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

type SettingToggleProps = {
  icon: typeof Settings;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]">
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[var(--text-primary)]">
          {title}
        </span>

        <span className="mt-0.5 block text-[10px] leading-4 text-[var(--text-muted)]">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function PreferenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--text-muted)]">
        {label}
      </span>

      <span className="font-black text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}