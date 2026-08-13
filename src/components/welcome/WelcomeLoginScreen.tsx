"use client";
import { useAccount } from "@/hooks/useAccount";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtpWithBackend } from "@/services/auth.service";
import Logo from "@/components/ui/Logo";



const promotionalSlides = [
  {
    image: "/images/banners/banner1.png",
    alt: "Fresh groceries delivered quickly",
  },
  {
    image: "/images/banners/banner2.png",
    alt: "Daily essentials for every home",
  },
  {
    image: "/images/banners/banner3.png",
    alt: "Local grocery delivery from BootKiT",
  },
];

export default function WelcomeLoginScreen() {
  const { session, hydrated } = useAccount();
  const [visible, setVisible] = useState(true);
  const router = useRouter();
const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
 

  useEffect(() => {
    
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % promotionalSlides.length);
    }, 4_000);

    return () => window.clearInterval(timer);
  }, []);
  if (!hydrated || session || !visible) {
  return null;
}

  if (!visible) {
    return null;
  }

  const continueToLogin = async () => {
  if (phone.length !== 10 || !/^[6-9]/.test(phone)) {
    setError("Please enter a valid 10-digit mobile number.");
    return;
  }

  setError("");
  setIsSubmitting(true);

  const internationalPhone = `+91${phone}`;
  const result = await sendOtpWithBackend(internationalPhone);

  setIsSubmitting(false);

  if (!result.success) {
    setError(result.message);
    return;
  }

  window.sessionStorage.setItem(
    "bootkit_otp_phone",
    internationalPhone,
  );

  window.sessionStorage.setItem(
    "bootkit_otp_resend_seconds",
    String(result.data?.resendAvailableInSeconds ?? 30),
  );

  setVisible(false);
router.push("/otp-verification");

  router.push("/otp-verification");
};

  return (
    <section className="fixed inset-0 z-[120] flex min-h-[100dvh] flex-col bg-[var(--background)] lg:hidden">
      <div className="absolute inset-x-0 top-0 h-[68dvh] overflow-hidden">
        {promotionalSlides.map((slide, index) => (
          <Image
            key={slide.image}
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 0px"
            className={`object-cover transition-opacity duration-500 ${
              activeSlide === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {promotionalSlides.map((slide, index) => (
            <span
              key={slide.image}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-0 z-10 flex items-center justify-end px-4 py-4">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-sm font-black text-[var(--text-secondary)]"
        >
          Skip
        </button>
      </div>

      <div className="relative mt-auto rounded-t-3xl bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
        <label className="block text-xs text-center font-bold text-[var(--text-primary)]">
          <h2 className="mb-5 text-center text-2xl font-black">
  Log in or Sign up
</h2>
          <div className="mt-5 flex h-12 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <span className="flex items-center gap-2 border-r border-[var(--border)] bg-[var(--surface-soft)] px-3">
  <span className="text-xl">🇮🇳</span>
  <span className="text-sm font-bold text-[var(--text-primary)]">
    +91
  </span>
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
              className="min-w-0 flex-1 px-4 text-sm font-medium outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
        </label>

        {error ? (
          <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>
        ) : null}

       <button
  type="button"
  onClick={continueToLogin}
  disabled={isSubmitting}
  className="mt-5 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:opacity-70"
>
  {isSubmitting ? "Sending OTP..." : "Continue"}
</button>

        <div className="mt-7 flex justify-center">
          <Logo />
        </div>
      </div>

     
    </section>
  );
}
