"use client";
import { useContext } from "react";
import { SellerContext } from "@/store/SellerProvider";
export function useSellers() { const value = useContext(SellerContext); if (!value) throw new Error("useSellers must be used inside SellerProvider"); return value; }
