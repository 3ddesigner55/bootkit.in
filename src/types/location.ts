export type DeliveryArea = {
  id: string;
  city: string;
  area: string;
  pincode: string;
  deliveryMinutes: string;
  deliveryFee: number;
  minimumOrder: number;
  active: boolean;
};

export type SelectedLocation = {
  city: string;
  area: string;
  pincode: string;
  deliveryMinutes: string;
};

export type LocationContextValue = {
  location: SelectedLocation | null;
  hydrated: boolean;
  modalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  selectLocation: (area: DeliveryArea) => void;
  clearLocation: () => void;
};