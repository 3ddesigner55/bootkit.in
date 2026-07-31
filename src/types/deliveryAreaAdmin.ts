import type { DeliveryArea } from "@/types/location";

export type DeliveryAreaInput = Omit<
  DeliveryArea,
  "id"
> & {
  id?: string;
};

export type DeliveryAreaAdminContextValue = {
  deliveryAreas: DeliveryArea[];
  activeDeliveryAreas: DeliveryArea[];
  serviceablePincodes: string[];
  hydrated: boolean;

  getDeliveryAreaById: (
    areaId: string
  ) => DeliveryArea | undefined;

  getDeliveryAreasByPincode: (
    pincode: string,
    includeInactive?: boolean
  ) => DeliveryArea[];

  isServiceablePincode: (
    pincode: string
  ) => boolean;

  addDeliveryArea: (
    input: DeliveryAreaInput
  ) => DeliveryArea;

  updateDeliveryArea: (
    areaId: string,
    updates: Partial<DeliveryArea>
  ) => DeliveryArea | null;

  removeDeliveryArea: (
    areaId: string
  ) => void;

  toggleDeliveryAreaActive: (
    areaId: string
  ) => void;

  resetDeliveryAreas: () => void;
};