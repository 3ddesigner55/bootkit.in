"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Home,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Container from "@/components/ui/Container";
import { useAdminDeliveryAreas } from "@/hooks/useAdminDeliveryAreas";
import { useAccount } from "@/hooks/useAccount";
import { useAddresses } from "@/hooks/useAddresses";
import type {
  AddressInput,
  SavedAddress,
  SavedAddressType,
} from "@/types/address";

const emptyAddress: AddressInput = {
  fullName: "",
  phone: "",
  houseNumber: "",
  street: "",
  area: "",
  landmark: "",
  city: "Sardarshahar",
  state: "Rajasthan",
  pincode: "",
  addressType: "Home",
  isDefault: false,
};

export default function SavedAddressesPage() {
  const {
    addresses,
    hydrated,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useAddresses();

  const {
    getDeliveryAreasByPincode,
    isServiceablePincode,
  } = useAdminDeliveryAreas();

  const {
    profile,
    hydrated: profileHydrated,
  } = useAccount();

  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const availableAreas = getDeliveryAreasByPincode(form.pincode);

  const selectDeliveryArea = (areaId: string) => {
    const selectedArea = availableAreas.find(
      (area) => area.id === areaId
    );

    if (!selectedArea) {
      setForm((current) => ({
        ...current,
        area: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      area: selectedArea.area,
      city: selectedArea.city,
      state: "Rajasthan",
      pincode: selectedArea.pincode,
    }));

    setError("");
    setSavedMessage("");
  };

  useEffect(() => {
    if (!profileHydrated) return;
    if (editingId) return;

    setForm((current) => ({
      ...current,
      fullName: current.fullName || profile.fullName || "Self",
      phone: current.phone || profile.phone || "",
    }));
  }, [profileHydrated, profile.fullName, profile.phone, editingId]);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "pincode") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
      setForm((current) => ({
        ...current,
        pincode: nextValue,
        area: "",
      }));
      setError("");
      setSavedMessage("");
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setError("");
    setSavedMessage("");
  };

  const openNewAddressForm = () => {
    setEditingId(null);
    setForm({
      ...emptyAddress,
      fullName: profile.fullName || "Self",
      phone: profile.phone || "",
      city: "Sardarshahar",
      state: "Rajasthan",
      pincode: "",
      area: "",
      isDefault: addresses.length === 0,
    });
    setError("");
    setSavedMessage("");
    setFormOpen(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const editAddress = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName || profile.fullName || "Self",
      phone: address.phone || profile.phone || "",
      houseNumber: address.houseNumber,
      street: address.street,
      area: address.area,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });
    setError("");
    setSavedMessage("");
    setFormOpen(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  };

  const validateAddress = () => {
    if (!form.houseNumber.trim()) {
      return "Please enter house, flat, shop or building number.";
    }

    if (!form.street.trim()) {
      return "Please enter street, colony or village.";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    if (!isServiceablePincode(form.pincode)) {
      return "BootKiT is not delivering to this pincode yet.";
    }

    if (!form.area.trim()) {
      return "Please select your area or ward.";
    }

    if (!form.city.trim()) {
      return "Please enter city.";
    }

    if (!form.state.trim()) {
      return "Please enter state.";
    }

    return "";
  };

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateAddress();
    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanAddress: AddressInput = {
      ...form,
      fullName: form.fullName?.trim() || profile.fullName?.trim() || "Self",
      phone: form.phone?.trim() || profile.phone?.trim() || "",
      houseNumber: form.houseNumber.trim(),
      street: form.street.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim() || "Sardarshahar",
      state: form.state.trim() || "Rajasthan",
      pincode: form.pincode.trim(),
      area: form.area.trim(),
    };

    if (editingId) {
      updateAddress(editingId, cleanAddress);
      setSavedMessage("Address updated successfully.");
    } else {
      addAddress(cleanAddress);
      setSavedMessage("Address saved successfully.");
    }

    setEditingId(null);
    setFormOpen(false);
    setError("");
  };

  const confirmRemoveAddress = (address: SavedAddress) => {
    const confirmed = window.confirm(
      `Remove ${address.addressType} address?`
    );
    if (!confirmed) return;

    removeAddress(address.id);
    setSavedMessage("Address removed.");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-40 border-b border-[#EEF2EF] bg-white/95 px-4 py-3.5 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </header>
        <Container className="max-w-4xl py-6">
          <div className="h-[520px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12">
      {/* Clean Top Header without global <Header /> */}
      <header className="sticky top-0 z-40 border-b border-[#EEF2EF] bg-transparent shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              aria-label="Back to Account"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-soft)] active:scale-95"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-lg font-black tracking-[-0.03em] text-[var(--text-primary)] sm:text-xl">
                Saved Addresses
              </h1>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">
                Manage your delivery locations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewAddressForm}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-2 text-xs font-black text-white shadow-sm transition hover:opacity-95 active:scale-95"
          >
            <Plus size={16} />
            <span>Add </span>
          </button>
        </div>
      </header>

      <main>
        <Container className="max-w-4xl py-4 sm:py-6">
          {savedMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)] shadow-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {formOpen && (
            <section className="mb-6 rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                    {editingId ? "Edit Address Location" : "Add Delivery Address"}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Enter the delivery address details for quick delivery.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)] transition hover:bg-gray-200"
                >
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={saveAddress} className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AddressField
                    label="House / Flat / Shop / Floor No."
                    name="houseNumber"
                    value={form.houseNumber}
                    placeholder="e.g. Flat 204, Floor 2 / Shop No. 12"
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Street / Colony / Village"
                    name="street"
                    value={form.street}
                    placeholder="e.g. Main Market, Station Road"
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    placeholder="6-digit pincode (e.g. 331403)"
                    onChange={updateField}
                    inputMode="numeric"
                    required
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                      Area / Ward
                      <span className="ml-1 text-[var(--danger)]">*</span>
                    </span>

                    <select
                      value={
                        availableAreas.find((area) => area.area === form.area)?.id ?? ""
                      }
                      onChange={(event) => selectDeliveryArea(event.target.value)}
                      disabled={form.pincode.length !== 6 || availableAreas.length === 0}
                      required
                      className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10 disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-muted)]"
                    >
                      <option value="">
                        {form.pincode.length !== 6
                          ? "Enter 6-digit pincode first"
                          : availableAreas.length === 0
                          ? "No serviceable area found"
                          : "Select area / ward"}
                      </option>

                      {availableAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.area} · {area.deliveryMinutes}
                        </option>
                      ))}
                    </select>

                    {form.pincode.length === 6 && availableAreas.length > 0 && (
                      <p className="mt-1 text-[10px] font-semibold text-[var(--primary)]">
                        ✓ {availableAreas.length} serviceable areas available
                      </p>
                    )}
                  </label>

                  <AddressField
                    label="Landmark (Optional)"
                    name="landmark"
                    value={form.landmark}
                    placeholder="Nearby landmark, school, temple"
                    onChange={updateField}
                  />

                  <AddressField
                    label="City"
                    name="city"
                    value={form.city}
                    placeholder="City"
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="State"
                    name="state"
                    value={form.state}
                    placeholder="State"
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    Address Type
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["Home", "Office", "Other"] as SavedAddressType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            addressType: type,
                          }))
                        }
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black transition ${
                          form.addressType === type
                            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                        }`}
                      >
                        {type === "Home" ? (
                          <Home size={15} />
                        ) : type === "Office" ? (
                          <Building2 size={15} />
                        ) : (
                          <MapPin size={15} />
                        )}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface-soft)] p-3.5">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isDefault: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    Use this as my default delivery address
                  </span>
                </label>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-sm font-bold text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white shadow-sm transition hover:opacity-95"
                  >
                    <Save size={17} />
                    {editingId ? "Update Address" : "Save Address"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {addresses.length === 0 ? (
            <section className="flex min-h-[380px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
                <MapPin size={35} />
              </span>

              <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                No saved address
              </h2>

              <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
                Add your delivery address location to make checkout smooth and fast.
              </p>

              <button
                type="button"
                onClick={openNewAddressForm}
                className="mt-6 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 text-xs font-black text-white shadow-sm transition hover:opacity-95"
              >
                <Plus size={16} />
                Add Delivery Address
              </button>
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isMenuOpen={activeMenuId === address.id}
                  onToggleMenu={() =>
                    setActiveMenuId(
                      activeMenuId === address.id ? null : address.id
                    )
                  }
                  onCloseMenu={() => setActiveMenuId(null)}
                  onEdit={() => editAddress(address)}
                  onRemove={() => confirmRemoveAddress(address)}
                  onSetDefault={() => setDefaultAddress(address.id)}
                  onAddNew={openNewAddressForm}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

type AddressCardProps = {
  address: SavedAddress;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
  onAddNew: () => void;
};

function AddressCard({
  address,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onRemove,
  onSetDefault,
  onAddNew,
}: AddressCardProps) {
  return (
    <article
      className={`relative flex flex-col justify-between rounded-[24px] border bg-white p-5 shadow-[var(--shadow-sm)] transition hover:shadow-md ${
        address.isDefault
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
          : "border-[var(--border)]"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--primary-light)] text-[var(--primary)]">
              {address.addressType === "Home" ? (
                <Home size={18} />
              ) : address.addressType === "Office" ? (
                <Building2 size={18} />
              ) : (
                <MapPin size={18} />
              )}
            </span>

            <div>
              <p className="text-sm font-black text-[var(--text-primary)]">
                {address.addressType}
              </p>
              <p className="text-[10px] font-bold text-[var(--primary)]">
                Pincode: {address.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {address.isDefault && (
              <span className="flex items-center gap-1 rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--primary)]">
                <Star size={10} fill="currentColor" />
                Default
              </span>
            )}

            {/* 3-dots Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMenu}
                aria-label="Address actions"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              >
                <MoreVertical size={18} />
              </button>

              {/* 3-dots Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={onCloseMenu}
                  />
                  <div className="absolute right-5 top-2 z-50 w-25 rounded-2xl border border-[var(--border)] bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onEdit();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                    >
                      <Pencil size={10} className="text-[var(--text-muted)]" />
                      Edit 
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          onCloseMenu();
                          onSetDefault();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--primary)] transition hover:bg-green-50"
                      >
                        <Star size={10} />
                        Set as Default
                      </button>
                    )}

        

                    <div className="my-1 border-t border-[var(--border)]" />

                    <button
                      type="button"
                      onClick={() => {
                        onCloseMenu();
                        onRemove();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--danger)] transition hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete 
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold leading-6 text-[var(--text-primary)]">
            {address.houseNumber}, {address.street}
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {address.area}
            {address.landmark ? ` (Near ${address.landmark})` : ""}
          </p>

          <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
            {address.city}, {address.state} - {address.pincode}
          </p>
        </div>
      </div>

    
    </article>
  );
}

type AddressFieldProps = {
  label: string;
  name: keyof AddressInput;
  value: string;
  placeholder: string;
  required?: boolean;
  readOnly?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function AddressField({
  label,
  name,
  value,
  placeholder,
  required = false,
  readOnly = false,
  inputMode = "text",
  onChange,
}: AddressFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
      </span>

      <input
        type="text"
        name={name}
        value={value}
        required={required}
        readOnly={readOnly}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10 read-only:bg-[var(--surface-soft)] read-only:text-[var(--text-muted)]"
      />
    </label>
  );
}