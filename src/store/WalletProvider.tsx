"use client";
import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { WalletState } from "@/types/wallet";
type Value = WalletState & { addReward: (points: number, note: string) => void };
export const WalletContext = createContext<Value | null>(null);
const empty: WalletState = { balance: 0, rewardPoints: 0, transactions: [] };
export default function WalletProvider({ children }: { children: ReactNode }) { const [wallet, setWallet] = useState<WalletState>(empty); useEffect(() => { try { setWallet(JSON.parse(localStorage.getItem("bootkit_wallet_v1") || "null") || empty); } catch {} }, []); useEffect(() => { localStorage.setItem("bootkit_wallet_v1", JSON.stringify(wallet)); }, [wallet]); const value = useMemo(() => ({ ...wallet, addReward: (points: number, note: string) => setWallet((current) => ({ ...current, rewardPoints: current.rewardPoints + points, transactions: [{ id: crypto.randomUUID(), type: "REWARD", amount: 0, points, note, createdAt: new Date().toISOString() }, ...current.transactions] })) }), [wallet]); return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>; }
