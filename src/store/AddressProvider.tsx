"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AddressContextValue,
  AddressInput,
  SavedAddress,
} from "@/types/address";

export const AddressContext =
  createContext<AddressContextValue | null>(null);

const STORAGE_KEY = "bootkit_saved_addresses_v1";

function isSavedAddress(value: unknown): value is SavedAddress {
  if (!value || typeof value !== "object") return false;

  const address = value as Partial<SavedAddress>;

  return (
    typeof address.id === "string" &&
    typeof address.fullName === "string" &&
    typeof address.phone === "string" &&
    typeof address.houseNumber === "string" &&
    typeof address.street === "string" &&
    typeof address.city === "string" &&
    typeof address.state === "string" &&
    typeof address.pincode === "string" &&
    typeof address.isDefault === "boolean"
  );
}

function readStoredAddresses(): SavedAddress[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    const normalizedAddresses = parsed
  .filter(isSavedAddress)
  .map((address) => ({
    ...address,
    area:
      typeof address.area === "string"
        ? address.area
        : "",
    landmark:
      typeof address.landmark === "string"
        ? address.landmark
        : "",
  }));

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedAddresses)
    );

    return normalizedAddresses;
  } catch {
    return [];
  }
}

function createAddressId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `address_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export default function AddressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(
    []
  );

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAddresses(readStoredAddresses());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(addresses)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [addresses, hydrated]);

  const addAddress = useCallback(
    (input: AddressInput) => {
      const now = new Date().toISOString();

     const newAddress: SavedAddress = {
  ...input,
  area: input.area?.trim() ?? "",
  landmark: input.landmark?.trim() ?? "",
  id: createAddressId(),
  isDefault: addresses.length === 0 || input.isDefault,
  createdAt: now,
  updatedAt: now,
};

      setAddresses((current) => {
        const shouldBeDefault =
          current.length === 0 || newAddress.isDefault;

        const updatedCurrent = shouldBeDefault
          ? current.map((address) => ({
              ...address,
              isDefault: false,
            }))
          : current;

        return [
          {
            ...newAddress,
            isDefault: shouldBeDefault,
          },
          ...updatedCurrent,
        ];
      });

      return newAddress;
    },
    [addresses.length]
  );

  const updateAddress = useCallback(
    (
      addressId: string,
      input: AddressInput
    ) => {
      setAddresses((current) => {
        const shouldSetDefault = input.isDefault;

        return current.map((address) => {
          if (address.id === addressId) {
       return {
  ...address,
  ...input,
  area: input.area?.trim() ?? "",
  landmark: input.landmark?.trim() ?? "",
  isDefault: shouldSetDefault,
  updatedAt: new Date().toISOString(),
};
          }

          if (shouldSetDefault) {
            return {
              ...address,
              isDefault: false,
            };
          }

          return address;
        });
      });
    },
    []
  );

  const removeAddress = useCallback(
    (addressId: string) => {
      setAddresses((current) => {
        const addressToRemove = current.find(
          (address) => address.id === addressId
        );

        const remaining = current.filter(
          (address) => address.id !== addressId
        );

        if (
          addressToRemove?.isDefault &&
          remaining.length > 0
        ) {
          return remaining.map((address, index) => ({
            ...address,
            isDefault: index === 0,
          }));
        }

        return remaining;
      });
    },
    []
  );

  const setDefaultAddress = useCallback(
    (addressId: string) => {
      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault: address.id === addressId,
          updatedAt:
            address.id === addressId
              ? new Date().toISOString()
              : address.updatedAt,
        }))
      );
    },
    []
  );

  const getAddressById = useCallback(
    (addressId: string) =>
      addresses.find(
        (address) => address.id === addressId
      ),
    [addresses]
  );

  const clearAddresses = useCallback(() => {
    setAddresses([]);
  }, []);

  const defaultAddress = useMemo(
    () =>
      addresses.find((address) => address.isDefault) ??
      addresses[0] ??
      null,
    [addresses]
  );

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses,
      hydrated,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      getAddressById,
      clearAddresses,
    }),
    [
      addresses,
      hydrated,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      getAddressById,
      clearAddresses,
    ]
  );

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
}