"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Coins,
  Copy,
  Check,
  History,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { useWallet } from "@/hooks/useWallet";
import type { WalletTransaction } from "@/types/wallet";

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

export default function WalletPage() {
  const router = useRouter();
  const { balance, rewardPoints, transactions, addMoney } = useWallet();

  const [customAmount, setCustomAmount] = useState<string>("500");
  const [filter, setFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/account");
  };

  const handleAddMoney = (amountToAdd?: number) => {
    const val = amountToAdd ?? Number(customAmount);
    if (!val || isNaN(val) || val <= 0) return;

    setIsAdding(true);
    setTimeout(() => {
      const ok = addMoney(val, `Added ₹${val} to BootKiT Wallet via UPI`, "UPI / Instant Transfer");
      setIsAdding(false);
      if (ok) {
        setSuccessToast(`₹${val} added to your BootKiT Wallet successfully!`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    }, 400);
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "CREDIT") return tx.type === "CREDIT" || tx.type === "REWARD";
    if (filter === "DEBIT") return tx.type === "DEBIT";
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
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

      {/* Top Banner with Light Blue / Cyan Gradient matching Account Page */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-b-[32px] bg-gradient-to-b from-[#64F5E4] via-[#AEEFE6] to-[#F8FAF8] px-5 pb-8 pt-10 text-center">
        {/* Money Logo Badge */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#059669] shadow-[0_8px_24px_rgba(15,77,38,0.14)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
            <Wallet size={32} strokeWidth={2.4} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#059669] text-white shadow-sm">
            <Coins size={13} />
          </span>
        </div>

        <h1 className="mt-3 text-sm font-extrabold uppercase tracking-wider text-black/70">
          BootKiT Wallet
        </h1>

        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-2xl font-black text-black">₹</span>
          <span className="text-4xl font-black tracking-tight text-black">
            {balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold text-black backdrop-blur-sm">
            <ShieldCheck size={13} className="text-[#059669]" />
            100% Safe & Instant 1-Click Pay
          </span>
          {rewardPoints > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-900 backdrop-blur-sm">
              <Sparkles size={12} className="text-amber-600" />
              {rewardPoints} Reward Points
            </span>
          ) : null}
        </div>
      </section>

      {/* Main Container */}
      <main className="relative z-10 mx-auto -mt-2 max-w-md space-y-5 px-4">
        {/* Toast alert on add money */}
        {successToast ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#ECFDF5] p-3.5 text-xs font-bold text-[#065F46] shadow-sm border border-[#A7F3D0] animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 size={18} className="shrink-0 text-[#059669]" />
            <span>{successToast}</span>
          </div>
        ) : null}

        {/* Add Money Section */}
        <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[var(--text-primary)]">
              Add Money to Wallet
            </h2>
            <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-md">
              Instant Credit
            </span>
          </div>

          <div className="mt-4">
            <div className="relative flex items-center rounded-2xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 transition focus-within:border-[var(--primary)] focus-within:bg-white">
              <span className="text-xl font-black text-[var(--text-primary)]">
                ₹
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-transparent px-3 text-lg font-black text-[var(--text-primary)] outline-none placeholder:text-gray-400"
              />
              {customAmount ? (
                <button
                  type="button"
                  onClick={() => setCustomAmount("")}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {/* Quick preset chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = customAmount === String(amt);
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(String(amt))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition active:scale-95 ${
                      isSelected
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-[#F3F4F6] text-[var(--text-secondary)] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    +₹{amt}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isAdding || !Number(customAmount)}
              onClick={() => handleAddMoney()}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-sm font-black text-white shadow-[0_4px_14px_rgba(15,77,38,0.2)] transition active:scale-[0.98] disabled:opacity-50"
            >
              <Plus size={18} />
              {isAdding ? "Adding..." : `Proceed to Add ₹${customAmount || 0}`}
            </button>
          </div>
        </section>

        {/* Transactions History Section */}
        <section className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_5px_18px_rgba(25,50,34,0.06)]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-[var(--primary)]" />
              <h2 className="text-base font-black text-[var(--text-primary)]">
                Transactions History
              </h2>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {transactions.length} total
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 border-b border-[#EEF2EF] pb-3">
            {(["ALL", "CREDIT", "DEBIT"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  filter === f
                    ? "bg-[#EDF9F0] text-[var(--primary)] font-black"
                    : "text-[var(--text-muted)] hover:bg-[#F3F4F6]"
                }`}
              >
                {f === "ALL" ? "All" : f === "CREDIT" ? "Money Added" : "Orders"}
              </button>
            ))}
          </div>

          {/* Transaction Items */}
          <div className="divide-y divide-[#EEF2EF]">
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs font-bold text-[var(--text-muted)]">
                  No transactions found in this filter.
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isCredit = tx.type === "CREDIT" || tx.type === "REWARD";
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="group flex w-full items-center justify-between py-3.5 text-left transition hover:bg-[#F9FAFB] active:bg-[#F3F4F6]"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isCredit
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[var(--text-primary)]">
                          {tx.note}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      <div>
                        <p
                          className={`text-sm font-black ${
                            isCredit ? "text-[#059669]" : "text-[#1F2937]"
                          }`}
                        >
                          {isCredit ? "+" : "-"}₹
                          {tx.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <span className="text-[9px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded">
                          {tx.status || "Completed"}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-400 group-hover:translate-x-0.5 transition"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Transaction Details Popup Modal ("click after pop page show details") */}
      {selectedTx ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EF]">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                  <CheckCircle2 size={16} />
                </span>
                <span className="text-sm font-black text-[var(--text-primary)]">
                  Transaction Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                aria-label="Close details"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Amount Banner */}
            <div className="my-5 rounded-2xl bg-[#F8FAF8] p-4 text-center border border-[#E5E7EB]">
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {selectedTx.type === "CREDIT" || selectedTx.type === "REWARD"
                  ? "Amount Added"
                  : "Amount Paid"}
              </span>
              <p
                className={`mt-1 text-3xl font-black ${
                  selectedTx.type === "CREDIT" || selectedTx.type === "REWARD"
                    ? "text-[#059669]"
                    : "text-[#1F2937]"
                }`}
              >
                {selectedTx.type === "CREDIT" || selectedTx.type === "REWARD"
                  ? "+"
                  : "-"}
                ₹
                {selectedTx.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span className="mt-1.5 inline-block rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[10px] font-black text-[#059669]">
                ● {selectedTx.status || "Payment Successful"}
              </span>
            </div>

            {/* Key-Value Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#EEF2EF]">
                <span className="font-semibold text-[var(--text-muted)]">
                  Transaction ID
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {selectedTx.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedTx.id)}
                    className="text-[var(--primary)] hover:opacity-80"
                    title="Copy Transaction ID"
                  >
                    {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#EEF2EF]">
                <span className="font-semibold text-[var(--text-muted)]">
                  Date & Time
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatDate(selectedTx.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#EEF2EF]">
                <span className="font-semibold text-[var(--text-muted)]">
                  Payment Source
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {selectedTx.paymentMethod || "BootKiT Wallet"}
                </span>
              </div>

              {selectedTx.orderId ? (
                <div className="flex items-center justify-between py-1 border-b border-[#EEF2EF]">
                  <span className="font-semibold text-[var(--text-muted)]">
                    Order Reference
                  </span>
                  <Link
                    href={`/orders/${selectedTx.orderId}`}
                    className="font-bold text-[var(--primary)] underline"
                  >
                    #{selectedTx.orderId}
                  </Link>
                </div>
              ) : null}

              {selectedTx.closingBalance !== undefined ? (
                <div className="flex items-center justify-between py-1 border-b border-[#EEF2EF]">
                  <span className="font-semibold text-[var(--text-muted)]">
                    Updated Wallet Balance
                  </span>
                  <span className="font-black text-[var(--text-primary)]">
                    ₹
                    {selectedTx.closingBalance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ) : null}

              <div className="flex items-start justify-between py-1">
                <span className="font-semibold text-[var(--text-muted)]">
                  Description
                </span>
                <span className="max-w-[200px] text-right font-bold text-[var(--text-primary)]">
                  {selectedTx.note}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full rounded-2xl bg-[var(--primary)] py-3 text-center text-xs font-black text-white shadow-md transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

