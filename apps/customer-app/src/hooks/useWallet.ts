"use client";
import { useContext } from "react";
import { WalletContext } from "@/store/WalletProvider";
export function useWallet() { const value = useContext(WalletContext); if (!value) throw new Error("useWallet must be used inside WalletProvider"); return value; }
