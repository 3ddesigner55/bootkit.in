"use client";
import { useContext } from "react";
import { DeliveryPartnerContext } from "@/store/DeliveryPartnerProvider";
export function useDeliveryPartners() { const value = useContext(DeliveryPartnerContext); if (!value) throw new Error("useDeliveryPartners must be used inside DeliveryPartnerProvider"); return value; }
