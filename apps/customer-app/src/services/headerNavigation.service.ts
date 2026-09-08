import { getApiBaseUrl } from './api';

export type HeaderNavigationItem = {
  slug: string;
  label: string;
  icon: string;
  active: boolean;
  sortOrder: number;
};

type HeaderNavigationApiResponse = {
  success: boolean;
  message?: string;
  data?: HeaderNavigationItem[];
};

async function readResponse(
  response: Response,
): Promise<HeaderNavigationItem[]> {
  const payload = (await response
    .json()
    .catch(() => null)) as HeaderNavigationApiResponse | null;

  if (
    !response.ok ||
    !payload?.success ||
    !Array.isArray(payload.data)
  ) {
    return [];
  }

  return payload.data;
}

let cachedHeaderNavigation: { data: HeaderNavigationItem[]; timestamp: number } | null = null;
let pendingHeaderNavigationRequest: Promise<HeaderNavigationItem[]> | null = null;
const HEADER_NAV_TTL_MS = 60 * 1000; // 60s

export async function getHeaderNavigation(): Promise<HeaderNavigationItem[]> {
  if (
    cachedHeaderNavigation &&
    Date.now() - cachedHeaderNavigation.timestamp < HEADER_NAV_TTL_MS
  ) {
    return cachedHeaderNavigation.data;
  }

  if (pendingHeaderNavigationRequest) {
    return pendingHeaderNavigationRequest;
  }

  pendingHeaderNavigationRequest = (async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/header-navigation`,
        {
          method: 'GET',
          cache: 'default',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const items = await readResponse(response);
      cachedHeaderNavigation = { data: items, timestamp: Date.now() };
      return items;
    } catch {
      return [];
    } finally {
      pendingHeaderNavigationRequest = null;
    }
  })();

  return pendingHeaderNavigationRequest;
}
