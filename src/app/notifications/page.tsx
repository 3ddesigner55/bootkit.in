"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.64 13.49 14.47 13.45 14.31 13.7C14.14 13.95 13.67 14.5 13.52 14.67C13.38 14.84 13.23 14.86 12.98 14.73C12.73 14.61 11.93 14.35 10.98 13.5C10.24 12.84 9.74 12.03 9.6 11.78C9.45 11.53 9.58 11.39 9.71 11.27C9.82 11.16 9.96 10.98 10.08 10.84C10.21 10.7 10.25 10.6 10.33 10.43C10.42 10.26 10.38 10.11 10.31 9.99C10.25 9.86 9.74 8.62 9.53 8.11C9.33 7.62 9.12 7.68 8.96 7.67C8.82 7.67 8.65 7.67 8.48 7.67C8.31 7.67 8.04 7.73 7.81 7.98C7.58 8.23 6.94 8.83 6.94 10.04C6.94 11.25 7.83 12.42 7.95 12.58C8.07 12.75 9.68 15.22 12.16 16.29C12.75 16.54 13.21 16.69 13.57 16.81C14.16 17 14.7 16.97 15.12 16.91C15.6 16.84 16.56 16.33 16.77 15.75C16.97 15.16 16.97 14.66 16.91 14.56C16.85 14.45 16.81 14.51 16.56 14.39Z" />
    </svg>
  );
}

type ChannelPreferences = {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
};

const CHANNELS_KEY = "bootkit_notification_channels_v1";

const defaultChannels: ChannelPreferences = {
  whatsapp: true,
  sms: true,
  email: true,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelPreferences>(defaultChannels);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHANNELS_KEY);
      if (stored) {
        setChannels({ ...defaultChannels, ...JSON.parse(stored) });
      }
    } catch {}
  }, []);

  const toggleChannel = (key: keyof ChannelPreferences) => {
    const updated = { ...channels, [key]: !channels[key] };
    setChannels(updated);
    try {
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
    } catch {}

    const channelName =
      key === "whatsapp" ? "WhatsApp" : key === "sms" ? "SMS" : "Email";
    const status = updated[key] ? "enabled" : "disabled";
    setToastMessage(`${channelName} notifications ${status}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/account");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] pb-24 text-[var(--text-primary)]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-[#EEF2EF] bg-white/95 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-black transition hover:bg-[#E5E7EB] active:scale-95"
          >
            <ArrowLeft size={19} />
          </button>
          <h1 className="text-base font-black text-[var(--text-primary)]">
            Notifications
          </h1>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {/* Toast Alert */}
        {toastMessage ? (
          <div className="rounded-2xl bg-[#ECFDF5] p-3 text-center text-xs font-black text-[#065F46] border border-[#A7F3D0] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            {toastMessage}
          </div>
        ) : null}

        {/* Notification Channels (WhatsApp, SMS, Email On/Off Buttons) */}
        <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div className="pb-3 border-b border-[#EEF2EF]">
            <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
              Alert Channels
            </h2>
            <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
              Turn on or off notifications on WhatsApp, SMS & Email
            </p>
          </div>

          <div className="divide-y divide-[#EEF2EF]">
            {/* WhatsApp Toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <WhatsAppIcon size={22} />
                </span>
                <div>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    WhatsApp
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Order tracking, bills & delivery updates
                  </span>
                </div>
              </div>

              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={() => toggleChannel("whatsapp")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-[#E5E7EB] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[#25D366] peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* SMS Toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Smartphone size={20} />
                </span>
                <div>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    SMS Alerts
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Instant OTPs & dispatch SMS
                  </span>
                </div>
              </div>

              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={() => toggleChannel("sms")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-[#E5E7EB] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Email Toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Mail size={20} />
                </span>
                <div>
                  <span className="block text-sm font-black text-[var(--text-primary)]">
                    Email
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Invoices, receipts & monthly summaries
                  </span>
                </div>
              </div>

              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={() => toggleChannel("email")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-[#E5E7EB] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}