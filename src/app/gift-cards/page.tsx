"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { useWallet } from "@/hooks/useWallet";

export default function GiftCardsPage() {
  const router = useRouter();
  const { addMoney, balance } = useWallet();

  const [cardCode, setCardCode] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState<{
    amount: number;
    code: string;
  } | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/account");
  };

  // Format 16 digits as 4 groups of 4 digits: "XXXX XXXX XXXX XXXX"
  const handleCodeChange = (value: string) => {
    const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 16);
    const chunks = raw.match(/.{1,4}/g) || [];
    setCardCode(chunks.join(" "));
    setError("");
  };

  // Format 6 digits numeric PIN
  const handlePinChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 6);
    setPin(raw);
    setError("");
  };

  const rawCode = cardCode.replace(/\s+/g, "");

  const handleClaim = () => {
    if (rawCode.length !== 16) {
      setError("Please enter a valid 16-digit gift card code.");
      return;
    }
    if (pin.length !== 6) {
      setError("Please enter the 6-digit gift card PIN.");
      return;
    }

    setError("");
    setIsClaiming(true);

    setTimeout(() => {
      // Reward amount default ₹500
      const amountClaimed = 500;
      const maskedCode = `•••• ${rawCode.slice(-4)}`;
      
      const success = addMoney(
        amountClaimed,
        `Claimed Gift Card (${maskedCode})`,
        "BootKiT Gift Card"
      );

      setIsClaiming(false);

      if (success) {
        setClaimedData({
          amount: amountClaimed,
          code: maskedCode,
        });
        setCardCode("");
        setPin("");
      } else {
        setError("Failed to claim gift card. Please check code & PIN.");
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] pb-24 text-[var(--text-primary)]">
      {/* Floating Back Button (No Heavy Header) */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="fixed left-4 top-3 z-[80] flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition hover:scale-105 active:scale-95"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Top Banner with Warm Brown / Golden-Bronze Gradient matching Account Page Style */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-b-[32px] bg-gradient-to-b from-[#E8C48E] via-[#F4E3D0] to-[#F8FAF8] px-5 pb-8 pt-10 text-center">
        {/* Gift Logo Badge */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#92400E] shadow-[0_8px_24px_rgba(146,64,14,0.16)] border border-[#FDE68A]/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E]">
            <Gift size={32} strokeWidth={2.4} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#B45309] text-white shadow-sm">
            <Sparkles size={13} />
          </span>
        </div>

        <h1 className="mt-3 text-sm font-extrabold uppercase tracking-wider text-[#78350F]">
          BootKiT Gift Card
        </h1>
        <p className="mt-1 text-2xl font-black tracking-tight text-[#451A03]">
          Redeem & Claim Balance
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold text-[#451A03] backdrop-blur-sm">
            <ShieldCheck size={13} className="text-[#92400E]" />
            Direct Wallet Credit • 100% Secure
          </span>
        </div>
      </section>

      {/* Main Container */}
      <main className="relative z-10 mx-auto -mt-2 max-w-md space-y-5 px-4">
        {/* Claim Card Section */}
        <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">
              16-digit code & 6-digit PIN to claim
            </h2>
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
              Enter your gift voucher credentials to add balance directly to your BootKiT Wallet.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {/* Input 1: 16-Digit Gift Card Code */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                Gift Card Code (16-Digit)
              </label>
              <div className="relative mt-1.5 flex items-center rounded-2xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 transition focus-within:border-[#92400E] focus-within:bg-white">
                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="XXXX XXXX XXXX XXXX"
                  autoCapitalize="characters"
                  maxLength={19}
                  className="w-full bg-transparent text-sm font-black tracking-wider text-[var(--text-primary)] outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400"
                />
                {cardCode ? (
                  <button
                    type="button"
                    onClick={() => setCardCode("")}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-[var(--text-muted)]">
                <span>Enter 16 characters code</span>
                <span>{rawCode.length}/16</span>
              </div>
            </div>

            {/* Input 2: 6-Digit PIN */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                6-Digit PIN
              </label>
              <div className="relative mt-1.5 flex items-center rounded-2xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 transition focus-within:border-[#92400E] focus-within:bg-white">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  className="w-full bg-transparent text-sm font-black tracking-widest text-[var(--text-primary)] outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-[var(--text-muted)]">
                <span>Security PIN received with gift card</span>
                <span>{pin.length}/6</span>
              </div>
            </div>

            {/* Error message */}
            {error ? (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-600">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Claim Action Button */}
            <button
              type="button"
              disabled={isClaiming || rawCode.length !== 16 || pin.length !== 6}
              onClick={handleClaim}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#92400E] text-sm font-black text-white shadow-[0_4px_14px_rgba(146,64,14,0.25)] transition active:scale-[0.98] disabled:opacity-40"
            >
              <Gift size={18} />
              {isClaiming ? "Claiming..." : "Claim Gift Card"}
            </button>
          </div>
        </section>

        {/* Current Wallet Balance Preview Card */}
        <section className="flex items-center justify-between rounded-[22px] bg-white p-4 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
              <Wallet size={20} />
            </span>
            <div>
              <span className="block text-xs font-bold text-[var(--text-muted)]">
                BootKiT Wallet Balance
              </span>
              <span className="text-base font-black text-[var(--text-primary)]">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <Link
            href="/wallet"
            className="rounded-xl bg-[#EFF8F1] px-3 py-1.5 text-xs font-black text-[var(--primary)] transition hover:bg-[#E2F3E5]"
          >
            View Wallet
          </Link>
        </section>

        {/* Important Notes Section (NOTE - 2, 3 Points) */}
        <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EEF2EF]">
            <AlertCircle size={18} className="text-[#92400E]" />
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
              Important Notes
            </h3>
          </div>

          <ul className="mt-4 space-y-3.5 text-xs font-medium text-[var(--text-secondary)]">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[11px] font-black text-[#92400E]">
                1
              </span>
              <span>
                <b className="text-[var(--text-primary)]">Instant Wallet Credit:</b> Once claimed, the gift card balance is immediately credited to your BootKiT Wallet and can be used to pay for any order.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[11px] font-black text-[#92400E]">
                2
              </span>
              <span>
                <b className="text-[var(--text-primary)]">1 Year Validity:</b> Gift cards are valid for 12 months from the date of issuance and cannot be refunded or transferred to bank accounts.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[11px] font-black text-[#92400E]">
                3
              </span>
              <span>
                <b className="text-[var(--text-primary)]">Security & Single-Use:</b> Keep your 16-digit code and 6-digit PIN confidential. Each gift card can be claimed only once.
              </span>
            </li>
          </ul>
        </section>
      </main>

      {/* Success Modal on Claim */}
      {claimedData ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setClaimedData(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white p-6 shadow-2xl text-center animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="mt-4 text-xl font-black text-[var(--text-primary)]">
              Gift Card Claimed!
            </h3>
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
              Code {claimedData.code} redeemed successfully
            </p>

            <div className="my-5 rounded-2xl bg-[#FEF3C7]/40 p-4 border border-[#FDE68A]">
              <span className="text-xs font-bold text-[#92400E]">
                Amount Credited
              </span>
              <p className="text-3xl font-black text-[#92400E] mt-0.5">
                +₹{claimedData.amount.toFixed(2)}
              </p>
              <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full inline-block mt-1.5">
                ● Added to BootKiT Wallet
              </span>
            </div>

            <div className="space-y-2">
              <Link
                href="/wallet"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white shadow-md transition active:scale-95"
              >
                <Wallet size={18} />
                View Updated Wallet Balance
              </Link>
              <button
                type="button"
                onClick={() => setClaimedData(null)}
                className="flex h-11 w-full items-center justify-center rounded-2xl bg-gray-100 text-xs font-black text-gray-700 hover:bg-gray-200 transition active:scale-95"
              >
                Claim Another Card
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
