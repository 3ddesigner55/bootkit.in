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
  SavedAddressType,
} from "@/types/address";
import { useAccount } from "@/hooks/useAccount";

export const AddressContext = createContext<AddressContextValue | null>(null);

function mapBackendToSavedAddress(addr: any): SavedAddress {
  const parts = (addr.addressLine2 || "").split(" ; ");
  const street = parts[0] || "";
  const area = parts[1] || "";

  return {
    id: addr._id || addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    houseNumber: addr.addressLine1,
    street: street,
    area: area,
    landmark: addr.landmark || "",
    city: addr.city,
    state: addr.state,
    pincode: addr.postalCode,
    addressType: addr.label as SavedAddressType,
    isDefault: addr.isDefault,
    recipientType: addr.recipientType,
    googleMapsLink: addr.googleMapsLink,
    latitude: addr.latitude,
    longitude: addr.longitude,
    createdAt: addr.createdAt || new Date().toISOString(),
    updatedAt: addr.updatedAt || new Date().toISOString(),
  };
}

function mapSavedAddressToBackendInput(input: any, isUpdate = false) {
  const combinedLine2 = [
    (input.street || "").trim(),
    (input.area || "").trim()
  ].filter(Boolean).join(" ; ");

  const payload: any = {
    label: input.addressType || "Home",
    fullName: input.fullName,
    phone: input.phone,
    addressLine1: input.houseNumber,
    addressLine2: combinedLine2,
    landmark: input.landmark || "",
    city: input.city,
    state: input.state,
    country: "India",
    postalCode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    recipientType: input.recipientType || "MYSELF",
    googleMapsLink: input.googleMapsLink || "",
  };

  if (!isUpdate) {
    payload.isDefault = input.isDefault || false;
  }

  return payload;
}

export default function AddressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, hydrated: accountHydrated } = useAccount();

  const refreshAddresses = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/addresses`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch addresses from server");
      }
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const mapped = payload.data.map(mapBackendToSavedAddress);
        setAddresses(mapped);
      } else {
        throw new Error(payload.message || "Failed to load addresses");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching addresses.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  // Sync addresses on authentication hydration or logout/switch with request-generation guard
  useEffect(() => {
    if (!accountHydrated) return;

    if (!session) {
      setAddresses([]);
      setHydrated(true);
      setLoading(false);
      return;
    }

    setAddresses([]);
    setHydrated(false);

    let active = true;

    const initLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/addresses`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch addresses from server");
        }
        const payload = await res.json();
        if (!active) return;

        if (payload.success && Array.isArray(payload.data)) {
          const mapped = payload.data.map(mapBackendToSavedAddress);
          setAddresses(mapped);
          setHydrated(true);
        } else {
          throw new Error(payload.message || "Failed to load addresses");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "An error occurred while fetching addresses.");
        setHydrated(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initLoad();

    return () => {
      active = false;
    };
  }, [accountHydrated, session?.userId, session?.accessToken]);

  const addAddress = useCallback(
    async (input: AddressInput) => {
      if (!session?.accessToken) {
        throw new Error("User is not authenticated.");
      }
      setLoading(true);
      setError(null);
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const backendInput = mapSavedAddressToBackendInput(input, false);
        const res = await fetch(`${baseUrl}/addresses`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendInput),
        });

        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to create address.");
        }

        const newAddress = mapBackendToSavedAddress(payload.data);

        setAddresses((current) => {
          const updatedCurrent = newAddress.isDefault
            ? current.map((addr) => ({ ...addr, isDefault: false }))
            : current;
          return [newAddress, ...updatedCurrent];
        });

        return newAddress;
      } catch (err: any) {
        setError(err.message || "Failed to add address.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken]
  );

  const updateAddress = useCallback(
    async (addressId: string, input: AddressInput) => {
      if (!session?.accessToken) {
        throw new Error("User is not authenticated.");
      }
      setLoading(true);
      setError(null);
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const backendInput = mapSavedAddressToBackendInput(input, true);
        const res = await fetch(`${baseUrl}/addresses/${addressId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendInput),
        });

        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to update address.");
        }

        const updatedAddress = mapBackendToSavedAddress(payload.data);

        setAddresses((current) =>
          current.map((addr) => (addr.id === addressId ? updatedAddress : addr))
        );
      } catch (err: any) {
        setError(err.message || "Failed to update address.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      if (!session?.accessToken) {
        throw new Error("User is not authenticated.");
      }
      setLoading(true);
      setError(null);

      let previousAddresses: SavedAddress[] = [];
      setAddresses((current) => {
        previousAddresses = current;
        return current.filter((addr) => addr.id !== addressId);
      });

      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/addresses/${addressId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to delete address.");
        }

        await refreshAddresses();
      } catch (err: any) {
        setAddresses(previousAddresses);
        setError(err.message || "Failed to delete address.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken, refreshAddresses]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!session?.accessToken) {
        throw new Error("User is not authenticated.");
      }
      setLoading(true);
      setError(null);

      let previousAddresses: SavedAddress[] = [];
      setAddresses((current) => {
        previousAddresses = current;
        return current.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        }));
      });

      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/addresses/${addressId}/default`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to set default address.");
        }

        const updatedDefault = mapBackendToSavedAddress(payload.data);
        setAddresses((current) =>
          current.map((addr) => (addr.id === addressId ? updatedDefault : { ...addr, isDefault: false }))
        );
      } catch (err: any) {
        setAddresses(previousAddresses);
        setError(err.message || "Failed to set default address.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken]
  );

  const getAddressById = useCallback(
    (addressId: string) => addresses.find((address) => address.id === addressId),
    [addresses]
  );

  const clearAddresses = useCallback(() => {
    setAddresses([]);
  }, []);

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses,
      hydrated,
      loading,
      error,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      getAddressById,
      clearAddresses,
      refreshAddresses,
    }),
    [
      addresses,
      hydrated,
      loading,
      error,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      getAddressById,
      clearAddresses,
      refreshAddresses,
    ]
  );

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
}