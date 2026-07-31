import type { DeliveryArea } from "@/types/location";

const SARDARSHAHAR_PINCODE = "331403";

const wardAreas: DeliveryArea[] = Array.from(
  { length: 55 },
  (_, index) => {
    const wardNumber = index + 1;

    return {
      id: `area-331403-ward-${String(wardNumber).padStart(2, "0")}`,
      city: "Sardarshahar",
      area: `Ward No. ${wardNumber}`,
      pincode: SARDARSHAHAR_PINCODE,
      deliveryMinutes: "15–25 min",
      deliveryFee: 29,
      minimumOrder: 99,
      active: true,
    };
  }
);

const commonAreas: DeliveryArea[] = [
  {
    id: "area-331403-main-market",
    city: "Sardarshahar",
    area: "Main Market",
    pincode: SARDARSHAHAR_PINCODE,
    deliveryMinutes: "10–20 min",
    deliveryFee: 29,
    minimumOrder: 99,
    active: true,
  },
  {
    id: "area-331403-bus-stand",
    city: "Sardarshahar",
    area: "Bus Stand Area",
    pincode: SARDARSHAHAR_PINCODE,
    deliveryMinutes: "10–20 min",
    deliveryFee: 29,
    minimumOrder: 99,
    active: true,
  },
  {
    id: "area-331403-railway-station",
    city: "Sardarshahar",
    area: "Railway Station Area",
    pincode: SARDARSHAHAR_PINCODE,
    deliveryMinutes: "15–25 min",
    deliveryFee: 29,
    minimumOrder: 99,
    active: true,
  },
  {
    id: "area-331403-industrial-area",
    city: "Sardarshahar",
    area: "Industrial Area",
    pincode: SARDARSHAHAR_PINCODE,
    deliveryMinutes: "20–30 min",
    deliveryFee: 39,
    minimumOrder: 149,
    active: true,
  },
  {
    id: "area-331403-other",
    city: "Sardarshahar",
    area: "Other Area / Colony",
    pincode: SARDARSHAHAR_PINCODE,
    deliveryMinutes: "20–30 min",
    deliveryFee: 39,
    minimumOrder: 149,
    active: true,
  },
];

export const deliveryAreas: DeliveryArea[] = [
  ...commonAreas,
  ...wardAreas,
];

export function getActiveDeliveryAreas() {
  return deliveryAreas
    .filter((area) => area.active)
    .sort((a, b) =>
      a.area.localeCompare(b.area, "en", {
        numeric: true,
      })
    );
}

export function getDeliveryAreaByPincode(pincode: string) {
  return deliveryAreas.find(
    (area) =>
      area.active &&
      area.pincode === pincode
  );
}

export function getDeliveryAreasByPincode(pincode: string) {
  return getActiveDeliveryAreas().filter(
    (area) => area.pincode === pincode
  );
}

export function isServiceablePincode(pincode: string) {
  return deliveryAreas.some(
    (area) =>
      area.active &&
      area.pincode === pincode
  );
}