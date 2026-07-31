"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Home,
  MapPin,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Header from "@/components/layout/Header";
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
  city: "",
  state: "",
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

  const [form, setForm] =
    useState<AddressInput>(emptyAddress);

  const [editingId, setEditingId] =
    useState<string | null>(null);

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
    fullName:
      current.fullName ||
      profile.fullName,
    phone:
      current.phone ||
      profile.phone,
  }));
}, [
  profileHydrated,
  profile.fullName,
  profile.phone,
  editingId,
]);

  const updateField = (
    
    
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "phone") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    if (name === "pincode") {
  nextValue = value
    .replace(/\D/g, "")
    .slice(0, 6);

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
  fullName:
    profile.fullName || "",
  phone:
    profile.phone || "",
  city: "Sardarshahar",
  state: "Rajasthan",
  pincode: "",
  area: "",
  isDefault:
    addresses.length === 0,
});

    setError("");
    setSavedMessage("");
    setFormOpen(true);
  };

  const editAddress = (address: SavedAddress) => {
    setEditingId(address.id);

    setForm({
  fullName: address.fullName,
  phone: address.phone,
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
    if (form.fullName.trim().length < 2) {
      return "Please enter the customer name.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (!form.houseNumber.trim()) {
      return "Please enter house, flat or shop number.";
    }

    if (!form.street.trim()) {
      return "Please enter street, colony or village.";
    }

    if (!form.city.trim()) {
      return "Please enter city.";
    }

    if (!form.state.trim()) {
      return "Please enter state.";
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

    return "";
  };

  const saveAddress = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validateAddress();
     if (validationError) {
    setError(validationError);
    return;
  }

    const cleanAddress: AddressInput = {
      ...form,
      fullName: form.fullName.trim(),
      houseNumber: form.houseNumber.trim(),
      street: form.street.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
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

  const confirmRemoveAddress = (
    address: SavedAddress
  ) => {
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
        <Header />

        <Container className="py-6">
          <div className="h-[520px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/account"
                aria-label="Back to account"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                  Saved addresses
                </h1>

                <p className="text-xs text-[var(--text-muted)]">
                  Manage your delivery locations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openNewAddressForm}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-xs font-black text-white"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {savedMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {savedMessage}
            </div>
          )}

          {formOpen && (
            <section className="mb-5 rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                    {editingId
                      ? "Edit address"
                      : "Add new address"}
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Delivery is available only in selected pincodes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <X size={17} />
                </button>
              </div>

              <form
                onSubmit={saveAddress}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <AddressField
                    label="Customer name"
                    name="fullName"
                    value={form.fullName}
                    placeholder="Enter full name"
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Mobile number"
                    name="phone"
                    value={form.phone}
                    placeholder="10-digit mobile number"
                    onChange={updateField}
                    inputMode="numeric"
                    required
                  />

                  <AddressField
                    label="House / Flat / Shop"
                    name="houseNumber"
                    value={form.houseNumber}
                    placeholder="House no. or flat no."
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Street / Colony / Village"
                    name="street"
                    value={form.street}
                    placeholder="Street or area name"
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Landmark"
                    name="landmark"
                    value={form.landmark}
                    placeholder="Nearby landmark (optional)"
                    onChange={updateField}
                  />

                  <AddressField
                    label="City"
                    name="city"
                    value={form.city}
                    placeholder="Auto filled"
                    readOnly
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="State"
                    name="state"
                    value={form.state}
                    placeholder="Auto filled"
                    readOnly
                    onChange={updateField}
                    required
                  />

                  <AddressField
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    placeholder="6-digit pincode"
                    onChange={updateField}
                    inputMode="numeric"
                    required
                  />

                  <label className="block sm:col-span-2">
  <span className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
    Area / Ward
    <span className="ml-1 text-[var(--danger)]">
      *
    </span>
  </span>

  <select
    value={
      availableAreas.find(
        (area) => area.area === form.area
      )?.id ?? ""
    }
    onChange={(event) =>
      selectDeliveryArea(event.target.value)
    }
    disabled={
      form.pincode.length !== 6 ||
      availableAreas.length === 0
    }
    required
    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10 disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-muted)]"
  >
    <option value="">
      {form.pincode.length !== 6
        ? "Enter pincode first"
        : availableAreas.length === 0
          ? "No serviceable area found"
          : "Select area or ward"}
    </option>

    {availableAreas.map((area) => (
      <option
        key={area.id}
        value={area.id}
      >
        {area.area} · {area.deliveryMinutes}
      </option>
    ))}
  </select>

  {form.pincode.length === 6 &&
    availableAreas.length > 0 && (
      <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
        {availableAreas.length} serviceable areas available
      </p>
    )}
</label>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    Address type
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        "Home",
                        "Office",
                        "Other",
                      ] as SavedAddressType[]
                    ).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            addressType: type,
                          }))
                        }
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black ${
                          form.addressType === type
                            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)]"
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

                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface-soft)] p-3">
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

                <button
                  type="submit"
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white"
                >
                  <Save size={17} />
                  {editingId
                    ? "Update address"
                    : "Save address"}
                </button>
              </form>
            </section>
          )}

          {addresses.length === 0 ? (
            <section className="flex min-h-[430px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
                <MapPin size={35} />
              </span>

              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                No saved address
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Add a delivery address to make checkout faster.
              </p>

              <button
                type="button"
                onClick={openNewAddressForm}
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 text-sm font-black text-white"
              >
                <Plus size={18} />
                Add delivery address
              </button>
            </section>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => editAddress(address)}
                  onRemove={() =>
                    confirmRemoveAddress(address)
                  }
                  onSetDefault={() =>
                    setDefaultAddress(address.id)
                  }
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
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
};

function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetDefault,
}: AddressCardProps) {
  return (
    <article
      className={`relative rounded-[24px] border bg-white p-5 shadow-[var(--shadow-sm)] ${
        address.isDefault
          ? "border-[var(--primary)]"
          : "border-[var(--border)]"
      }`}
    >
      {address.isDefault && (
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--primary)]">
          <Star size={11} fill="currentColor" />
          Default
        </span>
      )}

      <div className="flex items-center gap-3 pr-20">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
          {address.addressType === "Home" ? (
            <Home size={20} />
          ) : address.addressType === "Office" ? (
            <Building2 size={20} />
          ) : (
            <MapPin size={20} />
          )}
        </span>

        <div>
          <p className="text-sm font-black text-[var(--text-primary)]">
            {address.addressType}
          </p>

          <p className="mt-0.5 text-[10px] font-bold text-[var(--primary)]">
            {address.pincode}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
          <UserRound size={15} />
          {address.fullName}
        </p>

        <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
          {address.houseNumber}, {address.street}, {address.area}
          {address.landmark
            ? `, ${address.landmark}`
            : ""}
          <br />
          {address.city}, {address.state} -{" "}
          {address.pincode}
        </p>

        <p className="mt-3 text-xs font-bold text-[var(--text-primary)]">
          +91 {address.phone}
        </p>
      </div>

      {!address.isDefault && (
        <button
          type="button"
          onClick={onSetDefault}
          className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-[var(--primary)]"
        >
          <Star size={13} />
          Set as default
        </button>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-xs font-black text-[var(--text-secondary)]"
        >
          <Pencil size={14} />
          Edit
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-xs font-black text-[var(--danger)]"
        >
          <Trash2 size={14} />
          Remove
        </button>
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
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
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
        {required && (
          <span className="ml-1 text-[var(--danger)]">
            *
          </span>
        )}
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
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}