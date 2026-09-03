export type TargetType =
  | 'product'
  | 'category'
  | 'collection'
  | 'search'
  | 'offer'
  | 'internal_page';

const DANGEROUS_SCHEMES = [
  'javascript:',
  'data:',
  'file:',
  'intent:',
  'vbscript:',
  'blob:',
];

const FORBIDDEN_ROUTE_PREFIXES = [
  '/admin',
  '/owner',
  '/seller',
  '/api',
];

const APPROVED_INTERNAL_PAGES = new Set([
  'cart',
  'account',
  'account/addresses',
  'account/settings',
  'orders',
  'wishlist',
  'categories',
  'offers',
  'wallet',
  'help',
  'contact',
  'about',
  'terms',
  'privacy-policy',
  'shipping-policy',
  'refund-policy',
  'careers',
  'delivery-areas',
  'delivery-partner',
  'notifications',
  'products',
]);


function sanitizeSlug(slug: string): string {
  return slug
    .replace(/[\\/]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

export function resolveSafeInternalUrl(
  targetType?: string,
  targetValue?: string,
): string | null {
  if (!targetValue || typeof targetValue !== 'string') {
    return null;
  }

  let raw = targetValue.trim();

  // Try decoding to check for double-encoded or hidden protocol payloads
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const normalized = raw.toLowerCase().trim();

  // 1. Defense: Reject dangerous URL schemes
  for (const scheme of DANGEROUS_SCHEMES) {
    if (normalized.startsWith(scheme)) {
      return null;
    }
  }

  // 2. Defense: Reject external URLs
  if (/^https?:\/\//i.test(normalized)) {
    return null;
  }

  // 3. Defense: Reject forbidden management and backend API routes
  for (const prefix of FORBIDDEN_ROUTE_PREFIXES) {
    if (normalized.startsWith(prefix) || normalized === prefix.replace(/^\//, '')) {
      return null;
    }
  }

  // 4. Target Mapping with strict parameter encoding
  switch (targetType) {
    case 'product': {
      const cleanSlug = sanitizeSlug(raw.replace(/^\/product\//, ''));
      if (!cleanSlug) return '/products';
      return `/product/${encodeURIComponent(cleanSlug)}`;
    }

    case 'category': {
      const cleanSlug = sanitizeSlug(raw.replace(/^\/category\//, ''));
      if (!cleanSlug) return '/categories';
      return `/category/${encodeURIComponent(cleanSlug)}`;
    }

    case 'collection': {
      const cleanSlug = sanitizeSlug(raw.replace(/^\/collection\//, ''));
      if (!cleanSlug) return '/categories';
      return `/category/${encodeURIComponent(cleanSlug)}`;
    }

    case 'search': {
      const query = raw.replace(/^\/search\?q=/, '').trim();
      return `/search?q=${encodeURIComponent(query)}`;
    }

    case 'offer':
      return '/offers';

    case 'internal_page':
    default: {
      const cleanPage = raw.replace(/^\/+/, '').replace(/\/+$/, '').trim().toLowerCase();
      if (APPROVED_INTERNAL_PAGES.has(cleanPage)) {
        return `/${cleanPage}`;
      }
      return null;
    }
  }
}
