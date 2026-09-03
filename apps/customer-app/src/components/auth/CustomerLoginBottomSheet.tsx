"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
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
  
  // 6 individual OTP input boxes state
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [resendSeconds, setResendSeconds] = useState(DEFAULT_RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPhoneValid = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 && /^[6-9]/.test(digits);
  }, [phone]);

  const closeSheet = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 300);
  }, [isSubmitting, onClose]);

  const requestOtp = async () => {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit mobile number");
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

    setOtpValues(Array(6).fill(""));
    setResendSeconds(
      result.data?.resendAvailableInSeconds ?? DEFAULT_RESEND_SECONDS
    );
    setStep("otp");
  };

  const getOtpString = useCallback(() => {
    return otpValues.join("");
  }, [otpValues]);

  const verifyOtp = async () => {
    const otpString = getOtpString();
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await loginWithOtp(toInternationalPhone(phone), otpString);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || "Invalid or expired OTP.");
      return;
    }

    closeSheet();
    if (onAuthenticated) {
      window.setTimeout(onAuthenticated, 300);
    }
  };

  // Keyboard and focus management for 6 OTP boxes
  const handleOtpChange = (val: string, index: number) => {
    const numericVal = val.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otpValues];
    nextOtp[index] = numericVal;
    setOtpValues(nextOtp);
    setError("");

    if (numericVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const nextOtp = [...otpValues];
        nextOtp[index - 1] = "";
        setOtpValues(nextOtp);
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const nextOtp = pasteData.split("");
      setOtpValues(nextOtp);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Autofocus the first OTP box when transitioning to OTP step
  useEffect(() => {
    if (step === "otp" && open) {
      window.setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step, open]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setStep("phone");
      setPhone(initialPhone ?? "");
      setOtpValues(Array(6).fill(""));
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
                      // Only allow digits up to 10 characters
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
                <div className="mt-3 flex justify-between gap-2">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      aria-label={`OTP digit ${index + 1}`}
                      className="h-12 w-12 text-center rounded-xl border border-[#E5ECE6] bg-[#F8FAF8] text-lg font-bold outline-none focus:border-[var(--primary)] focus:bg-white"
                    />
                  ))}
                </div>
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
            disabled={isSubmitting || (step === "phone" && !isPhoneValid)}
            className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
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
