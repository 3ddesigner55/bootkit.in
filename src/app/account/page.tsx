"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Bell,
  CircleHelp,
  ChevronRight,
  Gift,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Palette,
  Save,
  Settings,
  ShieldCheck,
  Store,
  TicketPercent,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { useAccount } from "@/hooks/useAccount";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import type { CustomerProfile } from "@/types/account";

type AppearanceOption = "light" | "dark" | "system";

export default function AccountPage() {
  const router = useRouter();
  const { unreadCount, hydrated: notificationsHydrated } = useNotifications();
  const {
    profile,
    hydrated,
    updateProfile,
    clearProfile,
    session,
    logout,
  } = useAccount();
  const { totalItems: wishlistItems, hydrated: wishlistHydrated } = useWishlist();
  const { theme, setTheme } = useTheme();

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CustomerProfile>(profile);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [showCompactHeader, setShowCompactHeader] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setForm(profile);
    }
  }, [profile, hydrated]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setShowCompactHeader(currentScrollY > 80);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm((current) => ({ ...current, [name]: nextValue }));
    setError("");
    setSaved(false);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    setForm({ fullName: "", phone: "", email: "", dateOfBirth: "" });
    setEditing(true);
    setSaved(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <div className="h-60 animate-pulse rounded-b-[32px] bg-[#54727d]" />
        <div className="mx-4 -mt-5 h-[520px] animate-pulse rounded-[22px] bg-white" />
      </div>
    );
  }

  const hasProfile = Boolean(profile.fullName) && Boolean(profile.phone);
  const firstName = profile.fullName.trim().split(" ")[0] || "Customer";
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] pb-28">
      
      <button
  type="button"
  onClick={handleBack}
  aria-label="Go back"
  className="fixed left-4 top-3 z-[80] flex h-9 w-9 items-center justify-center rounded-full bg-white"
>
  <ArrowLeft size={20} />
</button>

      <header
        className={`fixed inset-x-0 top-0 z-[70] h-14 border-b border-[#EEF2EF] bg-white/90 shadow-[0_2px_10px_rgba(25,50,34,0.07)] backdrop-blur transition duration-[250ms] ${
          showCompactHeader
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex h-full max-w-md items-center gap-2 px-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[#F6F8F6]"
          >
            
          </button>
          <span className="text-base font-black text-[var(--text-primary)]">Profile</span>
        </div>
      </header>

      <main>
        <section className="relative flex h-[240px] flex-col items-center justify-center overflow-hidden rounded-b-[32px] bg-gradient-to-b from-[#64F5E4] via-[#AEEFE6] to-white px-5 text-center">
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full border-0 border-black/80 bg-white text-4xl font-black text-black shadow-[0_8px_22px_rgba(15,77,38,0.12)]">
            <UserRound
  size={42}
  strokeWidth={2.2}
  className="text-black"
/>
          </span>
          <h1 className="relative mt-3 text-2xl font-black tracking-[-0.04em] text-black">
            {hasProfile ? profile.fullName : "BootKiT Customer"}
          </h1>
          <p className="relative mt-1 text-sm font-semibold text-black/70">
            {profile.phone ? `+91 ${profile.phone}` : "Add your mobile number"}
          </p>
        </section>

        <div className="relative z-10 mx-auto -mt-5 max-w-md space-y-6 px-4">
          <section className="grid grid-cols-3 rounded-[22px] bg-white p-2 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
            <QuickAction href="/orders" icon={Package} title="Your Orders" />
            <QuickAction href="/help" icon={CircleHelp} title="Need Help" />
            <QuickAction
              icon={Palette}
              title="App Appearance"
              onClick={() => setAppearanceOpen(true)}
            />
          </section>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[0_5px_18px_rgba(25,50,34,0.06)] transition active:scale-[0.99]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-[var(--text-primary)]">
                App Update Available
              </span>
              <span className="mt-1 block text-xs font-medium text-[var(--text-muted)]">
                Bug fixes and performance improvements.
              </span>
            </span>
            <span className="text-xs font-black text-[var(--primary)]">v0.2.1</span>
            <ChevronRight size={17} className="shrink-0 text-[var(--text-muted)]" />
          </button>

          <AccountSection title="Your Information">
            <AccountButton
              icon={UserRound}
              title="My Profile"
              description={
                hasProfile ? "View and edit personal details" : "Complete your profile"
              }
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
            />
            <AccountLink
              href="/orders"
              icon={Package}
              title="My Orders"
              description="Track and review orders"
              border
            />
            <AccountLink
              href="/account/addresses"
              icon={MapPin}
              title="Saved Address"
              description="Manage delivery addresses"
              border
            />
            <AccountLink
              href="/wishlist"
              icon={Heart}
              title="Wishlist"
              description={`${wishlistHydrated ? wishlistItems : 0} saved products`}
              border
            />

            {editing || saved || error ? (
              <ProfileForm
                form={form}
                editing={editing}
                saved={saved}
                error={error}
                onChange={updateField}
                onSubmit={saveProfile}
                onCancel={cancelEditing}
              />
            ) : null}

           
          </AccountSection>

          <AccountSection title="Payments & Coupons">
            <AccountLink
              href="/offers"
              icon={TicketPercent}
              title="Coupons"
              description="View active discounts and coupon codes"
            />
            <AccountPlaceholder
              icon={Wallet}
              title="Wallet"
              description="Coming soon"
              border
            />
            <AccountPlaceholder
              icon={Gift}
              title="Gift Cards"
              description="Coming soon"
              border
            />
            <AccountPlaceholder
              icon={ShieldCheck}
              title="Payment Methods"
              description="Coming soon"
              border
            />
          </AccountSection>

          <AccountSection title="Other Information">
            <AccountLink
              href="/notifications"
              icon={Bell}
              title="Notifications"
              description={
                notificationsHydrated && unreadCount > 0
                  ? `${unreadCount} unread updates`
                  : "Orders, payments and offers"
              }
            />
            <AccountLink
              href="/account/settings"
              icon={Settings}
              title="Settings"
              description="Language and notification preferences"
              border
            />
            <AccountLink
              href="/help"
              icon={ShieldCheck}
              title="Help & Support"
              description="Orders, payments and delivery"
              border
            />
            <AccountPlaceholder
              icon={Store}
              title="About Bootkit"
              description="Learn about BootKiT"
              border
            />
            {(session?.role === "ADMIN" || session?.role === "OWNER") ? (
              <AccountLink
                href="/admin"
                icon={Store}
                title="Admin dashboard"
                description="Manage orders and store data"
                border
              />
            ) : null}
            {session?.role === "OWNER" ? (
              <AccountLink
                href="/owner"
                icon={Store}
                title="Owner control centre"
                description="Manage customer and admin access"
                border
              />
            ) : null}
            {session ? (
              <AccountButton
                icon={LogOut}
                title="Logout"
                description="Sign out from this account"
                onClick={logout}
                border
                danger
              />
            ) : (
              <AccountLink
                href="/login"
                icon={UserRound}
                title="Login / Register"
                description="Access your account"
                border
              />
            )}
          </AccountSection>
        </div>
      </main>

      <AppearanceSheet
        open={appearanceOpen}
        value={
          theme === "light" || theme === "dark" || theme === "system"
            ? theme
            : "system"
        }
        onClose={() => setAppearanceOpen(false)}
        onChange={setTheme}
      />
    </div>
  );
}

type QuickActionProps = {
  icon: LucideIcon;
  title: string;
  href?: string;
  onClick?: () => void;
};

function QuickAction({ icon: Icon, title, href, onClick }: QuickActionProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF8F1] text-[var(--primary)]">
        <Icon size={19} />
      </span>
      <span className="mt-2 text-center text-[10px] font-black leading-3 text-[var(--text-primary)]">
        {title}
      </span>
    </>
  );
  const className = "flex min-h-[82px] flex-col items-center justify-center rounded-[18px] px-1 transition active:bg-[#F6F9F6]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

type AppearanceSheetProps = {
  open: boolean;
  value: AppearanceOption;
  onClose: () => void;
  onChange: (value: AppearanceOption) => void;
};

function AppearanceSheet({ open, value, onClose, onChange }: AppearanceSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const options: { value: AppearanceOption; label: string }[] = [
    { value: "light", label: "☀️ Light Theme" },
    { value: "dark", label: "🌙 Dark Theme" },
    { value: "system", label: "💻 System Theme" },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/30"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-title"
        className="w-full rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(27,56,38,0.18)] sm:mx-auto sm:max-w-xl"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-[#DDE6DF]" />
        <h2 id="appearance-title" className="py-5 text-lg font-black text-[var(--text-primary)]">
          App Appearance
        </h2>
        <div className="space-y-1">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-sm font-bold transition ${
                  selected
                    ? "bg-[#EDF9F0] text-[var(--primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[#F7FAF8]"
                }`}
              >
                {option.label}
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[var(--primary)]" : "border-[#D9E5DC]"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full bg-[var(--primary)] transition ${selected ? "scale-100" : "scale-0"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AccountSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
      <h2 className="mb-3 text-lg font-black text-[var(--text-primary)]">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

type AccountRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  border?: boolean;
};

type AccountLinkProps = AccountRowProps & { href: string };

function AccountLink({
  href,
  title,
  description,
  border = false,
}: AccountLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center py-3.5 text-left transition active:bg-[#F7FAF8] ${
        border ? "border-t border-[#EEF2EF]" : ""
      }`}
    >
      <AccountRowText title={title} description={description} />
      <ChevronRight size={17} className="shrink-0 text-[var(--text-muted)]" />
    </Link>
  );
}

type AccountButtonProps = AccountRowProps & {
  onClick: () => void;
  danger?: boolean;
};

function AccountButton({
  title,
  description,
  onClick,
  border = false,
  danger = false,
}: AccountButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center py-3.5 text-left transition active:bg-[#F7FAF8] ${
        border ? "border-t border-[#EEF2EF]" : ""
      }`}
    >
      <AccountRowText title={title} description={description} danger={danger} />
      <ChevronRight size={17} className="shrink-0 text-[var(--text-muted)]" />
    </button>
  );
}

function AccountPlaceholder({
  title,
  description,
  border = false,
}: AccountRowProps) {
  return (
    <div
      className={`flex items-center py-3.5 ${
        border ? "border-t border-[#EEF2EF]" : ""
      }`}
    >
      <AccountRowText title={title} description={description} />
      <ChevronRight size={17} className="shrink-0 text-[var(--text-muted)]" />
    </div>
  );
}

function AccountRowText({
  title,
  description,
  danger = false,
}: {
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span
        className={`block text-sm font-black ${
          danger ? "text-[var(--danger)]" : "text-[var(--text-primary)]"
        }`}
      >
        {title}
      </span>
      <span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">
        {description}
      </span>
    </span>
  );
}

type ProfileFormProps = {
  form: CustomerProfile;
  editing: boolean;
  saved: boolean;
  error: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

function ProfileForm({
  form,
  editing,
  saved,
  error,
  onChange,
  onSubmit,
  onCancel,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4 border-t border-[#EEF2EF] pt-4">
      {saved ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
          Profile saved successfully.
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileField label="Full name" name="fullName" value={form.fullName} onChange={onChange} placeholder="Enter full name" icon={UserRound} disabled={!editing} required />
        <ProfileField label="Mobile number" name="phone" value={form.phone} onChange={onChange} placeholder="10-digit mobile number" icon={Phone} disabled={!editing} inputMode="numeric" required />
        <ProfileField label="Email address" name="email" value={form.email} onChange={onChange} placeholder="Enter email address" icon={Mail} disabled={!editing} inputMode="email" />
        <ProfileField label="Date of birth" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} placeholder="" icon={UserRound} disabled={!editing} type="date" />
      </div>
      {error ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[var(--danger)]">
          {error}
        </div>
      ) : null}
      {editing ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white">
            <Save size={17} />
            Save profile
          </button>
          <button type="button" onClick={onCancel} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-black text-[var(--text-secondary)]">
            <X size={17} />
            Cancel
          </button>
        </div>
      ) : null}
    </form>
  );
}

type ProfileFieldProps = {
  label: string;
  name: keyof CustomerProfile;
  value: string;
  placeholder: string;
  icon: LucideIcon;
  disabled: boolean;
  required?: boolean;
  type?: "text" | "date";
  inputMode?: "text" | "numeric" | "email" | "tel";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
        {required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}
      </span>
      <span className={`flex h-12 items-center gap-3 rounded-xl border px-3 transition ${disabled ? "border-[var(--border)] bg-[var(--surface-soft)]" : "border-[var(--border)] bg-white focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-green-900/10"}`}>
        <Icon size={17} className="shrink-0 text-[var(--primary)]" />
        <input type={type} name={name} value={value} required={required} disabled={disabled} inputMode={inputMode} placeholder={placeholder} onChange={onChange} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-default" />
      </span>
    </label>
  );
}
