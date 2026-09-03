"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect, useRef } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { sendOtpWithBackend } from "@/services/auth.service";
import { useAccount } from "@/hooks/useAccount";
import { Loader2 } from "lucide-react";

function toInternationalPhone(phone: string): string {
  return `+91${phone.replace(/\D/g, "")}`;
}

export default function PhoneLoginPage() {
  const { loginWithOtp, session, hydrated } = useAccount();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPhoneValid = phone.length === 10 && /^[6-9]/.test(phone);

  const getSafeNextTarget = () => {
    if (typeof window === "undefined") return "/";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/phone-login") && !next.startsWith("/login")
      ? next
      : "/";
  };

 useEffect(() => {
  if (hydrated && session) {
    router.replace(getSafeNextTarget());
  }
}, [session, hydrated, router]);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    const result = await sendOtpWithBackend(toInternationalPhone(phone));
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSent(true);
    setOtpValues(Array(6).fill(""));
    setMessage("OTP sent successfully to your mobile number.");
  };

  const getOtpString = () => otpValues.join("");

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const otpString = getOtpString();
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    const result = await loginWithOtp(toInternationalPhone(phone), otpString);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || "Invalid or expired OTP.");
      return;
    }

   router.replace(getSafeNextTarget());
  };

  if (hydrated && session) {
    return null;
  }

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

  useEffect(() => {
    if (sent) {
      window.setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [sent]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <Container className="py-10">
        <form
          onSubmit={sent ? verifyOtp : sendOtp}
          className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"
        >
          <h1 className="text-2xl font-black">Mobile login</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Enter your mobile number to receive an OTP.
          </p>

          {!sent ? (
            <label className="mt-6 block text-xs font-bold">
              Mobile number
              <div className="mt-1 flex h-11 overflow-hidden rounded-xl border border-[var(--border)]">
                <span className="flex items-center border-r border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  placeholder="10-digit number"
                  className="min-w-0 flex-1 px-3 text-sm outline-none bg-transparent"
                />
              </div>
            </label>
          ) : (
            <label className="mt-6 block text-xs font-bold">
              6-digit OTP
              <div className="mt-2 flex justify-between gap-2">
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
                    className="h-11 w-11 text-center rounded-xl border border-[var(--border)] bg-[#F8FAF8] text-lg font-bold outline-none focus:border-[var(--primary)] focus:bg-white"
                  />
                ))}
              </div>
            </label>
          )}

          {message && (
            <p className="mt-3 text-xs font-bold text-[var(--success)]">{message}</p>
          )}
          {error && (
            <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (!sent && !isPhoneValid)}
            className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {sent ? "Verify OTP" : "Send OTP"}
          </button>

    
        </form>
      </Container>
    </div>
  );
}
