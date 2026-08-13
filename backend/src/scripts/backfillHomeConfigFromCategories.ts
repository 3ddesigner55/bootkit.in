import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import Product from '../models/product.model';
import Store from '../models/store.model';

export type BackfillOptions = {
  execute?: boolean;
  allowProduction?: boolean;
};

export async function runHomeConfigBackfill(options: BackfillOptions = {}) {
  const isExecute = options.execute === true;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from environment.');
  }

  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  console.log(`\n======================================================`);
  console.log(`HOME CONFIGURATION BACKFILL SCRIPT`);
  console.log(`Mode: ${isExecute ? 'EXECUTE' : 'DRY RUN (Read Only)'}`);
  console.log(`Target Database: ${primaryDb}`);
  console.log(`======================================================\n`);

  if (isExecute && !options.allowProduction) {
    throw new Error(
      'SAFETY LOCK: Explicit confirmation (allowProduction: true) is required to execute on production databases.',
    );
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri, { dbName: primaryDb });
  }

  console.log('--- Step 1: Scanning existing categories and banners for placements ---');
  const [
    heroBanners,
    groceryCats,
    householdCats,
    snacksCats,
    beautyCats,
    sweetToothProds,
    featuredStores,
  ] = await Promise.all([
    HeroBanner.find({ active: true, showOnHome: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Category.find({ homeSection: 'groceryKitchen', active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Category.find({ homeSection: 'householdEssentials', active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Category.find({ homeSection: 'snacksDrinks', active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Category.find({ homeSection: 'beautyPersonalCare', active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Product.find({ homeSection: 'sweetTooth', active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    Store.find({ featured: true, active: true, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
  ]);

  console.log(`Found:`);
  console.log(` - Hero Banners: ${heroBanners.length}`);
  console.log(` - Grocery & Kitchen Categories: ${groceryCats.length}`);
  console.log(` - Household Essentials Categories: ${householdCats.length}`);
  console.log(` - Snacks & Drinks Categories: ${snacksCats.length}`);
  console.log(` - Beauty & Personal Care Categories: ${beautyCats.length}`);
  console.log(` - Sweet Tooth Products: ${sweetToothProds.length}`);
  console.log(` - Featured Stores: ${featuredStores.length}`);

  const plannedSections: HomeConfigSection[] = [
    {
      sectionId: 'hero_main',
      type: 'hero_banner',
      title: 'Top Offers & Promos',
      active: true,
      sortOrder: 1,
      itemMode: 'MANUAL',
      items: heroBanners.map((b, idx) => ({
        itemType: 'banner',
        referenceId: b._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'collection',
        targetValue: b.linkUrl || '',
      })),
    },
    {
      sectionId: 'best_sellers_home',
      type: 'best_sellers',
      title: 'Best Sellers',
      active: true,
      sortOrder: 2,
      itemMode: 'MANUAL',
      items: groceryCats.slice(0, 6).map((c, idx) => ({
        itemType: 'category',
        referenceId: c._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'category',
        targetValue: `/category/${c.slug}`,
      })),
    },
    {
      sectionId: 'grocery_kitchen',
      type: 'category_cards',
      title: 'Grocery & Kitchen',
      active: true,
      sortOrder: 3,
      itemMode: 'MANUAL',
      items: groceryCats.map((c, idx) => ({
        itemType: 'category',
        referenceId: c._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'category',
        targetValue: `/category/${c.slug}`,
      })),
    },
    {
      sectionId: 'snacks_drinks',
      type: 'category_cards',
      title: 'Snacks & Drinks',
      active: true,
      sortOrder: 4,
      itemMode: 'MANUAL',
      items: snacksCats.map((c, idx) => ({
        itemType: 'category',
        referenceId: c._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'category',
        targetValue: `/category/${c.slug}`,
      })),
    },
    {
      sectionId: 'sweet_tooth',
      type: 'product_grid',
      title: 'Sweet Tooth',
      active: true,
      sortOrder: 5,
      itemMode: 'MANUAL',
      items: sweetToothProds.map((p, idx) => ({
        itemType: 'product',
        referenceId: p._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'product',
        targetValue: `/product/${p.slug}`,
      })),
    },
    {
      sectionId: 'household_essentials',
      type: 'category_cards',
      title: 'Household Essentials',
      active: true,
      sortOrder: 6,
      itemMode: 'MANUAL',
      items: householdCats.map((c, idx) => ({
        itemType: 'category',
        referenceId: c._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'category',
        targetValue: `/category/${c.slug}`,
      })),
    },
    {
      sectionId: 'beauty_personal_care',
      type: 'category_cards',
      title: 'Beauty & Personal Care',
      active: true,
      sortOrder: 7,
      itemMode: 'MANUAL',
      items: beautyCats.map((c, idx) => ({
        itemType: 'category',
        referenceId: c._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'category',
        targetValue: `/category/${c.slug}`,
      })),
    },
    {
      sectionId: 'store_spotlight',
      type: 'store_spotlight',
      title: 'Store Spotlight',
      active: true,
      sortOrder: 8,
      itemMode: 'MANUAL',
      items: featuredStores.map((s, idx) => ({
        itemType: 'store',
        referenceId: s._id as any,
        sortOrder: idx + 1,
        active: true,
        targetType: 'internal_page',
        targetValue: `/store/${s.slug}`,
      })),
    },
  ];

  console.log('\n--- Step 2: Planned Home Configuration Sections ---');
  for (const s of plannedSections) {
    console.log(` - Section: "${s.sectionId}" (${s.type}), Items Count: ${s.items.length}`);
  }

  if (isExecute) {
    console.log('\n--- Step 3: Writing Backfilled Home Configuration Draft ---');
    let draft = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
    if (draft) {
      draft.sections = plannedSections;
      await draft.save();
    } else {
      await HomeConfig.create({
        schemaVersion: '1.0.0',
        configVersion: 1,
        scopeType: 'GLOBAL',
        status: 'DRAFT',
        sections: plannedSections,
      });
    }
    console.log('✅ Backfill successfully saved into DRAFT HomeConfig.');
  } else {
    console.log('\n[DRY RUN] Backfill would write 8 sections into HomeConfig (Draft mode) without modifying Category Master.');
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const allowProd = args.includes('--allow-production');

  runHomeConfigBackfill({ execute: isExecute, allowProduction: allowProd })
    .then(() => {
      console.log('\nDone.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nBackfill script failed:', err.message);
      process.exit(1);
    });
}
