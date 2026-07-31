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
};

export type AddressInput = Omit<
  SavedAddress,
  "id" | "createdAt" | "updatedAt"
>;

export type AddressContextValue = {
  addresses: SavedAddress[];
  hydrated: boolean;
  defaultAddress: SavedAddress | null;

  addAddress: (address: AddressInput) => SavedAddress;

  updateAddress: (
    addressId: string,
    address: AddressInput
  ) => void;

  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;

  getAddressById: (
    addressId: string
  ) => SavedAddress | undefined;

  clearAddresses: () => void;
};