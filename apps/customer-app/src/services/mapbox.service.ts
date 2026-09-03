export type MapboxLocationSuggestion = {
  id: string;
  label: string;
  description?: string;
};

type MapboxFeature = {
  id?: unknown;
  name?: unknown;
  place_formatted?: unknown;
  properties?: {
    full_address?: unknown;
    name_preferred?: unknown;
  };
};

type MapboxResponse = {
  features?: unknown;
};

function toSuggestion(feature: MapboxFeature): MapboxLocationSuggestion | null {
  const id = typeof feature.id === "string" ? feature.id : null;
  const label =
    typeof feature.properties?.name_preferred === "string"
      ? feature.properties.name_preferred
      : typeof feature.name === "string"
        ? feature.name
        : typeof feature.place_formatted === "string"
          ? feature.place_formatted
          : null;
  const description =
    typeof feature.properties?.full_address === "string"
      ? feature.properties.full_address
      : typeof feature.place_formatted === "string"
        ? feature.place_formatted
        : undefined;

  return id && label ? { id, label, description } : null;
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
