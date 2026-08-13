"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CircleUserRound,
  HelpCircle,
  Info,
  Camera,
  MapPin,
  Store,
} from "lucide-react";

type UnserviceableLocation = {
  area?: string;
  city?: string;
  pincode?: string;
};

const UNSERVICEABLE_KEY =
  "bootkit_unserviceable_location_v1";
const PENDING_LOCATION_KEY =
  "bootkit_pending_location_v1";

export default function UnserviceableAreaPage() {
  const router = useRouter();
  const [location, setLocation] =
    useState<UnserviceableLocation | null>(null);

  useEffect(() => {
    try {
      const rawLocation =
        window.sessionStorage.getItem(UNSERVICEABLE_KEY);

      if (rawLocation) {
        setLocation(
          JSON.parse(rawLocation) as UnserviceableLocation,
        );
      }
    } catch {
      setLocation(null);
    }
  }, []);

  const selectAnotherLocation = () => {
    window.sessionStorage.removeItem(UNSERVICEABLE_KEY);
    window.sessionStorage.removeItem(PENDING_LOCATION_KEY);
    router.replace("/select-location");
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-[#FFF0F2]">
      <header className="flex items-start justify-between px-5 pb-3 pt-7">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#E84D65]">
            Unserviceable area
          </h1>

          {location?.area ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#8E5962]">
              <MapPin size={13} />
              {location.area}
              {location.pincode
                ? ` · ${location.pincode}`
                : ""}
            </p>
          ) : null}
        </div>

        <Link
          href="/account"
          aria-label="Open account"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E9C9CE] bg-white text-[#222]"
        >
          <CircleUserRound size={26} />
        </Link>
      </header>

      <section className="px-6 pt-16 text-center">
        <h2 className="text-3xl font-black leading-[1.35] tracking-[-0.035em] text-[#831C2C]">
          Hello!
          <br />
          It&apos;s not you, it&apos;s us.
        </h2>

        <p className="mt-5 text-2xl font-black leading-[1.35] text-[#831C2C]">
          We are not serving this area
          <br />
          at the moment.
        </p>

        <p className="mt-5 text-xl font-bold text-[#9A3545]">
          Sorry for the inconvenience 😔
        </p>

        <div className="mx-auto mt-16 flex h-48 w-64 flex-col items-center justify-end rounded-t-[90px] bg-[#FFE1E5]">
          <div className="rounded-3xl border-[8px] border-white bg-[#D87786] p-7 text-white shadow-xl">
            <Store size={74} strokeWidth={1.6} />
          </div>
          <p className="mt-3 rounded-t-xl bg-[#E76D7E] px-8 py-2 text-sm font-black text-white">
            Store closed
          </p>
        </div>
      </section>

      <section className="rounded-t-[28px] bg-white px-5 pb-8 pt-6">
        <button
          type="button"
          onClick={selectAnotherLocation}
          className="h-14 w-full rounded-2xl bg-[var(--primary)] text-base font-black text-white"
        >
          Select another location
        </button>

        <div className="mt-6 divide-y divide-[#EEF2EF]">
          <ActionRow
            icon={<HelpCircle size={21} />}
            label="Need help with your previous orders?"
          />
          <ActionRow
            icon={<Info size={21} />}
            label="About us"
          />
          <ActionRow
            icon={<Camera size={21} />}
            label="Follow us for service updates"
          />
        </div>
      </section>
    </main>
  );
}

function ActionRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 py-5 text-left"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3F5] text-[#8B3442]">
        {icon}
      </span>

      <span className="flex-1 text-sm font-bold text-[var(--text-primary)]">
        {label}
      </span>

      <ChevronRight
        size={19}
        className="text-[var(--text-muted)]"
      />
    </button>
  );
}