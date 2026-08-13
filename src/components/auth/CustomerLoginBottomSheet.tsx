"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { sendOtpWithBackend } from "@/services/auth.service";
import { useAccount } from "@/hooks/useAccount";

type CustomerLoginBottomSheetProps = {
  open: boolean;
  initialPhone?: string;
  onClose: () => void;
  onAuthenticated?: () => void;
};

const DEFAULT_RESEND_SECONDS = 30;

function toInternationalPhone(phone: string): string {
  return `+91${phone.replace(/\D/g, "")}`;
}

export default function CustomerLoginBottomSheet({
  open,
  initialPhone,
  onClose,
  onAuthenticated,
}: CustomerLoginBottomSheetProps) {
  const { loginWithOtp } = useAccount();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(true);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(DEFAULT_RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closeSheet = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setClosing(true);
    window.setTimeout(onClose, 300);
  }, [isSubmitting, onClose]);

  const requestOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await sendOtpWithBackend(toInternationalPhone(phone));
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOtp("");
    setResendSeconds(
      result.data?.resendAvailableInSeconds ?? DEFAULT_RESEND_SECONDS
    );
    setStep("otp");
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await loginWithOtp(toInternationalPhone(phone), otp);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    closeSheet();
    if (onAuthenticated) {
      window.setTimeout(onAuthenticated, 300);
    }
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      setStep("phone");
      setPhone(initialPhone ?? "");
      setOtp("");
      setResendSeconds(DEFAULT_RESEND_SECONDS);
      setError("");

      const animationFrame = window.requestAnimationFrame(() => {
        setClosing(false);
      });
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.cancelAnimationFrame(animationFrame);
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!mounted) {
      return;
    }

    setClosing(true);
    const closeTimer = window.setTimeout(() => setMounted(false), 300);

    return () => window.clearTimeout(closeTimer);
  }, [initialPhone, mounted, open]);

  useEffect(() => {
    if (!open || step !== "otp" || resendSeconds === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, resendSeconds, step]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSheet, open]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-login-bottom-sheet-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSheet();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <section
        className={`safe-bottom flex w-full max-w-md flex-col rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.20)] transition-transform duration-300 ${
          closing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#DCE6DF]" />

        <div className="flex items-center border-b border-[#EEF2EF] px-4 py-4">
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Close login"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-primary)] transition hover:bg-[#F5F8F5]"
          >
            <X size={20} />
          </button>

          <h2
            id="customer-login-bottom-sheet-title"
            className="flex-1 pr-10 text-center text-base font-black text-[var(--text-primary)]"
          >
            Login
          </h2>
        </div>

        <div className="px-4 py-5">
          {step === "phone" ? (
            <>
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Mobile number
                <div className="mt-2 flex h-12 overflow-hidden rounded-2xl border border-[#E5ECE6] bg-[#F8FAF8]">
                  <span className="flex items-center border-r border-[#E5ECE6] px-4 text-sm font-bold text-[var(--text-primary)]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="10-digit mobile number"
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </label>
              <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">
                We&apos;ll send a one-time password to verify your number.
              </p>
            </>
          ) : (
            <>
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Enter 6-digit OTP
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="Enter OTP"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#E5ECE6] bg-[#F8FAF8] px-4 text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
                />
              </label>
              <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">
                Sent to +91 {phone}
              </p>
            </>
          )}

          {error ? (
            <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={step === "phone" ? requestOtp : verifyOtp}
            disabled={isSubmitting}
            className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? step === "phone"
                ? "Sending OTP..."
                : "Verifying..."
              : step === "phone"
                ? "Send OTP"
                : "Verify OTP"}
          </button>

          {step === "otp" ? (
            <button
              type="button"
              onClick={requestOtp}
              disabled={isSubmitting || resendSeconds > 0}
              className="mt-4 w-full text-center text-xs font-black text-[var(--primary)] disabled:text-[var(--text-muted)]"
            >
              {resendSeconds > 0
                ? `Resend OTP in ${resendSeconds}s`
                : "Resend OTP"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
