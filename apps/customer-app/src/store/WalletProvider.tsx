"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WalletContextValue, WalletState, WalletTransaction } from "@/types/wallet";

export const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "bootkit_wallet_v1";

const initialSampleTransactions: WalletTransaction[] = [
  {
    id: "TXN_BK_982410",
    type: "CREDIT",
    amount: 500,
    note: "Added to BootKiT Wallet via UPI",
    paymentMethod: "UPI (Google Pay)",
    status: "SUCCESS",
    closingBalance: 500,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TXN_BK_749308",
    type: "DEBIT",
    amount: 150,
    note: "Paid for Order #BK749307666688",
    orderId: "BK749307666688",
    paymentMethod: "BootKiT Wallet",
    status: "SUCCESS",
    closingBalance: 350,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultWalletState: WalletState = {
  balance: 350,
  rewardPoints: 120,
  transactions: initialSampleTransactions,
};

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(defaultWalletState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<WalletState>;
        setWallet({
          balance: typeof parsed.balance === "number" ? parsed.balance : defaultWalletState.balance,
          rewardPoints: typeof parsed.rewardPoints === "number" ? parsed.rewardPoints : defaultWalletState.rewardPoints,
          transactions: Array.isArray(parsed.transactions) && parsed.transactions.length > 0
            ? parsed.transactions
            : defaultWalletState.transactions,
        });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {}
  }, [hydrated, wallet]);

  const addMoney = useCallback(
    (amount: number, note?: string, paymentMethod?: string): boolean => {
      if (amount <= 0) return false;
      const cleanAmount = Number(amount);
      const newBalance = wallet.balance + cleanAmount;
      const newTransaction: WalletTransaction = {
        id: `TXN_BK_${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
        type: "CREDIT",
        amount: cleanAmount,
        note: note || "Added to BootKiT Wallet",
        paymentMethod: paymentMethod || "UPI / Instant Transfer",
        status: "SUCCESS",
        closingBalance: newBalance,
        createdAt: new Date().toISOString(),
      };

      setWallet((prev) => ({
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      }));
      return true;
    },
    [wallet.balance],
  );

  const deductMoney = useCallback(
    (amount: number, note?: string, orderId?: string): boolean => {
      if (amount <= 0 || wallet.balance < amount) return false;
      const cleanAmount = Number(amount);
      const newBalance = wallet.balance - cleanAmount;
      const newTransaction: WalletTransaction = {
        id: `TXN_BK_${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
        type: "DEBIT",
        amount: cleanAmount,
        note: note || (orderId ? `Paid for Order #${orderId}` : "Wallet Payment"),
        orderId,
        paymentMethod: "BootKiT Wallet",
        status: "SUCCESS",
        closingBalance: newBalance,
        createdAt: new Date().toISOString(),
      };

      setWallet((prev) => ({
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      }));
      return true;
    },
    [wallet.balance],
  );

  const addReward = useCallback((points: number, note: string) => {
    const newTransaction: WalletTransaction = {
      id: `TXN_BK_${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
      type: "REWARD",
      amount: 0,
      points,
      note: note || "Cashback Reward Earned",
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
    };

    setWallet((prev) => ({
      ...prev,
      rewardPoints: prev.rewardPoints + points,
      transactions: [newTransaction, ...prev.transactions],
    }));
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      balance: wallet.balance,
      rewardPoints: wallet.rewardPoints,
      transactions: wallet.transactions,
      addMoney,
      deductMoney,
      addReward,
    }),
    [addMoney, addReward, deductMoney, wallet.balance, wallet.rewardPoints, wallet.transactions],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
