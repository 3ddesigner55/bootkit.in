"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  IndianRupee,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAdminDeliveryAreas } from "@/hooks/useAdminDeliveryAreas";
import { formatPrice } from "@/lib/utils";
import type { DeliveryArea } from "@/types/location";

type AreaFilter =
  | "All"
  | "Active"
  | "Inactive";

type DeliveryAreaForm = {
  city: string;
  area: string;
  pincode: string;
  deliveryMinutes: string;
  deliveryFee: string;
  minimumOrder: string;
  active: boolean;
};

const emptyForm: DeliveryAreaForm = {
  city: "Sardarshahar",
  area: "",
  pincode: "331403",
  deliveryMinutes: "15–25 min",
  deliveryFee: "29",
  minimumOrder: "99",
  active: true,
};

function areaToForm(
  deliveryArea: DeliveryArea
): DeliveryAreaForm {
  return {
    city: deliveryArea.city,
    area: deliveryArea.area,
    pincode: deliveryArea.pincode,
    deliveryMinutes:
      deliveryArea.deliveryMinutes,
    deliveryFee: String(
      deliveryArea.deliveryFee
    ),
    minimumOrder: String(
      deliveryArea.minimumOrder
    ),
    active: deliveryArea.active,
  };
}

export default function AdminDeliveryAreasClient() {
  const {
    deliveryAreas,
    serviceablePincodes,
    hydrated,
    addDeliveryArea,
    updateDeliveryArea,
    removeDeliveryArea,
    toggleDeliveryAreaActive,
    resetDeliveryAreas,
  } = useAdminDeliveryAreas();

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<AreaFilter>("All");

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingArea, setEditingArea] =
    useState<DeliveryArea | null>(null);

  const [form, setForm] =
    useState<DeliveryAreaForm>(emptyForm);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredAreas = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return [...deliveryAreas]
      .filter((deliveryArea) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            deliveryArea.city,
            deliveryArea.area,
            deliveryArea.pincode,
            deliveryArea.deliveryMinutes,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(normalizedQuery)
          );

        const matchesFilter =
          filter === "All" ||
          (filter === "Active" &&
            deliveryArea.active) ||
          (filter === "Inactive" &&
            !deliveryArea.active);

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        const pincodeCompare =
          a.pincode.localeCompare(b.pincode);

        if (pincodeCompare !== 0) {
          return pincodeCompare;
        }

        return a.area.localeCompare(
          b.area,
          "en",
          {
            numeric: true,
          }
        );
      });
  }, [deliveryAreas, query, filter]);

  const stats = useMemo(() => {
    const activeAreas = deliveryAreas.filter(
      (deliveryArea) =>
        deliveryArea.active
    );

    const averageDeliveryFee =
      activeAreas.length > 0
        ? Math.round(
            activeAreas.reduce(
              (total, deliveryArea) =>
                total +
                deliveryArea.deliveryFee,
              0
            ) / activeAreas.length
          )
        : 0;

    return {
      total: deliveryAreas.length,
      active: activeAreas.length,
      inactive: deliveryAreas.filter(
        (deliveryArea) =>
          !deliveryArea.active
      ).length,
      averageDeliveryFee,
    };
  }, [deliveryAreas]);

  const openAddForm = () => {
    setEditingArea(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openEditForm = (
    deliveryArea: DeliveryArea
  ) => {
    setEditingArea(deliveryArea);
    setForm(areaToForm(deliveryArea));
    setError("");
    setMessage("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingArea(null);
    setForm(emptyForm);
    setError("");
  };

  const updateField = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "pincode") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 6);
    }

    if (
      name === "deliveryFee" ||
      name === "minimumOrder"
    ) {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setError("");
    setMessage("");
  };

  const validateForm = () => {
    if (form.city.trim().length < 2) {
      return "Please enter a valid city name.";
    }

    if (form.area.trim().length < 2) {
      return "Please enter a valid area or ward name.";
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    if (
      form.deliveryMinutes.trim().length <
      3
    ) {
      return "Please enter delivery time, for example 15–25 min.";
    }

    const deliveryFee = Number(
      form.deliveryFee
    );

    const minimumOrder = Number(
      form.minimumOrder
    );

    if (
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0
    ) {
      return "Delivery fee cannot be negative.";
    }

    if (
      !Number.isFinite(minimumOrder) ||
      minimumOrder < 0
    ) {
      return "Minimum order cannot be negative.";
    }

    const duplicateArea =
      deliveryAreas.some(
        (deliveryArea) =>
          deliveryArea.area
            .trim()
            .toLowerCase() ===
            form.area
              .trim()
              .toLowerCase() &&
          deliveryArea.pincode ===
            form.pincode &&
          deliveryArea.id !==
            editingArea?.id
      );

    if (duplicateArea) {
      return "This area already exists for this pincode.";
    }

    return "";
  };

  const saveDeliveryArea = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const areaData = {
      city: form.city.trim(),
      area: form.area.trim(),
      pincode: form.pincode,
      deliveryMinutes:
        form.deliveryMinutes.trim(),
      deliveryFee: Number(
        form.deliveryFee
      ),
      minimumOrder: Number(
        form.minimumOrder
      ),
      active: form.active,
    };

    if (editingArea) {
      updateDeliveryArea(
        editingArea.id,
        areaData
      );

      setMessage(
        `${areaData.area} updated successfully.`
      );
    } else {
      addDeliveryArea(areaData);

      setMessage(
        `${areaData.area} added successfully.`
      );
    }

    setFormOpen(false);
    setEditingArea(null);
    setForm(emptyForm);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const confirmDeleteArea = (
    deliveryArea: DeliveryArea
  ) => {
    const confirmed = window.confirm(
      `Delete "${deliveryArea.area}" from serviceable delivery areas?`
    );

    if (!confirmed) return;

    removeDeliveryArea(deliveryArea.id);

    if (
      editingArea?.id === deliveryArea.id
    ) {
      closeForm();
    }

    setMessage(
      `${deliveryArea.area} deleted successfully.`
    );

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const confirmReset = () => {
    const confirmed = window.confirm(
      "Reset all delivery area changes and restore default Sardarshahar wards?"
    );

    if (!confirmed) return;

    resetDeliveryAreas();
    closeForm();

    setMessage(
      "Default delivery areas restored."
    );

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-6">
          <div className="h-[620px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin"
                aria-label="Back to admin"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                  Local admin
                </p>

                <h1 className="text-[24px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                  Delivery areas
                </h1>

                <p className="text-xs text-[var(--text-muted)]">
                  Manage pincodes, wards and delivery charges
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddForm}
                className="flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-[11px] font-black text-white"
              >
                <Plus size={15} />
                Add
              </button>

              <button
                type="button"
                onClick={confirmReset}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-[11px] font-black text-[var(--danger)]"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {formOpen && (
            <section className="mb-5 rounded-[26px] border border-[var(--primary)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)]">
                    {editingArea
                      ? "Editing delivery area"
                      : "New delivery area"}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">
                    {editingArea
                      ? editingArea.area
                      : "Add delivery area"}
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Changes stay saved on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close form"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"
                >
                  <X size={17} />
                </button>
              </div>

              <form
                onSubmit={saveDeliveryArea}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AreaField
                    label="City"
                    name="city"
                    value={form.city}
                    placeholder="Sardarshahar"
                    onChange={updateField}
                    required
                  />

                  <AreaField
                    label="Area / Ward"
                    name="area"
                    value={form.area}
                    placeholder="Ward No. 56"
                    onChange={updateField}
                    required
                  />

                  <AreaField
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    placeholder="331403"
                    inputMode="numeric"
                    onChange={updateField}
                    required
                  />

                  <AreaField
                    label="Delivery time"
                    name="deliveryMinutes"
                    value={
                      form.deliveryMinutes
                    }
                    placeholder="15–25 min"
                    onChange={updateField}
                    required
                  />

                  <AreaField
                    label="Delivery fee"
                    name="deliveryFee"
                    value={form.deliveryFee}
                    placeholder="29"
                    inputMode="decimal"
                    onChange={updateField}
                    required
                  />

                  <AreaField
                    label="Minimum order"
                    name="minimumOrder"
                    value={form.minimumOrder}
                    placeholder="99"
                    inputMode="decimal"
                    onChange={updateField}
                    required
                  />
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-[var(--text-primary)]">
                      Active delivery area
                    </span>

                    <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
                      Customers can select this area
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active:
                          event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                </label>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white"
                  >
                    <Save size={17} />

                    {editingArea
                      ? "Update area"
                      : "Save area"}
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] text-sm font-black text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={MapPin}
              label="Total areas"
              value={stats.total.toString()}
            />

            <StatCard
              icon={Eye}
              label="Active"
              value={stats.active.toString()}
            />

            <StatCard
              icon={EyeOff}
              label="Inactive"
              value={stats.inactive.toString()}
            />

            <StatCard
              icon={IndianRupee}
              label="Average delivery fee"
              value={formatPrice(
                stats.averageDeliveryFee
              )}
            />
          </section>

          <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3">
                <Search
                  size={17}
                  className="text-[var(--text-muted)]"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search area, ward or pincode"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                />
              </label>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as AreaFilter
                  )
                }
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold outline-none"
              >
                <option value="All">
                  All delivery areas
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {serviceablePincodes.map(
                (pincode) => (
                  <button
                    key={pincode}
                    type="button"
                    onClick={() =>
                      setQuery(pincode)
                    }
                    className="rounded-full bg-[var(--primary-light)] px-3 py-1.5 text-[10px] font-black text-[var(--primary)]"
                  >
                    {pincode}
                  </button>
                )
              )}
            </div>
          </section>

          {filteredAreas.length === 0 ? (
            <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center">
              <MapPin
                size={38}
                className="text-[var(--text-muted)]"
              />

              <h2 className="mt-4 text-xl font-black text-[var(--text-primary)]">
                No matching delivery areas
              </h2>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Add a new area or change the current filter.
              </p>
            </section>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAreas.map(
                (deliveryArea) => (
                  <DeliveryAreaCard
                    key={deliveryArea.id}
                    deliveryArea={
                      deliveryArea
                    }
                    onEdit={() =>
                      openEditForm(
                        deliveryArea
                      )
                    }
                    onToggleActive={() =>
                      toggleDeliveryAreaActive(
                        deliveryArea.id
                      )
                    }
                    onDelete={() =>
                      confirmDeleteArea(
                        deliveryArea
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function DeliveryAreaCard({
  deliveryArea,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  deliveryArea: DeliveryArea;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[24px] border bg-white shadow-[var(--shadow-sm)] ${
        deliveryArea.active
          ? "border-[var(--border)]"
          : "border-red-200 opacity-80"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)]">
          <MapPin size={24} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[var(--text-primary)]">
                {deliveryArea.area}
              </h2>

              <p className="mt-1 text-[10px] font-bold text-[var(--primary)]">
                {deliveryArea.city} ·{" "}
                {deliveryArea.pincode}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                deliveryArea.active
                  ? "bg-green-50 text-[var(--success)]"
                  : "bg-red-50 text-[var(--danger)]"
              }`}
            >
              {deliveryArea.active
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-y border-[var(--border)] bg-[var(--surface-soft)]">
        <AreaMetric
          icon={Clock3}
          label="Delivery"
          value={
            deliveryArea.deliveryMinutes
          }
        />

        <AreaMetric
          icon={IndianRupee}
          label="Fee"
          value={formatPrice(
            deliveryArea.deliveryFee
          )}
        />

        <AreaMetric
          icon={IndianRupee}
          label="Min. order"
          value={formatPrice(
            deliveryArea.minimumOrder
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 p-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)] text-[10px] font-black text-[var(--primary)]"
        >
          <Pencil size={14} />
          Edit
        </button>

        <button
          type="button"
          onClick={onToggleActive}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[10px] font-black ${
            deliveryArea.active
              ? "bg-amber-50 text-amber-700"
              : "bg-green-50 text-[var(--success)]"
          }`}
        >
          {deliveryArea.active ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}

          {deliveryArea.active
            ? "Disable"
            : "Enable"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[10px] font-black text-[var(--danger)]"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={19} />
      </span>

      <p className="mt-4 text-xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </article>
  );
}

function AreaMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 text-center">
      <Icon
        size={14}
        className="mx-auto text-[var(--primary)]"
      />

      <p className="mt-2 text-[10px] font-black text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}

type AreaFieldProps = {
  label: string;
  name: keyof DeliveryAreaForm;
  value: string;
  placeholder: string;
  required?: boolean;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function AreaField({
  label,
  name,
  value,
  placeholder,
  required = false,
  inputMode = "text",
  onChange,
}: AreaFieldProps) {
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
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-green-900/10"
      />
    </label>
  );
}