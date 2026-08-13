export type MapboxLocationSuggestion = {
  id: string;
  label: string;
  description?: string;
  latitude: number;
  longitude: number;
};

type MapboxFeature = {
  id?: unknown;
  name?: unknown;
  place_formatted?: unknown;
  geometry?: {
    coordinates?: unknown;
  };
  properties?: {
    mapbox_id?: unknown;
    full_address?: unknown;
    name?: unknown;
    name_preferred?: unknown;
    place_formatted?: unknown;
    coordinates?: {
      latitude?: unknown;
      longitude?: unknown;
    };
  };
};

type MapboxResponse = {
  features?: unknown;
};

function toSuggestion(
  feature: MapboxFeature,
): MapboxLocationSuggestion | null {
  const id =
    typeof feature.properties?.mapbox_id === "string"
      ? feature.properties.mapbox_id
      : typeof feature.id === "string"
        ? feature.id
        : null;

  const label =
    typeof feature.properties?.name_preferred === "string"
      ? feature.properties.name_preferred
      : typeof feature.properties?.name === "string"
        ? feature.properties.name
        : typeof feature.name === "string"
          ? feature.name
          : null;

  const description =
    typeof feature.properties?.full_address === "string"
      ? feature.properties.full_address
      : typeof feature.properties?.place_formatted === "string"
        ? feature.properties.place_formatted
        : typeof feature.place_formatted === "string"
          ? feature.place_formatted
          : undefined;

  const geometryCoordinates = feature.geometry?.coordinates;

  const longitude =
    Array.isArray(geometryCoordinates) &&
    typeof geometryCoordinates[0] === "number"
      ? geometryCoordinates[0]
      : typeof feature.properties?.coordinates?.longitude === "number"
        ? feature.properties.coordinates.longitude
        : null;

  const latitude =
    Array.isArray(geometryCoordinates) &&
    typeof geometryCoordinates[1] === "number"
      ? geometryCoordinates[1]
      : typeof feature.properties?.coordinates?.latitude === "number"
        ? feature.properties.coordinates.latitude
        : null;

  if (
    !id ||
    !label ||
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  return {
    id,
    label,
    description,
    latitude,
    longitude,
  };
}

export async function searchMapboxLocations(
  query: string,
  signal: AbortSignal
): Promise<MapboxLocationSuggestion[]> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    return [];
  }

  const parameters = new URLSearchParams({
  q: query,
  access_token: accessToken,
  autocomplete: "true",
  limit: "5",
  country: "in",
  language: "en",
});
  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/forward?${parameters}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Mapbox location search failed.");
  }

  const data = (await response.json()) as MapboxResponse;

  return Array.isArray(data.features)
    ? data.features
        .map((feature) => toSuggestion(feature as MapboxFeature))
        .filter((feature): feature is MapboxLocationSuggestion => feature !== null)
    : [];
}

export async function reverseGeocodeMapboxLocation(
  latitude: number,
  longitude: number,
  signal: AbortSignal
): Promise<MapboxLocationSuggestion | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    return null;
  }

  const parameters = new URLSearchParams({
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    access_token: accessToken,
  });
  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/reverse?${parameters}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Mapbox reverse geocoding failed.");
  }

  const data = (await response.json()) as MapboxResponse;

  if (!Array.isArray(data.features)) {
    return null;
  }

  for (const feature of data.features) {
    const suggestion = toSuggestion(feature as MapboxFeature);

    if (suggestion) {
      return suggestion;
    }
  }

  return null;
}
export type MapboxDeliveryLocation = {
  latitude: number;
  longitude: number;
  pincode: string;
  city: string;
  area: string;
  address: string;
};

type MapboxContextValue = {
  name?: unknown;
};

type MapboxDeliveryFeature = {
  properties?: {
    feature_type?: unknown;
    name?: unknown;
    full_address?: unknown;
    place_formatted?: unknown;
    context?: {
      postcode?: MapboxContextValue;
      place?: MapboxContextValue;
      locality?: MapboxContextValue;
      neighborhood?: MapboxContextValue;
      district?: MapboxContextValue;
    };
  };
};

function readContextName(value?: MapboxContextValue): string {
  return typeof value?.name === "string" ? value.name : "";
}

export async function resolveMapboxDeliveryLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<MapboxDeliveryLocation> {
  const accessToken =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    throw new Error("Mapbox access token is not configured.");
  }

  const parameters = new URLSearchParams({
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    country: "in",
    language: "en",
    worldview: "in",
    access_token: accessToken,
  });

  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/reverse?${parameters}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to identify this delivery location.");
  }

  const data = (await response.json()) as MapboxResponse;

  if (!Array.isArray(data.features) || data.features.length === 0) {
    throw new Error("No address was found at this location.");
  }

  const feature = data.features[0] as MapboxDeliveryFeature;
  const properties = feature.properties;
  const context = properties?.context;

  const postcodeText = [
    readContextName(context?.postcode),
    properties?.feature_type === "postcode" &&
    typeof properties.name === "string"
      ? properties.name
      : "",
    typeof properties?.full_address === "string"
      ? properties.full_address
      : "",
    typeof properties?.place_formatted === "string"
      ? properties.place_formatted
      : "",
  ].join(" ");

  const pincode = postcodeText.match(/\b\d{6}\b/)?.[0] ?? "";

  if (!pincode) {
    throw new Error(
      "Pincode was not found. Please move the map pin or try current location.",
    );
  }

  const city =
    readContextName(context?.place) ||
    readContextName(context?.locality) ||
    readContextName(context?.district) ||
    "Selected city";

  const area =
    readContextName(context?.neighborhood) ||
    readContextName(context?.locality) ||
    readContextName(context?.place) ||
    city;

  const address =
    typeof properties?.full_address === "string"
      ? properties.full_address
      : typeof properties?.place_formatted === "string"
        ? properties.place_formatted
        : typeof properties?.name === "string"
          ? properties.name
          : `${area}, ${city} - ${pincode}`;

  return {
    latitude,
    longitude,
    pincode,
    city,
    area,
    address,
  };
}