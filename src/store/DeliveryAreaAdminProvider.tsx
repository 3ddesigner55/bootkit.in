"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deliveryAreas as defaultDeliveryAreas,
} from "@/data/deliveryAreas";
import type { DeliveryArea } from "@/types/location";
import type {
  DeliveryAreaAdminContextValue,
  DeliveryAreaInput,
} from "@/types/deliveryAreaAdmin";

export const DeliveryAreaAdminContext =
  createContext<DeliveryAreaAdminContextValue | null>(
    null
  );

const STORAGE_KEY =
  "bootkit_admin_delivery_areas_v2";

function cloneDefaultDeliveryAreas(): DeliveryArea[] {
  return defaultDeliveryAreas.map((area) => ({
    ...area,
  }));
}

function isDeliveryArea(
  value: unknown
): value is DeliveryArea {
  if (!value || typeof value !== "object") {
    return false;
  }

  const area = value as Partial<DeliveryArea>;

  return (
    typeof area.id === "string" &&
    typeof area.city === "string" &&
    typeof area.area === "string" &&
    typeof area.pincode === "string" &&
    typeof area.deliveryMinutes === "string" &&
    typeof area.deliveryFee === "number" &&
    typeof area.minimumOrder === "number" &&
    typeof area.active === "boolean"
  );
}

function readStoredDeliveryAreas(): DeliveryArea[] {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return cloneDefaultDeliveryAreas();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return cloneDefaultDeliveryAreas();
    }

    const validAreas =
      parsed.filter(isDeliveryArea);

    if (validAreas.length === 0) {
      return cloneDefaultDeliveryAreas();
    }

    return validAreas;
  } catch {
    return cloneDefaultDeliveryAreas();
  }
}

function createAreaId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `area-${crypto.randomUUID()}`;
  }

  return `area-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function sanitizeIdPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueAreaId(
  input: DeliveryAreaInput,
  areas: DeliveryArea[]
) {
  const baseId = `area-${sanitizeIdPart(
    input.pincode
  )}-${sanitizeIdPart(input.area)}`;

  let id = baseId;
  let counter = 2;

  while (
    areas.some((area) => area.id === id)
  ) {
    id = `${baseId}-${counter}`;
    counter += 1;
  }

  return id || createAreaId();
}

function sanitizeDeliveryArea(
  area: DeliveryArea
): DeliveryArea {
  return {
    ...area,
    city: area.city.trim(),
    area: area.area.trim(),
    pincode: area.pincode
      .replace(/\D/g, "")
      .slice(0, 6),
    deliveryMinutes:
      area.deliveryMinutes.trim() ||
      "15–25 min",
    deliveryFee: Math.max(
      Number(area.deliveryFee) || 0,
      0
    ),
    minimumOrder: Math.max(
      Number(area.minimumOrder) || 0,
      0
    ),
  };
}

function sortDeliveryAreas(
  areas: DeliveryArea[]
) {
  return [...areas].sort((a, b) => {
    const pincodeCompare =
      a.pincode.localeCompare(b.pincode);

    if (pincodeCompare !== 0) {
      return pincodeCompare;
    }

    return a.area.localeCompare(
      b.area,
      "en",
      {
        numeric: true,
      }
    );
  });
}

export default function DeliveryAreaAdminProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    deliveryAreas,
    setDeliveryAreas,
  ] = useState<DeliveryArea[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    setDeliveryAreas(
      readStoredDeliveryAreas()
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(deliveryAreas)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [deliveryAreas, hydrated]);

  const activeDeliveryAreas = useMemo(
    () =>
      sortDeliveryAreas(
        deliveryAreas.filter(
          (area) => area.active
        )
      ),
    [deliveryAreas]
  );

  const serviceablePincodes = useMemo(
    () =>
      Array.from(
        new Set(
          activeDeliveryAreas.map(
            (area) => area.pincode
          )
        )
      ).sort(),
    [activeDeliveryAreas]
  );

  const getDeliveryAreaById =
    useCallback(
      (areaId: string) =>
        deliveryAreas.find(
          (area) => area.id === areaId
        ),
      [deliveryAreas]
    );

  const getDeliveryAreasByPincode =
    useCallback(
      (
        pincode: string,
        includeInactive = false
      ) => {
        const normalizedPincode =
          pincode.replace(/\D/g, "");

        return sortDeliveryAreas(
          deliveryAreas.filter(
            (area) =>
              area.pincode ===
                normalizedPincode &&
              (includeInactive ||
                area.active)
          )
        );
      },
      [deliveryAreas]
    );

  const isServiceablePincode =
    useCallback(
      (pincode: string) =>
        deliveryAreas.some(
          (area) =>
            area.active &&
            area.pincode ===
              pincode.replace(/\D/g, "")
        ),
      [deliveryAreas]
    );

  const addDeliveryArea = useCallback(
    (input: DeliveryAreaInput) => {
      let createdArea:
        | DeliveryArea
        | null = null;

      setDeliveryAreas((current) => {
        const id =
          input.id?.trim() ||
          createUniqueAreaId(
            input,
            current
          );

        createdArea =
          sanitizeDeliveryArea({
            ...input,
            id,
          } as DeliveryArea);

        return [
          createdArea,
          ...current.filter(
            (area) => area.id !== id
          ),
        ];
      });

      if (!createdArea) {
        throw new Error(
          "Delivery area could not be created."
        );
      }

      return createdArea;
    },
    []
  );

  const updateDeliveryArea =
    useCallback(
      (
        areaId: string,
        updates: Partial<DeliveryArea>
      ) => {
        let updatedArea:
          | DeliveryArea
          | null = null;

        setDeliveryAreas((current) =>
          current.map((area) => {
            if (area.id !== areaId) {
              return area;
            }

            updatedArea =
              sanitizeDeliveryArea({
                ...area,
                ...updates,
                id: area.id,
              });

            return updatedArea;
          })
        );

        return updatedArea;
      },
      []
    );

  const removeDeliveryArea =
    useCallback((areaId: string) => {
      setDeliveryAreas((current) =>
        current.filter(
          (area) => area.id !== areaId
        )
      );
    }, []);

  const toggleDeliveryAreaActive =
    useCallback((areaId: string) => {
      setDeliveryAreas((current) =>
        current.map((area) =>
          area.id === areaId
            ? {
                ...area,
                active: !area.active,
              }
            : area
        )
      );
    }, []);

  const resetDeliveryAreas =
    useCallback(() => {
      setDeliveryAreas(
        cloneDefaultDeliveryAreas()
      );
    }, []);

  const value =
    useMemo<DeliveryAreaAdminContextValue>(
      () => ({
        deliveryAreas,
        activeDeliveryAreas,
        serviceablePincodes,
        hydrated,
        getDeliveryAreaById,
        getDeliveryAreasByPincode,
        isServiceablePincode,
        addDeliveryArea,
        updateDeliveryArea,
        removeDeliveryArea,
        toggleDeliveryAreaActive,
        resetDeliveryAreas,
      }),
      [
        deliveryAreas,
        activeDeliveryAreas,
        serviceablePincodes,
        hydrated,
        getDeliveryAreaById,
        getDeliveryAreasByPincode,
        isServiceablePincode,
        addDeliveryArea,
        updateDeliveryArea,
        removeDeliveryArea,
        toggleDeliveryAreaActive,
        resetDeliveryAreas,
      ]
    );

  return (
    <DeliveryAreaAdminContext.Provider
      value={value}
    >
      {children}
    </DeliveryAreaAdminContext.Provider>
  );
}