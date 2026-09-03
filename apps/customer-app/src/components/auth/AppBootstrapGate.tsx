"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useLocation } from "@/hooks/useLocation";
import { MapPin, ShieldAlert, WifiOff, Loader2, Sparkles } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { reverseGeocodeMapboxLocation } from "@/services/mapbox.service";
import WelcomeLoginScreen from "@/components/welcome/WelcomeLoginScreen";
import { useDeliveryAreas } from "@/hooks/useDeliveryAreas";

type BootstrapState =
  | "STARTING"
  | "RESTORING_SESSION"
  | "CHECKING_SERVICEABILITY"
  | "LOCATION_REQUIRED"
  | "UNSERVICEABLE_AREA"
  | "OFFLINE_RETRY"
  | "BLOCKED"
  | "READY";

export default function AppBootstrapGate({ children }: { children: React.ReactNode }) {
  const { session, hydrated: authHydrated, logout } = useAccount();
  const { location, setResolvedStoreId, selectLocation } = useLocation();
  const { activeDeliveryAreas, hydrated: areasHydrated } = useDeliveryAreas();

  const [bootstrapState, setBootstrapState] = useState<BootstrapState>(() => {
    if (typeof window !== "undefined") {
      const storedLocation = window.localStorage.getItem("bootkit_location_v1");
      const storedSession = window.localStorage.getItem("bootkit_session_v1");
      const welcomeSkipped = window.localStorage.getItem("bootkit_welcome_skipped") === "true";
      if (storedLocation && (storedSession || welcomeSkipped)) {
        return "READY";
      }
    }
    return "STARTING";
  });
  const [networkError, setNetworkError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [showPincodeInput, setShowPincodeInput] = useState(false);
  const [locating, setLocating] = useState(false);
  const [openSettingsAvailable, setOpenSettingsAvailable] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Try hiding native Capacitor Splashscreen safely
  const hideNativeSplash = useCallback(async () => {
    if (typeof window !== "undefined") {
      const cap = (window as any).Capacitor;
      if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
        try {
          const SplashScreen = cap.Plugins?.SplashScreen;
          if (SplashScreen) {
            await SplashScreen.hide();
          }
        } catch (e) {
          console.warn("Capacitor SplashScreen.hide failed:", e);
        }
      }
    }
  }, []);

  const checkServiceability = useCallback(async (pincode: string) => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/customer/serviceability/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });

      if (!res.ok) {
        throw new Error("Serviceability check failed");
      }

      const data = await res.json();
      if (data.success && data.status === "SERVICEABLE" && data.data) {
        if (setResolvedStoreId) {
          setResolvedStoreId(data.data.storeId);
        }
        setBootstrapState("READY");
        void hideNativeSplash();
      } else if (data.status === "STORE_CLOSED") {
        setErrorMessage("The store serving your area is currently closed.");
        setBootstrapState("UNSERVICEABLE_AREA");
        void hideNativeSplash();
      } else if (data.status === "STORE_UNAVAILABLE") {
        setErrorMessage("The store serving your area is temporarily offline.");
        setBootstrapState("UNSERVICEABLE_AREA");
        void hideNativeSplash();
      } else {
        setErrorMessage("We do not deliver to this pincode yet.");
        setBootstrapState("UNSERVICEABLE_AREA");
        void hideNativeSplash();
      }
    } catch (err) {
      setNetworkError(true);
      setBootstrapState("OFFLINE_RETRY");
      void hideNativeSplash();
    }
  }, [setResolvedStoreId, hideNativeSplash]);

  const handleManualPincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincodeInput)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }
    const matchedArea = activeDeliveryAreas.find((a) => a.pincode === pincodeInput);
    if (matchedArea) {
      selectLocation(matchedArea);
      setBootstrapState("CHECKING_SERVICEABILITY");
    } else {
      setErrorMessage("Pincode not found or unserviceable.");
      setBootstrapState("UNSERVICEABLE_AREA");
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Location services are not available on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const controller = new AbortController();
          const suggestion = await reverseGeocodeMapboxLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            controller.signal
          );

          setLocating(false);

          if (suggestion?.description) {
            // Find pincode in reverse geocoding address
            const match = suggestion.description.match(/\b\d{6}\b/);
            if (match && match[0]) {
              const pin = match[0];
              const matchedArea = activeDeliveryAreas.find((a) => a.pincode === pin);
              if (matchedArea) {
                selectLocation(matchedArea);
                setBootstrapState("CHECKING_SERVICEABILITY");
                return;
              }
            }
          }

          // Fallback to manual selection if geocoding didn't match an active pincode
          setShowPincodeInput(true);
          alert("Could not automatically match your current location geofence. Please enter your pincode manually.");
        } catch {
          setLocating(false);
          setShowPincodeInput(true);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          // Permission Denied
          setOpenSettingsAvailable(true);
        }
        setShowPincodeInput(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleOpenSettings = async () => {
    if (typeof window !== "undefined") {
      const cap = (window as any).Capacitor;
      if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
        try {
          // Open native application details setting screen
          const NativeSettings = cap.Plugins?.NativeSettings;
          if (NativeSettings) {
            await NativeSettings.open({
              option: "applicationDetails",
            });
            return;
          }
        } catch (e) {
          console.warn("Capacitor NativeSettings failed:", e);
        }
      }
    }
    alert("Please open device settings, search for BootKiT, and allow location permission.");
  };

  useEffect(() => {
    if (bootstrapState === "READY") {
      void hideNativeSplash();
    }
  }, [bootstrapState, hideNativeSplash]);

  // State transitions runner
  useEffect(() => {
    if (bootstrapState === "STARTING") {
      if (authHydrated) {
        setBootstrapState("RESTORING_SESSION");
      } else {
        const splashTimeout = window.setTimeout(() => {
          void hideNativeSplash();
          setBootstrapState("RESTORING_SESSION");
        }, 1500);
        return () => window.clearTimeout(splashTimeout);
      }
    }

    if (bootstrapState === "RESTORING_SESSION") {
      if (session) {
        if (session.role !== "CUSTOMER") {
          setBootstrapState("BLOCKED");
          setErrorMessage("Management roles are not permitted on the Customer APK.");
          void hideNativeSplash();
        } else {
          setBootstrapState("CHECKING_SERVICEABILITY");
        }
      } else {
        // Unauthenticated session, show Welcome/Login Screen
        const welcomeSkipped = typeof window !== "undefined" && window.localStorage.getItem("bootkit_welcome_skipped") === "true";
        if (welcomeSkipped) {
          setBootstrapState("CHECKING_SERVICEABILITY");
        } else {
          void hideNativeSplash();
        }
      }
    }

    if (bootstrapState === "CHECKING_SERVICEABILITY") {
      if (location?.pincode) {
        void checkServiceability(location.pincode);
      } else {
        setBootstrapState("LOCATION_REQUIRED");
        void hideNativeSplash();
      }
    }
  }, [bootstrapState, authHydrated, session, location, hideNativeSplash, checkServiceability]);

  // Handle skip/offline retry actions
  const retryBootstrap = () => {
    setNetworkError(false);
    setBootstrapState("STARTING");
  };

  // UI Renders for gates
  if (bootstrapState === "STARTING" || bootstrapState === "RESTORING_SESSION") {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#165c3a] text-white">
        <div className="flex flex-col items-center gap-4">
          <Logo className="scale-125" />
          <Loader2 className="animate-spin mt-8 text-[#d7a928]" size={28} />
          <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-2">
            Bootstrapping App...
          </p>
        </div>
      </div>
    );
  }

  if (bootstrapState === "BLOCKED") {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-white p-6 text-center">
        <ShieldAlert size={56} className="text-[var(--danger)] mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          {errorMessage || "You do not have permission to access the Customer App."}
        </p>
        <button
          onClick={() => {
            logout();
            setBootstrapState("STARTING");
          }}
          className="mt-6 px-6 h-12 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition"
        >
          Sign Out & Return
        </button>
      </div>
    );
  }

  if (bootstrapState === "OFFLINE_RETRY") {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-white p-6 text-center">
        <WifiOff size={56} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-black text-slate-800">Connection Failed</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={retryBootstrap}
          className="mt-6 px-6 h-12 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:brightness-95 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // If unauthenticated and welcome login is not closed yet
  if (!session && bootstrapState !== "READY" && bootstrapState !== "CHECKING_SERVICEABILITY" && bootstrapState !== "LOCATION_REQUIRED" && bootstrapState !== "UNSERVICEABLE_AREA") {
    return (
      <WelcomeLoginScreen onSkip={() => setBootstrapState("CHECKING_SERVICEABILITY")} />
    );
  }

  if (bootstrapState === "LOCATION_REQUIRED") {
    return (
      <div className="fixed inset-0 z-[140] flex flex-col bg-[#F8FAF8] justify-between p-6">
        <div className="flex flex-col items-center text-center mt-16 max-w-sm mx-auto space-y-6">
          <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-[var(--primary)] shadow-sm border border-emerald-100">
            <MapPin size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Check Store Serviceability</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please allow location access to check delivery in your area.
            </p>
          </div>

          {showPincodeInput ? (
            <form onSubmit={handleManualPincodeSubmit} className="w-full space-y-3">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                className="w-full h-12 text-center rounded-xl border border-[var(--border)] bg-white text-base font-bold outline-none focus:border-[var(--primary)]"
              />
              <button
                type="submit"
                disabled={pincodeInput.length !== 6}
                className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Submit Pincode
              </button>
            </form>
          ) : null}
        </div>

        <div className="w-full max-w-sm mx-auto space-y-3 pb-8">
          <button
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="w-full h-12 bg-[var(--primary)] text-white rounded-xl text-sm font-black hover:brightness-95 flex items-center justify-center gap-2"
          >
            {locating ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
            {locating ? "Locating..." : "Allow Current Location"}
          </button>

          {openSettingsAvailable ? (
            <button
              onClick={handleOpenSettings}
              className="w-full h-12 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
            >
              Open Settings
            </button>
          ) : null}

          <button
            onClick={() => setShowPincodeInput((prev) => !prev)}
            className="w-full h-12 border border-[var(--border)] bg-white text-slate-700 rounded-xl text-sm font-bold"
          >
            {showPincodeInput ? "Cancel Pincode" : "Enter Pincode Manually"}
          </button>
        </div>
      </div>
    );
  }

  if (bootstrapState === "UNSERVICEABLE_AREA") {
    return (
      <div className="fixed inset-0 z-[140] flex flex-col bg-[#F8FAF8] justify-between p-6">
        <div className="flex flex-col items-center text-center mt-24 max-w-sm mx-auto space-y-6">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-[var(--danger)] shadow-sm border border-red-100">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Unserviceable Area</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorMessage || "We do not deliver to this pincode yet."}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-3 pb-8">
          <button
            onClick={() => setBootstrapState("LOCATION_REQUIRED")}
            className="w-full h-12 bg-[var(--primary)] text-white rounded-xl text-sm font-black flex items-center justify-center"
          >
            Change Location
          </button>
          <button
            onClick={() => {
              logout();
              setBootstrapState("STARTING");
            }}
            className="w-full h-12 border border-[var(--border)] bg-white text-slate-700 rounded-xl text-sm font-bold"
          >
            Cancel & Logout
          </button>
        </div>
      </div>
    );
  }

  // Once state is READY, render the main customer app layout
  return <>{children}</>;
}
