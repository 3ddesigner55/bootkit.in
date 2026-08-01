"use client";

import {
  Settings,
  // existing icons
} from "lucide-react";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Heart,
  TicketPercent,
  Store,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";
import { useWishlist } from "@/hooks/useWishlist";
import type { CustomerProfile } from "@/types/account";


export default function AccountPage() {

  const {
  unreadCount,
  hydrated: notificationsHydrated,
} = useNotifications();

  const {
    profile,
    hydrated,
    updateProfile,
    clearProfile,
    session,
    logout,
  } = useAccount();

  const {
    totalItems: cartItems,
    hydrated: cartHydrated,
  } = useCart();

  const {
    totalItems: wishlistItems,
    hydrated: wishlistHydrated,
  } = useWishlist();

  const {
    location,
    hydrated: locationHydrated,
    openLocationModal,
  } = useLocation();

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] =
    useState<CustomerProfile>(profile);

  useEffect(() => {
    if (hydrated) {
      setForm(profile);
    }
  }, [profile, hydrated]);

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

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setError("");
    setSaved(false);
  };

  const saveProfile = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    updateProfile({
      fullName,
      phone: form.phone,
      email,
      dateOfBirth: form.dateOfBirth,
    });

    setEditing(false);
    setSaved(true);
    setError("");

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const cancelEditing = () => {
    setForm(profile);
    setEditing(false);
    setError("");
  };

  const resetProfile = () => {
    const confirmed = window.confirm(
      "Remove your saved BootKiT profile from this device?"
    );

    if (!confirmed) return;

    clearProfile();
    setForm({
      fullName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
    });
    setEditing(true);
    setSaved(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-6">
          <div className="h-[560px] animate-pulse rounded-[28px] bg-white" />
        </Container>
      </div>
    );
  }

  const hasProfile =
    Boolean(profile.fullName) &&
    Boolean(profile.phone);

  const firstName =
    profile.fullName.trim().split(" ")[0] ||
    "Customer";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-10">
          <div className="mb-7 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--text-secondary)] shadow-[var(--shadow-xs)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--primary)]">BootKiT account</p>
              <h1 className="mt-1 text-[27px] font-black tracking-[-0.055em] text-[var(--text-primary)] sm:text-[36px]">
                My account
              </h1>

              <p className="text-xs text-[var(--text-muted)]">
                Profile, orders and app preferences
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
                <div className="relative overflow-hidden bg-[var(--primary)] px-5 py-7 text-white">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
                  <div className="flex items-center gap-4">
                    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/15 ring-1 ring-white/30">
                      <UserRound size={30} />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
                        BootKiT customer
                      </p>

                      <h2 className="mt-1 truncate text-xl font-black">
                        {hasProfile
                          ? `Hello, ${firstName}`
                          : "Complete your profile"}
                      </h2>

                      <p className="mt-1 truncate text-xs text-white/70">
                        {profile.phone
                          ? `+91 ${profile.phone}`
                          : "Profile details not saved"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 p-4 transition active:bg-[var(--surface-soft)]"
                  >
                    <Heart
                      size={19}
                      className="text-[var(--danger)]"
                    />

                    <div>
                      <p className="text-base font-black text-[var(--text-primary)]">
                        {wishlistHydrated
                          ? wishlistItems
                          : 0}
                      </p>

                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        Wishlist
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/cart"
                    className="flex items-center gap-3 p-4 transition active:bg-[var(--surface-soft)]"
                  >
                    <ShoppingBag
                      size={19}
                      className="text-[var(--primary)]"
                    />

                    <div>
                      <p className="text-base font-black text-[var(--text-primary)]">
                        {cartHydrated ? cartItems : 0}
                      </p>

                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        Cart items
                      </p>
                    </div>
                  </Link>
                </div>
              </section>

              <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                <AccountLink
                  href="/orders"
                  icon={Package}
                  title="My orders"
                  description="Track and review orders"
                />

                <AccountLink
  href="/notifications"
  icon={Bell}
  title="Notifications"
  description={
    notificationsHydrated && unreadCount > 0
      ? `${unreadCount} unread updates`
      : "Orders, payments and offers"
  }
  border
/>
                <AccountLink
                
  href="/account/addresses"
  icon={MapPin}
  title="Saved addresses"
  description="Manage delivery addresses"
  border
/>
<AccountLink
  href="/account/settings"
  icon={Settings}
  title="App settings"
  description="Language and notification preferences"
  border
/>

<AccountLink
  href="/offers"
  icon={TicketPercent}
  title="Offers & coupons"
  description="View active discounts and coupon codes"
  border
/>
{(session?.role === "ADMIN" || session?.role === "OWNER") && <AccountLink
  href="/admin"
  icon={Store}
  title="Admin dashboard"
  description="Manage orders and store data"
  border
/>}
{session?.role === "OWNER" && <AccountLink
  href="/owner"
  icon={Store}
  title="Owner control centre"
  description="Manage customer and admin access"
  border
/>}
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="flex w-full items-center gap-3 border-t border-[var(--border)] p-4 text-left transition active:bg-[var(--surface-soft)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                    <MapPin size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-[var(--text-primary)]">
                      Delivery location
                    </span>

                    <span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">
                      {locationHydrated && location
                        ? `${location.area}, ${location.pincode}`
                        : "Select your delivery area"}
                    </span>
                  </span>

                  <ChevronRight
                    size={17}
                    className="text-[var(--text-muted)]"
                  />
                </button>

                <AccountLink
                  href="/wishlist"
                  icon={Heart}
                  title="Saved products"
                  description="View your wishlist"
                  border
                />

                <AccountLink
                  href="/help"
                  icon={ShieldCheck}
                  title="Help and support"
                  description="Orders, payments and delivery"
                  border
                />
              </section>
            </aside>

            <section className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                    Personal details
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    These details stay saved only on this device.
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setSaved(false);
                    }}
                    className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-black text-[var(--primary)]"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                )}
              </div>

              {saved && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
                  Profile saved successfully.
                </div>
              )}

              <form
                onSubmit={saveProfile}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="Full name"
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    placeholder="Enter full name"
                    icon={UserRound}
                    disabled={!editing}
                    required
                  />

                  <ProfileField
                    label="Mobile number"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="10-digit mobile number"
                    icon={Phone}
                    disabled={!editing}
                    inputMode="numeric"
                    required
                  />

                  <ProfileField
                    label="Email address"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="Enter email address"
                    icon={Mail}
                    disabled={!editing}
                    inputMode="email"
                  />

                  <ProfileField
                    label="Date of birth"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={updateField}
                    placeholder=""
                    icon={UserRound}
                    disabled={!editing}
                    type="date"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]"
                  >
                    {error}
                  </div>
                )}

                {editing && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-white"
                    >
                      <Save size={17} />
                      Save profile
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-5 text-sm font-black text-[var(--text-secondary)]"
                    >
                      <X size={17} />
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              {session ? (
                <button
                  type="button"
                  onClick={logout}
                  className="mt-8 flex items-center gap-2 text-xs font-black text-[var(--danger)]"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mt-8 inline-flex items-center gap-2 text-xs font-black text-[var(--primary)]"
                >
                  <UserRound size={15} />
                  Login / Register
                </Link>
              )}

              {hasProfile && !editing && (
                <button
                  type="button"
                  onClick={resetProfile}
                  className="mt-4 flex items-center gap-2 text-xs font-black text-[var(--danger)]"
                >
                  <LogOut size={15} />
                  Remove saved profile
                </button>
              )}

              <div className="mt-8 rounded-2xl bg-[var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-[var(--primary)]"
                  />

                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      Local profile protection
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                      During local development, your profile is stored
                      inside this browser only. Real secure login and
                      server storage will be added before public launch.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}

type AccountLinkProps = {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
  border?: boolean;
};

function AccountLink({
  href,
  icon: Icon,
  title,
  description,
  border = false,
}: AccountLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 transition active:bg-[var(--surface-soft)] ${
        border
          ? "border-t border-[var(--border)]"
          : ""
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[var(--text-primary)]">
          {title}
        </span>

        <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
          {description}
        </span>
      </span>

      <ChevronRight
        size={17}
        className="text-[var(--text-muted)]"
      />
    </Link>
  );
}

type ProfileFieldProps = {
  label: string;
  name: keyof CustomerProfile;
  value: string;
  placeholder: string;
  icon: typeof UserRound;
  disabled: boolean;
  required?: boolean;
  type?: "text" | "date";
  inputMode?:
    | "text"
    | "numeric"
    | "email"
    | "tel";
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function ProfileField({
  label,
  name,
  value,
  placeholder,
  icon: Icon,
  disabled,
  required = false,
  type = "text",
  inputMode = "text",
  onChange,
}: ProfileFieldProps) {
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

      <span
        className={`flex h-12 items-center gap-3 rounded-xl border px-3 transition ${
          disabled
            ? "border-[var(--border)] bg-[var(--surface-soft)]"
            : "border-[var(--border)] bg-white focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-green-900/10"
        }`}
      >
        <Icon
          size={17}
          className="shrink-0 text-[var(--primary)]"
        />

        <input
          type={type}
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={onChange}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-default"
        />
      </span>
    </label>
  );
}   
