import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import Product from '../models/product.model';
import Store from '../models/store.model';

const GROCERY_KITCHEN_SLUGS = [
  'fruits-vegetables',
  'atta-rice-dal',
  'dairy-breakfast',
  'bakery-biscuits',
];

const HOUSEHOLD_ESSENTIALS_SLUGS = [
  'home-care',
  'cleaning-supplies',
  'laundry-care',
  'home-essentials',
  'storage-organizers',
  'paper-products',
  'kitchen-cleaning',
  'bathroom-care',
  'pooja-essentials',
];

const SNACKS_DRINKS_SLUGS = [
  'snacks-munchies',
  'cold-drinks-juices',
  'cold-drinks',
  'tea-coffee',
  'juices',
  'energy-drinks',
  'chips-namkeen',
  'biscuits',
  'chocolates',
  'ice-cream',
];

const BEAUTY_PERSONAL_CARE_SLUGS = [
  'personal-care',
  'baby-care',
  'skin-care',
  'hair-care',
  'bath-body',
  'makeup',
  'oral-care',
  'feminine-care',
  'health-care',
];

function getHomeCategorySection(slugs: string[]) {
  return Category.find({
    slug: { $in: slugs },
    active: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1, sortOrder: 1 })
    .lean();
}

function getHomeProductSection(homeSection: string) {
  return Product.find({
    homeSection,
    active: true,
    showOnHome: true,
    deletedAt: null,
  })
    .sort({ displayOrder: 1 })
    .lean();
}

export async function getHomeData() {
  const now = new Date();

  const [
    heroBanners,
    bestSellers,
    groceryKitchen,
    householdEssentials,
    sweetTooth,
    featuredThisWeek,
    snacksDrinks,
    beautyPersonalCare,
    storeSpotlight,
  ] = await Promise.all([
    HeroBanner.find({
      active: true,
      showOnHome: true,
      deletedAt: null,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ displayOrder: 1 })
      .lean(),
    Product.find({
      featured: true,
      active: true,
      showOnHome: true,
      deletedAt: null,
    })
      .sort({ displayOrder: 1 })
      .lean(),
    getHomeCategorySection(GROCERY_KITCHEN_SLUGS),
    getHomeCategorySection(HOUSEHOLD_ESSENTIALS_SLUGS),
    getHomeProductSection('sweetTooth'),
    getHomeProductSection('featuredThisWeek'),
    getHomeCategorySection(SNACKS_DRINKS_SLUGS),
    getHomeCategorySection(BEAUTY_PERSONAL_CARE_SLUGS),
    Store.find({ featured: true, active: true, deletedAt: null })
      .sort({ displayOrder: 1 })
      .lean(),
  ]);

  return {
    heroBanners,
    bestSellers,
    groceryKitchen,
    householdEssentials,
    sweetTooth,
    featuredThisWeek,
    snacksDrinks,
    beautyPersonalCare,
    storeSpotlight,
  };
}
