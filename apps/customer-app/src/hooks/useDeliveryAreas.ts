"use client";

import { useState } from "react";
import { deliveryAreas as defaultAreas } from "@/data/deliveryAreas";
import type { DeliveryArea } from "@/types/location";

export function useDeliveryAreas() {
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>(defaultAreas);
  const [hydrated, setHydrated] = useState(true);

  const activeDeliveryAreas = deliveryAreas.filter((a) => a.active);
  const serviceablePincodes = Array.from(new Set(activeDeliveryAreas.map((a) => a.pincode)));

  const getDeliveryAreasByPincode = (pincode: string) => {
    return deliveryAreas.filter((a) => a.pincode === pincode && a.active);
  };

  const isServiceablePincode = (pincode: string) => {
    return deliveryAreas.some((a) => a.pincode === pincode && a.active);
  };

  return {
    deliveryAreas,
    activeDeliveryAreas,
    serviceablePincodes,
    hydrated,
    getDeliveryAreasByPincode,
    isServiceablePincode,
  };
}
