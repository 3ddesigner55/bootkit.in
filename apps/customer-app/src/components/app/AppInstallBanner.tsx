"use client";

import {
  Download,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISSED_KEY = "bootkit_install_banner_dismissed_v1";

export default function AppInstallBanner() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const navigatorWithStandalone = navigator as Navigator & {
      standalone?: boolean;
    };

    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;

    const iosDevice =
      /iphone|ipad|ipod/i.test(navigator.userAgent);

    const previouslyDismissed =
      window.localStorage.getItem(DISMISSED_KEY) === "true";

    setIsInstalled(installed);
    setIsIOS(iosDevice);
    setDismissed(previouslyDismissed);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );

      if (!previouslyDismissed) {
        setDismissed(false);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    if (
      iosDevice &&
      !installed &&
      !previouslyDismissed
    ) {
      setDismissed(false);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (
    isInstalled ||
    dismissed ||
    (!installPrompt && !isIOS)
  ) {
    return null;
  }

  return (
    <aside className="fixed inset-x-3 bottom-[78px] z-[60] mx-auto max-w-md rounded-[22px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,18,0.22)] backdrop-blur-xl lg:bottom-5">
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Close install app message"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)]"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
          <Smartphone size={23} />
        </span>

        <div>
          <h2 className="text-sm font-black text-[var(--text-primary)]">
            Install the BootKiT app
          </h2>

          <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
            Open BootKiT directly from your phone home screen for a
            faster app-style experience.
          </p>
        </div>
      </div>

      {installPrompt ? (
        <button
          type="button"
          onClick={installApp}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-xs font-black text-white"
        >
          <Download size={17} />
          Install BootKiT
        </button>
      ) : (
        <div className="mt-4 rounded-xl bg-[var(--surface-soft)] px-3 py-3">
          <p className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-primary)]">
            <Share
              size={16}
              className="text-[var(--primary)]"
            />
            On iPhone: tap Share, then Add to Home Screen
          </p>
        </div>
      )}
    </aside>
  );
}