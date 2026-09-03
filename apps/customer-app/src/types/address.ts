export type SavedAddressType = "Home" | "Office" | "Other";

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: SavedAddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  recipientType?: 'MYSELF' | 'SOMEONE_ELSE';
  googleMapsLink?: string;
  latitude?: number;
  longitude?: number;
};

export type AddressInput = Omit<
  SavedAddress,
  "id" | "createdAt" | "updatedAt"
>;

export type AddressContextValue = {
  addresses: SavedAddress[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  defaultAddress: SavedAddress | null;

  addAddress: (address: AddressInput) => Promise<SavedAddress>;

  updateAddress: (
    addressId: string,
    address: AddressInput
  ) => Promise<void>;

  removeAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;

  getAddressById: (
    addressId: string
  ) => SavedAddress | undefined;

  clearAddresses: () => void;
  refreshAddresses: () => Promise<void>;
};