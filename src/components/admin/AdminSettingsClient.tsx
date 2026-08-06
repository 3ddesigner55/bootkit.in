"use client";

import {
  CheckCircle2,
  MapPin,
  RefreshCw,
  Save,
  Settings2,
} from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";

type SettingsForm = {
  storeName: string;
  businessName: string;
  gstNumber: string;
  contactEmail: string;
  contactPhone: string;
  storeLogo: string;
  favicon: string;
  addressLine: string;
  city: string;
  state: string;
  pinCode: string;
  defaultDeliveryCharge: string;
  freeDeliveryAbove: string;
  deliveryRadius: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  currency: string;
  timezone: string;
  language: string;
};

const initialForm: SettingsForm = {
  storeName: "BootKiT",
  businessName: "BootKiT Commerce",
  gstNumber: "",
  contactEmail: "",
  contactPhone: "",
  storeLogo: "",
  favicon: "",
  addressLine: "",
  city: "",
  state: "",
  pinCode: "",
  defaultDeliveryCharge: "29",
  freeDeliveryAbove: "499",
  deliveryRadius: "8",
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  language: "English",
};

function toUploaderValue(
  url: string,
  id: string,
  name: string
): ImageUploaderItem[] {
  if (!url) return [];

  return [
    {
      id,
      url,
      name,
      progress: url.startsWith("blob:") ? 0 : 100,
      status: url.startsWith("blob:") ? "ready" : "uploaded",
    },
  ];
}

export default function AdminSettingsClient() {
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [message, setMessage] = useState("");
  const [isLoading] = useState(false);

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "pinCode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    if (
      name === "defaultDeliveryCharge" ||
      name === "freeDeliveryAbove" ||
      name === "deliveryRadius"
    ) {
      nextValue = value.replace(/[^d.]/g, "");
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
    setMessage("");
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Settings saved in this preview session.");
  };

  const resetSettings = () => {
    setForm(initialForm);
    setMessage("Settings reset in this preview session.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Container className="py-6">
          <AdminLoadingSkeleton variant="page" className="h-[760px]" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="Store settings"
            description="Configure your storefront and delivery defaults"
            action={
              <button
                type="button"
                onClick={resetSettings}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--danger)]"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            }
          />

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          <form onSubmit={saveSettings} className="space-y-5">
            <SettingsSection
              icon={<Settings2 size={18} />}
              title="Store Information"
              description="Core business details displayed across future customer communications."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Store Name" name="storeName" value={form.storeName} placeholder="BootKiT" onChange={updateField} required />
                <SettingsField label="Business Name" name="businessName" value={form.businessName} placeholder="BootKiT Commerce" onChange={updateField} required />
                <SettingsField label="GST Number" name="gstNumber" value={form.gstNumber} placeholder="22AAAAA0000A1Z5" onChange={updateField} />
                <SettingsField label="Contact Email" name="contactEmail" value={form.contactEmail} placeholder="support@example.com" inputMode="email" onChange={updateField} />
                <SettingsField label="Contact Phone" name="contactPhone" value={form.contactPhone} placeholder="9876543210" inputMode="tel" onChange={updateField} />
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Settings2 size={18} />}
              title="Branding"
              description="Select brand assets for the future backend upload flow."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploader
                  label="Store Logo"
                  value={toUploaderValue(
                    form.storeLogo,
                    "store-logo",
                    "Store logo"
                  )}
                  onChange={(items) =>
                    setForm((current) => ({
                      ...current,
                      storeLogo: items[0]?.url ?? "",
                    }))
                  }
                />
                <ImageUploader
                  label="Favicon"
                  value={toUploaderValue(
                    form.favicon,
                    "store-favicon",
                    "Store favicon"
                  )}
                  onChange={(items) =>
                    setForm((current) => ({
                      ...current,
                      favicon: items[0]?.url ?? "",
                    }))
                  }
                />
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<MapPin size={18} />}
              title="Address"
              description="Primary business address for delivery and legal documents."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Address Line" name="addressLine" value={form.addressLine} placeholder="Street and building" onChange={updateField} />
                <SettingsField label="City" name="city" value={form.city} placeholder="Sardarshahar" onChange={updateField} />
                <SettingsField label="State" name="state" value={form.state} placeholder="Rajasthan" onChange={updateField} />
                <SettingsField label="PIN Code" name="pinCode" value={form.pinCode} placeholder="331403" inputMode="numeric" onChange={updateField} />
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Settings2 size={18} />}
              title="Delivery Settings"
              description="Default values for future checkout and delivery calculations."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <SettingsField label="Default Delivery Charge" name="defaultDeliveryCharge" value={form.defaultDeliveryCharge} placeholder="29" inputMode="decimal" onChange={updateField} />
                <SettingsField label="Free Delivery Above" name="freeDeliveryAbove" value={form.freeDeliveryAbove} placeholder="499" inputMode="decimal" onChange={updateField} />
                <SettingsField label="Delivery Radius (km)" name="deliveryRadius" value={form.deliveryRadius} placeholder="8" inputMode="decimal" onChange={updateField} />
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Settings2 size={18} />}
              title="Social Links"
              description="Optional links for future storefront and campaign surfaces."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Facebook" name="facebook" value={form.facebook} placeholder="https://facebook.com/bootkit" inputMode="url" onChange={updateField} />
                <SettingsField label="Instagram" name="instagram" value={form.instagram} placeholder="https://instagram.com/bootkit" inputMode="url" onChange={updateField} />
                <SettingsField label="X (Twitter)" name="twitter" value={form.twitter} placeholder="https://x.com/bootkit" inputMode="url" onChange={updateField} />
                <SettingsField label="YouTube" name="youtube" value={form.youtube} placeholder="https://youtube.com/@bootkit" inputMode="url" onChange={updateField} />
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Settings2 size={18} />}
              title="General"
              description="Default application preferences for future backend configuration."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <SettingsSelect label="Currency" value={form.currency} onChange={(value) => setForm((current) => ({ ...current, currency: value }))} options={["INR"]} />
                <SettingsSelect label="Timezone" value={form.timezone} onChange={(value) => setForm((current) => ({ ...current, timezone: value }))} options={["Asia/Kolkata"]} />
                <SettingsSelect label="Language" value={form.language} onChange={(value) => setForm((current) => ({ ...current, language: value }))} options={["English", "Hindi"]} />
              </div>
            </SettingsSection>

            <div className="flex justify-end">
              <AdminPrimaryButton
                type="submit"
                icon={<Save size={17} />}
                className="h-12 rounded-2xl px-6 text-sm"
              >
                Save settings
              </AdminPrimaryButton>
            </div>
          </form>
        </Container>
      </main>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-black text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsField({
  label,
  name,
  value,
  placeholder,
  onChange,
  required = false,
  inputMode = "text",
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "url";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--danger)]">*</span>
        )}
      </span>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}

function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
