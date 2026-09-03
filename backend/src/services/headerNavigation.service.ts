import HeaderNavigation from '../models/headerNavigation.model';

export type HeaderNavigationItemInput = {
  slug: string;
  label: string;
  icon: string;
  active: boolean;
  sortOrder: number;
};

const DEFAULT_ITEMS: HeaderNavigationItemInput[] = [
  {
    slug: 'beauty',
    label: 'Beauty',
    icon: '/icons/categories/Beauty.svg',
    active: true,
    sortOrder: 1,
  },
  {
    slug: 'electronics',
    label: 'Electronics',
    icon: '/icons/categories/electronics.svg',
    active: true,
    sortOrder: 2,
  },
  {
    slug: 'pharmacy',
    label: 'Pharmacy',
    icon: '/icons/categories/pharmacy.svg',
    active: true,
    sortOrder: 3,
  },
  {
    slug: 'decor',
    label: 'Decor',
    icon: '/icons/categories/decor.svg',
    active: true,
    sortOrder: 4,
  },
  {
    slug: 'kids',
    label: 'Kids',
    icon: '/icons/categories/kids.svg',
    active: true,
    sortOrder: 5,
  },
  {
    slug: 'gifting',
    label: 'Gifting',
    icon: '/icons/categories/gifting.svg',
    active: true,
    sortOrder: 6,
  },
];

async function ensureHeaderNavigation() {
  return HeaderNavigation.findOneAndUpdate(
    { key: 'customer-header' },
    {
      $setOnInsert: {
        key: 'customer-header',
        items: DEFAULT_ITEMS,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function getPublicHeaderNavigation() {
  const navigation = await ensureHeaderNavigation();

  return [...navigation.items]
    .filter((item) => item.active)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function getAdminHeaderNavigation() {
  const navigation = await ensureHeaderNavigation();

  return [...navigation.items].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
}

export async function updateHeaderNavigation(
  items: HeaderNavigationItemInput[],
  userId: string,
) {
  const normalizedItems = items.map((item, index) => ({
    slug: item.slug.trim().toLowerCase(),
    label: item.label.trim(),
    icon: item.icon.trim(),
    active: item.active,
    sortOrder: index + 1,
  }));

  const navigation = await HeaderNavigation.findOneAndUpdate(
    { key: 'customer-header' },
    {
      $set: {
        items: normalizedItems,
        updatedBy: userId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return [...navigation.items].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
}