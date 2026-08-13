"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAccount } from "@/hooks/useAccount";
import { sendOtpWithBackend } from "@/services/auth.service";

const PHONE_KEY = "bootkit_otp_phone";
const RESEND_KEY = "bootkit_otp_resend_seconds";

export default function OtpVerificationPage() {
  const router = useRouter();
  const { loginWithOtp } = useAccount();

  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(6).fill(""),
  );
  const [resendSeconds, setResendSeconds] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastAttemptedOtp = useRef("");

  useEffect(() => {
    const storedPhone = window.sessionStorage.getItem(PHONE_KEY);

    if (!storedPhone) {
      router.replace("/");
      return;
    }

    const storedSeconds = Number(
      window.sessionStorage.getItem(RESEND_KEY),
    );

    setPhone(storedPhone);
    setResendSeconds(
      Number.isFinite(storedSeconds) ? storedSeconds : 30,
    );
    setReady(true);

    window.setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 100);
  }, [router]);

  useEffect(() => {
    if (!ready || resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ready, resendSeconds]);

  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!phone || otp.length !== 6) {
        return;
      }

      setError("");
      setIsSubmitting(true);

      const result = await loginWithOtp(phone, otp);

      setIsSubmitting(false);

      if (!result.success) {
        setError(result.message || "Invalid or expired OTP.");
        return;
      }

     window.sessionStorage.removeItem(PHONE_KEY);
window.sessionStorage.removeItem(RESEND_KEY);

router.replace("/select-location");
    },
    [loginWithOtp, phone, router],
  );

  useEffect(() => {
    const otp = otpValues.join("");

    if (
      otp.length !== 6 ||
      !phone ||
      isSubmitting ||
      lastAttemptedOtp.current === otp
    ) {
      return;
    }

    lastAttemptedOtp.current = otp;
    void verifyOtp(otp);
  }, [isSubmitting, otpValues, phone, verifyOtp]);

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otpValues];

    nextOtp[index] = digit;
    setOtpValues(nextOtp);
    setError("");
    lastAttemptedOtp.current = "";

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (
      event.key === "Backspace" &&
      !otpValues[index] &&
      index > 0
    ) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedOtp.length === 6) {
      setOtpValues(pastedOtp.split(""));
      setError("");
      lastAttemptedOtp.current = "";
      otpInputsRef.current[5]?.focus();
    }
  };

  const resendOtp = async () => {
    if (!phone || resendSeconds > 0 || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await sendOtpWithBackend(phone);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOtpValues(Array(6).fill(""));
    lastAttemptedOtp.current = "";
    setResendSeconds(
      result.data?.resendAvailableInSeconds ?? 30,
    );

    otpInputsRef.current[0]?.focus();
  };

  const goBack = () => {
    window.sessionStorage.removeItem(PHONE_KEY);
    window.sessionStorage.removeItem(RESEND_KEY);
    router.replace("/");
  };

  if (!ready) {
    return null;
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white">
      <header className="grid h-[70px] grid-cols-[48px_1fr_48px] items-center border-b border-[#EEF2EF] px-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-center text-base font-bold">
          OTP Verification
        </h1>

        <span />
      </header>

      <section className="px-6 pt-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          We have sent a verification code to
        </p>

        <p className="mt-1 text-base font-bold">
          {phone}
        </p>

        <div className="mt-8 grid grid-cols-6 gap-2">
          {otpValues.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                otpInputsRef.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              disabled={isSubmitting}
              onChange={(event) =>
                handleOtpChange(event.target.value, index)
              }
              onKeyDown={(event) =>
                handleKeyDown(event, index)
              }
              onPaste={index === 0 ? handlePaste : undefined}
              aria-label={`OTP digit ${index + 1}`}
              className="h-12 min-w-0 rounded-lg border border-[#AEB5B0] text-center text-lg font-bold outline-none focus:border-[var(--primary)]"
            />
          ))}
        </div>

        {isSubmitting ? (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Loader2 size={16} className="animate-spin" />
            Verifying OTP...
          </p>
        ) : (
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendSeconds > 0}
            className="mt-6 text-sm font-semibold text-[var(--primary)] disabled:text-[#C4C8C5]"
          >
            {resendSeconds > 0
              ? `Resend Code (in ${resendSeconds} secs)`
              : "Resend Code"}
          </button>
        )}

        {error ? (
          <p className="mt-4 text-sm font-semibold text-[var(--danger)]">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}