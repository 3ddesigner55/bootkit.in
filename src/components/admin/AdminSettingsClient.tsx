"use client";

import {
  CheckCircle2,
  MapPin,
  RefreshCw,
  Save,
  Settings2,
  Plus,
  Trash2,
  Layers,
  Shield,
  Percent,
  Coins,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import {
  ImageUploader,
  type ImageUploaderItem,
} from "@/components/admin/media";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAccount } from "@/hooks/useAccount";
import {
  getAdminBestSellersConfig,
  updateAdminBestSellersConfig,
  type AdminBestSellersConfig,
  type AdminBestSellersConfigItem,
} from "@/services/adminHomeConfig.service";
import {
  getBusinessSettings,
  updateBusinessSettings,
  getTaxProfiles,
  createTaxProfile,
  updateTaxProfile,
  getStaffMembers,
  inviteStaffMember,
  updateStaffRole,
  blockStaffMember,
  unblockStaffMember,
  type BusinessSettings as IBusinessSettings,
  type TaxProfile as ITaxProfile,
  type StaffMember as IStaffMember,
} from "@/services/adminSettings.service";
import type { Category } from "@/types/category";

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
  const { categories } = useAdminCategories();
  const { session } = useAccount();

  const [activeTab, setActiveTab] = useState<"store" | "home" | "business" | "taxes" | "staff">("store");
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Home sections best sellers config states
  const [homeConfig, setHomeConfig] = useState<AdminBestSellersConfig | null>(null);
  const [homeConfigLoading, setHomeConfigLoading] = useState(false);
  const [homeConfigMessage, setHomeConfigMessage] = useState("");

  // Business settings state
  const [businessSettings, setBusinessSettings] = useState<IBusinessSettings>({
    minimumOrderValue: 0,
    baseDeliveryFee: 0,
    freeDeliveryThreshold: 0,
  });

  // Tax profiles state
  const [taxProfiles, setTaxProfiles] = useState<ITaxProfile[]>([]);
  const [newTaxProfile, setNewTaxProfile] = useState<Omit<ITaxProfile, "_id">>({
    name: "",
    taxRate: 18,
    priceMode: "TAX_INCLUSIVE",
    intraStateSplitRatio: 0.5,
    active: true,
  });

  // Staff state
  const [staffMembers, setStaffMembers] = useState<IStaffMember[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState<"ADMIN" | "MANAGER" | "STAFF">("STAFF");

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    if (activeTab === "home" && !homeConfig) {
      setHomeConfigLoading(true);
      getAdminBestSellersConfig(token)
        .then((cfg) => {
          setHomeConfig(cfg);
        })
        .catch(() => {
          setHomeConfig({
            key: "bestSellers",
            title: "Best Sellers",
            active: true,
            displayType: "categoryCards",
            items: [],
          });
        })
        .finally(() => {
          setHomeConfigLoading(false);
        });
    }

    if (activeTab === "business") {
      setIsLoading(true);
      getBusinessSettings(token)
        .then((data) => {
          setBusinessSettings(data);
        })
        .catch((err) => {
          setErrorMessage(err.message || "Failed to load business settings.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    if (activeTab === "taxes") {
      setIsLoading(true);
      getTaxProfiles(token)
        .then((data) => {
          setTaxProfiles(data);
        })
        .catch((err) => {
          setErrorMessage(err.message || "Failed to load tax profiles.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    if (activeTab === "staff") {
      setIsLoading(true);
      getStaffMembers(token)
        .then((data) => {
          setStaffMembers(data);
        })
        .catch((err) => {
          setErrorMessage(err.message || "Failed to load staff list.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeTab, session?.accessToken, homeConfig]);

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
      nextValue = value.replace(/[^\d.]/g, "");
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

  // Best Sellers Config Handlers
  const handleAddCategory = () => {
    if (!homeConfig) return;
    const activeCats = categories.filter((c) => c.active);
    const newItem: AdminBestSellersConfigItem = {
      category: activeCats[0]?.id || "",
      productMode: "auto",
      active: true,
      sortOrder: homeConfig.items.length + 1,
    };
    setHomeConfig({
      ...homeConfig,
      items: [...homeConfig.items, newItem],
    });
    setHomeConfigMessage("");
  };

  const handleRemoveCategory = (index: number) => {
    if (!homeConfig) return;
    const newItems = homeConfig.items.filter((_, idx) => idx !== index);
    setHomeConfig({
      ...homeConfig,
      items: newItems,
    });
    setHomeConfigMessage("");
  };

  const handleUpdateItem = (
    index: number,
    field: keyof AdminBestSellersConfigItem,
    value: any
  ) => {
    if (!homeConfig) return;
    const newItems = homeConfig.items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setHomeConfig({
      ...homeConfig,
      items: newItems,
    });
    setHomeConfigMessage("");
  };

  const saveHomeConfig = (event: FormEvent) => {
    event.preventDefault();
    const token = session?.accessToken;
    if (!homeConfig || !token) return;

    if (session.role !== "ADMIN" && session.role !== "OWNER") {
      setHomeConfigMessage("Only administrators and owners can update layout configuration.");
      return;
    }

    setHomeConfigLoading(true);
    updateAdminBestSellersConfig(token, homeConfig)
      .then((updated) => {
        setHomeConfig(updated);
        setHomeConfigMessage("Homepage Best Sellers layout saved successfully!");
      })
      .catch((err) => {
        setHomeConfigMessage(err.message || "Failed to save configuration.");
      })
      .finally(() => {
        setHomeConfigLoading(false);
      });
  };

  const saveBusinessSettings = (event: FormEvent) => {
    event.preventDefault();
    const token = session?.accessToken;
    if (!token) return;

    setIsLoading(true);
    updateBusinessSettings(token, businessSettings)
      .then((updated) => {
        setBusinessSettings(updated);
        setMessage("Business configuration thresholds updated successfully!");
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to save business settings.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCreateTaxProfile = (event: FormEvent) => {
    event.preventDefault();
    const token = session?.accessToken;
    if (!token) return;

    setIsLoading(true);
    createTaxProfile(token, newTaxProfile)
      .then((profile) => {
        setTaxProfiles([...taxProfiles, profile]);
        setNewTaxProfile({
          name: "",
          taxRate: 18,
          priceMode: "TAX_INCLUSIVE",
          intraStateSplitRatio: 0.5,
          active: true,
        });
        setMessage("Tax profile created successfully!");
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to create tax profile.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleToggleTaxProfile = (id: string, active: boolean) => {
    const token = session?.accessToken;
    if (!token) return;

    updateTaxProfile(token, id, { active })
      .then((updated) => {
        setTaxProfiles(taxProfiles.map(p => p._id === id ? updated : p));
        setMessage("Tax profile status updated!");
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to update profile.");
      });
  };

  const handleInviteStaff = (event: FormEvent) => {
    event.preventDefault();
    const token = session?.accessToken;
    if (!token) return;

    setIsLoading(true);
    inviteStaffMember(token, { email: newInviteEmail, role: newInviteRole })
      .then(() => {
        setNewInviteEmail("");
        setMessage("Invitation link created successfully! Check terminal for verification codes.");
        return getStaffMembers(token);
      })
      .then((data) => {
        setStaffMembers(data);
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to send staff invitation.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleToggleBlockStaff = (staff: IStaffMember) => {
    const token = session?.accessToken;
    if (!token) return;

    const action = staff.status === "BLOCKED" ? unblockStaffMember : blockStaffMember;
    action(token, staff._id)
      .then(() => {
        setMessage(`Staff member status toggled!`);
        return getStaffMembers(token);
      })
      .then((data) => {
        setStaffMembers(data);
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to block/unblock staff member.");
      });
  };

  const handleRoleChange = (staffId: string, role: string) => {
    const token = session?.accessToken;
    if (!token) return;

    updateStaffRole(token, staffId, role)
      .then(() => {
        setMessage("Staff role updated successfully!");
        return getStaffMembers(token);
      })
      .then((data) => {
        setStaffMembers(data);
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to change staff role.");
      });
  };

  const getCategoryHierarchyLabel = (cat: Category) => {
    if (cat.parentCategory) {
      const parent = categories.find(
        (c) => c.id === cat.parentCategory || c.slug === cat.parentCategory
      );
      if (parent) {
        return `${parent.name} ➔ ${cat.name}`;
      }
    }
    return cat.name;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="System Settings"
            description="Configure storefront, homepage components, business limits, GST profiles, and Staff permissions"
            action={
              activeTab === "store" ? (
                <button
                  type="button"
                  onClick={resetSettings}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black text-[var(--danger)] cursor-pointer"
                >
                  <RefreshCw size={15} />
                  Reset Defaults
                </button>
              ) : undefined
            }
          />

          {/* Navigation Tabs */}
          <div className="mb-6 flex gap-4 border-b border-[var(--border)] pb-px overflow-x-auto">
            {(["store", "home", "business", "taxes", "staff"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setMessage("");
                  setErrorMessage("");
                }}
                className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "border-[var(--primary)] text-[var(--primary)] font-black"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab === "store" && "Store Branding"}
                {tab === "home" && "Best Sellers Layout"}
                {tab === "business" && "Business Limits"}
                {tab === "taxes" && "Taxes & Profiles"}
                {tab === "staff" && "Staff RBAC"}
              </button>
            ))}
          </div>

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)] animate-fade-in">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)] animate-fade-in">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <AdminLoadingSkeleton variant="page" className="h-[400px]" />
          ) : activeTab === "store" ? (
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
          ) : activeTab === "home" ? (
            homeConfigLoading && !homeConfig ? (
              <AdminLoadingSkeleton variant="page" className="h-[400px]" />
            ) : homeConfig ? (
              <form onSubmit={saveHomeConfig} className="space-y-5">
                <SettingsSection
                  icon={<Layers size={18} />}
                  title="Best Sellers Homepage Configuration"
                  description="Decide which categories and layout options populate the 'Best Sellers' area on the homepage."
                >
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Section Status
                      </span>
                      <select
                        value={homeConfig.active ? "active" : "inactive"}
                        onChange={(e) =>
                          setHomeConfig({
                            ...homeConfig,
                            active: e.target.value === "active",
                          })
                        }
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Section Title
                      </span>
                      <input
                        type="text"
                        value={homeConfig.title}
                        onChange={(e) =>
                          setHomeConfig({
                            ...homeConfig,
                            title: e.target.value,
                          })
                        }
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Display Type
                      </span>
                      <input
                        type="text"
                        value={homeConfig.displayType === "categoryCards" ? "Category Cards" : homeConfig.displayType}
                        disabled
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-gray-50 px-4 text-sm font-semibold outline-none text-[var(--text-muted)] cursor-not-allowed"
                      />
                    </label>
                  </div>

                  <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[#fafbfa]">
                    <div className="bg-white px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <h3 className="text-sm font-black">Categories List</h3>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-black text-white cursor-pointer"
                      >
                        <Plus size={14} />
                        Add Category
                      </button>
                    </div>

                    {homeConfig.items.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[var(--text-muted)] font-medium">
                        No categories added to Best Sellers. Click 'Add Category' to get started.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#f0f3f1] border-b border-[var(--border)] font-bold text-[var(--text-secondary)]">
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3 w-32">Product Mode</th>
                              <th className="px-4 py-3 w-24">Display</th>
                              <th className="px-4 py-3 w-28">Sort Order</th>
                              <th className="px-4 py-3 w-16 text-center">Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {homeConfig.items.map((item, index) => {
                              const activeCats = categories.filter((c) => c.active);
                              return (
                                <tr key={index} className="border-b border-[var(--border)] hover:bg-[#f5f8f5]">
                                  <td className="px-4 py-2">
                                    <select
                                      value={item.category}
                                      onChange={(e) =>
                                        handleUpdateItem(index, "category", e.target.value)
                                      }
                                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 font-semibold outline-none focus:border-[var(--primary)]"
                                    >
                                      {activeCats.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {getCategoryHierarchyLabel(cat)}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={item.productMode}
                                      onChange={(e) =>
                                        handleUpdateItem(
                                          index,
                                          "productMode",
                                          e.target.value as any
                                        )
                                      }
                                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 font-semibold outline-none focus:border-[var(--primary)]"
                                    >
                                      <option value="auto">Auto</option>
                                      <option value="manual">Manual</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.active}
                                        onChange={(e) =>
                                          handleUpdateItem(index, "active", e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                      />
                                      <span className="font-medium">Active</span>
                                    </label>
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="number"
                                      value={item.sortOrder}
                                      onChange={(e) =>
                                        handleUpdateItem(
                                          index,
                                          "sortOrder",
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 font-semibold outline-none focus:border-[var(--primary)]"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCategory(index)}
                                      className="text-[var(--danger)] hover:text-red-700 cursor-pointer"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </SettingsSection>

                <div className="flex justify-end">
                  <AdminPrimaryButton
                    type="submit"
                    disabled={homeConfigLoading}
                    icon={<Save size={17} />}
                    className="h-12 rounded-2xl px-6 text-sm"
                  >
                    {homeConfigLoading ? "Saving layout..." : "Save layout configuration"}
                  </AdminPrimaryButton>
                </div>
              </form>
            ) : null
          ) : activeTab === "business" ? (
            <form onSubmit={saveBusinessSettings} className="space-y-5">
              <SettingsSection
                icon={<Coins size={18} />}
                title="Business Thresholds"
                description="Manage Minimum Order Value (MOV) and Delivery Fee thresholds."
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Minimum Order Value (MOV)
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">₹</span>
                      <input
                        type="number"
                        value={businessSettings.minimumOrderValue / 100}
                        onChange={(e) =>
                          setBusinessSettings({
                            ...businessSettings,
                            minimumOrderValue: Math.round(parseFloat(e.target.value) * 100) || 0,
                          })
                        }
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-8 pr-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Base Delivery Fee
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">₹</span>
                      <input
                        type="number"
                        value={businessSettings.baseDeliveryFee / 100}
                        onChange={(e) =>
                          setBusinessSettings({
                            ...businessSettings,
                            baseDeliveryFee: Math.round(parseFloat(e.target.value) * 100) || 0,
                          })
                        }
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-8 pr-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Free Delivery Threshold
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">₹</span>
                      <input
                        type="number"
                        value={businessSettings.freeDeliveryThreshold / 100}
                        onChange={(e) =>
                          setBusinessSettings({
                            ...businessSettings,
                            freeDeliveryThreshold: Math.round(parseFloat(e.target.value) * 100) || 0,
                          })
                        }
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-8 pr-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </label>
                </div>
              </SettingsSection>

              <div className="flex justify-end">
                <AdminPrimaryButton
                  type="submit"
                  icon={<Save size={17} />}
                  className="h-12 rounded-2xl px-6 text-sm"
                >
                  Save Business Config
                </AdminPrimaryButton>
              </div>
            </form>
          ) : activeTab === "taxes" ? (
            <div className="space-y-6">
              <form onSubmit={handleCreateTaxProfile} className="space-y-5">
                <SettingsSection
                  icon={<Percent size={18} />}
                  title="Create Tax (GST) Profile"
                  description="Add standard or product-specific GST tax split configurations."
                >
                  <div className="grid gap-4 sm:grid-cols-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Profile Name
                      </span>
                      <input
                        type="text"
                        value={newTaxProfile.name}
                        placeholder="GST 18%"
                        onChange={(e) => setNewTaxProfile({ ...newTaxProfile, name: e.target.value })}
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        GST Tax Rate (%)
                      </span>
                      <input
                        type="number"
                        value={newTaxProfile.taxRate}
                        onChange={(e) => setNewTaxProfile({ ...newTaxProfile, taxRate: parseFloat(e.target.value) || 0 })}
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Intrastate Split (CGST/SGST)
                      </span>
                      <select
                        value={newTaxProfile.intraStateSplitRatio}
                        onChange={(e) => setNewTaxProfile({ ...newTaxProfile, intraStateSplitRatio: parseFloat(e.target.value) })}
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="0.5">50/50 Split (CGST 9%, SGST 9%)</option>
                        <option value="0.6">60/40 Split</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Price Mode
                      </span>
                      <select
                        value={newTaxProfile.priceMode}
                        onChange={(e) => setNewTaxProfile({ ...newTaxProfile, priceMode: e.target.value as any })}
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="TAX_INCLUSIVE">GST Inclusive</option>
                        <option value="TAX_EXCLUSIVE">GST Exclusive</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <AdminPrimaryButton
                      type="submit"
                      icon={<Plus size={16} />}
                      className="h-11 rounded-xl px-5 text-xs"
                    >
                      Create Tax Profile
                    </AdminPrimaryButton>
                  </div>
                </SettingsSection>
              </form>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-sm font-black mb-4">Active GST Configurations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f0f3f1] border-b border-[var(--border)] font-bold text-[var(--text-secondary)]">
                        <th className="px-4 py-3">Profile Name</th>
                        <th className="px-4 py-3">Tax Rate</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Intrastate Split</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxProfiles.map((p) => (
                        <tr key={p._id} className="border-b border-[var(--border)]">
                          <td className="px-4 py-3 font-bold">{p.name}</td>
                          <td className="px-4 py-3">{p.taxRate}%</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{p.priceMode}</td>
                          <td className="px-4 py-3">{(p.intraStateSplitRatio * 100)}% / {((1 - p.intraStateSplitRatio) * 100)}%</td>
                          <td className="px-4 py-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={p.active}
                                onChange={(e) => handleToggleTaxProfile(p._id, e.target.checked)}
                                className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
                              />
                              <span className="font-semibold">{p.active ? "Active" : "Disabled"}</span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleInviteStaff} className="space-y-5">
                <SettingsSection
                  icon={<Shield size={18} />}
                  title="Invite Staff Member"
                  description="Onboard administrators, store managers, or logistics team members with custom permissions."
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Email Address
                      </span>
                      <input
                        type="email"
                        value={newInviteEmail}
                        placeholder="staff@example.com"
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        required
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                        Assigned Role
                      </span>
                      <select
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as any)}
                        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="STAFF">Staff (Logistics & Kanban Funnel)</option>
                        <option value="MANAGER">Manager (Dark Store Inventory & Settings)</option>
                        <option value="ADMIN">Administrator (Full Access Control)</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <AdminPrimaryButton
                      type="submit"
                      icon={<Plus size={16} />}
                      className="h-11 rounded-xl px-5 text-xs"
                    >
                      Invite Staff
                    </AdminPrimaryButton>
                  </div>
                </SettingsSection>
              </form>

              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-sm font-black mb-4">Onboarded Staff Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f0f3f1] border-b border-[var(--border)] font-bold text-[var(--text-secondary)]">
                        <th className="px-4 py-3">Staff Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMembers.map((s) => (
                        <tr key={s._id} className="border-b border-[var(--border)] hover:bg-[#f5f8f5]">
                          <td className="px-4 py-3 font-bold">{s.firstName ? `${s.firstName} ${s.lastName}` : "Pending Invite"}</td>
                          <td className="px-4 py-3">{s.email}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{s.phone || "Not set"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={s.role}
                              disabled={s.role === "OWNER" || session?.role !== "OWNER"}
                              onChange={(e) => handleRoleChange(s._id, e.target.value)}
                              className="h-8 rounded border border-[var(--border)] bg-white px-2 font-semibold outline-none focus:border-[var(--primary)] cursor-pointer"
                            >
                              <option value="STAFF">Staff</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                              <option value="OWNER" disabled>Owner</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              s.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                              s.status === "BLOCKED" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.role !== "OWNER" && (
                              <button
                                type="button"
                                onClick={() => handleToggleBlockStaff(s)}
                                className={`text-xs font-bold underline cursor-pointer ${
                                  s.status === "BLOCKED" ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                {s.status === "BLOCKED" ? "Unblock" : "Block"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
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
    <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5 animate-fade-in">
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
