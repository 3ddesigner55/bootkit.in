import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import {
  createDefaultDraft,
  publishConfiguration,
  saveDraftConfig,
} from '../services/adminHomeConfig.service';
import { getHomeData as getCustomerHomeData } from '../services/home.service';
import { resolveSafeInternalUrl } from '../utils/navigationWhitelist';


function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runPhase3_1RendererTests() {
  const testDbName = 'bootkit_phase3_1_test_renderer';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, { dbName: testDbName });
  console.log(`✅ Connected safely to ISOLATED test database "${testDbName}" (Primary DB untouched).\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    const randomSuffix = () => Math.floor(10000000 + Math.random() * 90000000).toString();

    // ==========================================
    // TEST 1: NAVIGATION WHITELIST HARDENING
    // ==========================================
    console.log('--- Test 1: Navigation Whitelist Hardening & Route Validation ---');

    // 1a. Dangerous protocols rejected (returns null)
    assert(resolveSafeInternalUrl('product', 'javascript:alert(1)') === null, 'Rejects javascript: protocol injection (returns null)');
    assert(resolveSafeInternalUrl('category', 'data:text/html,<script>') === null, 'Rejects data: protocol injection (returns null)');
    assert(resolveSafeInternalUrl('internal_page', 'file:///etc/passwd') === null, 'Rejects file: protocol injection (returns null)');
    assert(resolveSafeInternalUrl('collection', 'https://malicious.com') === null, 'Rejects external HTTP(S) URLs (returns null)');

    // 1b. Forbidden management routes rejected (returns null)
    assert(resolveSafeInternalUrl('internal_page', '/admin') === null, 'Rejects /admin management route (returns null)');
    assert(resolveSafeInternalUrl('internal_page', '/owner') === null, 'Rejects /owner management route (returns null)');
    assert(resolveSafeInternalUrl('internal_page', '/seller') === null, 'Rejects /seller management route (returns null)');
    assert(resolveSafeInternalUrl('internal_page', '/api/users') === null, 'Rejects /api backend endpoints (returns null)');

    // 1c. Valid customer routes properly formatted
    assert(resolveSafeInternalUrl('product', 'fresh-milk') === '/product/fresh-milk', 'Maps product slug cleanly');
    assert(resolveSafeInternalUrl('category', 'dairy-bread-eggs') === '/category/dairy-bread-eggs', 'Maps category slug cleanly');
    assert(resolveSafeInternalUrl('search', 'organic ghee') === '/search?q=organic%20ghee', 'Maps search query cleanly with URI encoding');
    assert(resolveSafeInternalUrl('offer', 'diwali-deals') === '/offers', 'Maps offer to /offers');
    assert(resolveSafeInternalUrl('internal_page', 'cart') === '/cart', 'Maps approved internal page cart');
    assert(resolveSafeInternalUrl('internal_page', 'account') === '/account', 'Maps approved internal page account');
    assert(resolveSafeInternalUrl('internal_page', 'unapproved-page') === null, 'Rejects unapproved internal page name (returns null)');


    // ==========================================
    // SETUP FIXTURES FOR RENDERER DATA FLOW
    // ==========================================
    console.log('\n--- Test 2: Setup Distinct Multi-Section Entities ---');
    const adminUser = await User.create({
      email: `admin_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Admin',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'ADMIN',
      isActive: true,
    });

    const bannerHero = await HeroBanner.create({
      title: 'Distinct Hero Title 101',
      subtitle: 'Exclusive Hero Subtitle',
      desktopImage: '/images/banners/hero101.png',
      buttonLink: '/categories',
      displayOrder: 1,
      placement: 'hero',
      active: true,
      showOnHome: true,
    });

    const bannerFeatured = await HeroBanner.create({
      title: 'Distinct Featured Banner 202',
      desktopImage: '/images/banners/feat202.png',
      buttonLink: '/products',
      displayOrder: 1,
      placement: 'featuredThisWeek',
      active: true,
      showOnHome: true,
    });

    const catDairy = await Category.create({
      name: 'Distinct Dairy 303',
      slug: `dairy-${Date.now()}-${randomSuffix()}`,
      image: '/images/categories/dairy.png',
      active: true,
    });

    const catSnacks = await Category.create({
      name: 'Distinct Snacks 404',
      slug: `snacks-${Date.now()}-${randomSuffix()}`,
      image: '/images/categories/snacks.png',
      active: true,
    });

    const prod1 = await Product.create({
      name: 'Distinct Chocolate 505',
      slug: `choco-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-CH-${Date.now()}`,
      category: catSnacks._id,
      mrp: 100,
      sellingPrice: 85,
      stock: 30,
      active: true,
      thumbnail: '/images/products/choco.png',
    });

    const prod2 = await Product.create({
      name: 'Distinct Mithai 606',
      slug: `mithai-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-MI-${Date.now()}`,
      category: catSnacks._id,
      mrp: 250,
      sellingPrice: 200,
      stock: 15,
      active: true,
      thumbnail: '/images/products/mithai.png',
    });

    const prod3 = await Product.create({
      name: 'Distinct Snacks 3',
      slug: `snack3-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-SN3-${Date.now()}`,
      category: catSnacks._id,
      mrp: 50,
      sellingPrice: 40,
      stock: 50,
      active: true,
      thumbnail: '/images/products/snack3.png',
    });

    const prod4 = await Product.create({
      name: 'Distinct Snacks 4',
      slug: `snack4-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-SN4-${Date.now()}`,
      category: catSnacks._id,
      mrp: 60,
      sellingPrice: 50,
      stock: 50,
      active: true,
      thumbnail: '/images/products/snack4.png',
    });

    const dprod1 = await Product.create({
      name: 'Dairy Milk 1',
      slug: `d1-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-D1-${Date.now()}`,
      category: catDairy._id,
      mrp: 100,
      sellingPrice: 90,
      stock: 50,
      active: true,
      thumbnail: '/images/products/d1.png',
    });

    const dprod2 = await Product.create({
      name: 'Dairy Milk 2',
      slug: `d2-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-D2-${Date.now()}`,
      category: catDairy._id,
      mrp: 110,
      sellingPrice: 100,
      stock: 50,
      active: true,
      thumbnail: '/images/products/d2.png',
    });

    const dprod3 = await Product.create({
      name: 'Dairy Milk 3',
      slug: `d3-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-D3-${Date.now()}`,
      category: catDairy._id,
      mrp: 120,
      sellingPrice: 110,
      stock: 50,
      active: true,
      thumbnail: '/images/products/d3.png',
    });

    const dprod4 = await Product.create({
      name: 'Dairy Milk 4',
      slug: `d4-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-D4-${Date.now()}`,
      category: catDairy._id,
      mrp: 130,
      sellingPrice: 120,
      stock: 50,
      active: true,
      thumbnail: '/images/products/d4.png',
    });

    const store1 = await Store.create({
      name: 'Distinct Spotlight Store 707',
      slug: `store-707-${Date.now()}-${randomSuffix()}`,
      addressLine1: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560038',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: `98${randomSuffix()}`,
      active: true,
      isDefault: true,
    });

    await StoreInventory.create([
      { store: store1._id, product: prod1._id, sellingPrice: 150, mrp: 180, stock: 25, isAvailable: true, active: true },
      { store: store1._id, product: prod2._id, sellingPrice: 200, mrp: 240, stock: 30, isAvailable: true, active: true },
      { store: store1._id, product: prod3._id, sellingPrice: 40, mrp: 50, stock: 50, isAvailable: true, active: true },
      { store: store1._id, product: prod4._id, sellingPrice: 50, mrp: 60, stock: 50, isAvailable: true, active: true },
      { store: store1._id, product: dprod1._id, sellingPrice: 90, mrp: 100, stock: 50, isAvailable: true, active: true },
      { store: store1._id, product: dprod2._id, sellingPrice: 100, mrp: 110, stock: 50, isAvailable: true, active: true },
      { store: store1._id, product: dprod3._id, sellingPrice: 110, mrp: 120, stock: 50, isAvailable: true, active: true },
      { store: store1._id, product: dprod4._id, sellingPrice: 120, mrp: 130, stock: 50, isAvailable: true, active: true },
    ]);

    // ==========================================
    // TEST 3: EVERY RENDERER CONSUMES ITS DEDICATED SECTION DATA
    // ==========================================

    console.log('\n--- Test 3: Every Renderer Consumes Section Data (7 Distinct Sections) ---');

    const dynamicSections: HomeConfigSection[] = [
      {
        sectionId: 'sec_hero',
        type: 'hero_banner',
        title: 'Hero Banner Section',
        active: true,
        sortOrder: 1,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'banner',
            referenceId: bannerHero._id,
            sortOrder: 1,
            active: true,
            targetType: 'collection',
            targetValue: '/categories',
          },
        ],
      },
      {
        sectionId: 'sec_best_sellers',
        type: 'best_sellers',
        title: 'Best Sellers Section',
        active: true,
        sortOrder: 2,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'category',
            referenceId: catDairy._id,
            sortOrder: 1,
            active: true,
            targetType: 'category',
            targetValue: `/category/${catDairy.slug}`,
          },
        ],
      },
      {
        sectionId: 'sec_cat_cards',
        type: 'category_cards',
        title: 'Category Cards Section',
        active: true,
        sortOrder: 3,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'category',
            referenceId: catSnacks._id,
            sortOrder: 1,
            active: true,
            targetType: 'category',
            targetValue: `/category/${catSnacks.slug}`,
          },
        ],
      },
      {
        sectionId: 'sec_prod_grid',
        type: 'product_grid',
        title: 'Sweet Tooth Grid',
        active: true,
        sortOrder: 4,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'product',
            referenceId: prod1._id,
            sortOrder: 1,
            active: true,
            targetType: 'product',
            targetValue: `/product/${prod1.slug}`,
          },
          {
            itemType: 'product',
            referenceId: prod2._id,
            sortOrder: 2,
            active: true,
            targetType: 'product',
            targetValue: `/product/${prod2.slug}`,
          },
        ],
      },
      {
        sectionId: 'sec_feat_banner',
        type: 'featured_banner',
        title: 'Featured This Week Section',
        active: true,
        sortOrder: 5,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'banner',
            referenceId: bannerFeatured._id,
            sortOrder: 1,
            active: true,
            targetType: 'collection',
            targetValue: '/products',
          },
        ],
      },
      {
        sectionId: 'sec_store_spotlight',
        type: 'store_spotlight',
        title: 'Store Spotlight Section',
        active: true,
        sortOrder: 6,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'store',
            referenceId: store1._id,
            sortOrder: 1,
            active: true,
            targetType: 'internal_page',
            targetValue: `/category/${store1.slug}`,
          },
        ],
      },
    ];

    await saveDraftConfig(adminUser._id.toString(), 'ADMIN', {
      scopeType: 'GLOBAL',
      scopeId: null,
      sections: dynamicSections,
    });

    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    const resolvedHome = await getCustomerHomeData();
    assert(resolvedHome.config !== null, 'Published config resolved in customer home');
    assert(resolvedHome.config?.sections.length === 6, 'All 6 configured section types resolved');

    // Verify hero_banner receives banner data
    const heroSec = resolvedHome.config?.sections.find((s: any) => s.sectionId === 'sec_hero');
    assert(heroSec?.type === 'hero_banner', 'Hero section has type hero_banner');
    assert(heroSec?.items[0].referenceId.toString() === bannerHero._id.toString(), 'Hero receives exact banner reference');

    // Verify best_sellers receives category data
    const bestSec = resolvedHome.config?.sections.find((s: any) => s.sectionId === 'sec_best_sellers');
    assert(bestSec?.type === 'best_sellers', 'Best sellers section has type best_sellers');
    assert(bestSec?.items[0].name === 'Distinct Dairy 303', 'Best sellers receives exact category name');

    // Verify product_grid receives products and respects item order
    const prodSec = resolvedHome.config?.sections.find((s: any) => s.sectionId === 'sec_prod_grid');
    assert(prodSec?.items.length === 2, 'Product grid received 2 products');
    assert(prodSec?.items[0].name === 'Distinct Chocolate 505', 'Product grid item 1 matches sortOrder 1');
    assert(prodSec?.items[1].name === 'Distinct Mithai 606', 'Product grid item 2 matches sortOrder 2');

    // ==========================================
    // TEST 4: SECTION REORDERING VERIFICATION
    // ==========================================
    console.log('\n--- Test 4: Section Reordering via sortOrder ---');
    // Swap order: Make prod_grid sortOrder 1 and hero sortOrder 2
    const reorderedSections = dynamicSections.map((sec) => {
      if (sec.sectionId === 'sec_prod_grid') return { ...sec, sortOrder: 1 };
      if (sec.sectionId === 'sec_hero') return { ...sec, sortOrder: 2 };
      return sec;
    });

    await saveDraftConfig(adminUser._id.toString(), 'ADMIN', {
      scopeType: 'GLOBAL',
      scopeId: null,
      sections: reorderedSections,
    });
    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    const reorderedHome = await getCustomerHomeData();
    assert(
      reorderedHome.config?.sections[0].sectionId === 'sec_prod_grid',
      'First rendered section is now sec_prod_grid (sortOrder: 1)',
    );
    assert(
      reorderedHome.config?.sections[1].sectionId === 'sec_hero',
      'Second rendered section is now sec_hero (sortOrder: 2)',
    );

    console.log(`\n======================================================`);
    console.log(`ALL PHASE 3.1 RENDERER TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log(`======================================================\n`);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log('🧹 Cleaned up isolated test database.');
    await mongoose.disconnect();
  }
}

runPhase3_1RendererTests().catch((err) => {
  console.error('Phase 3.1 test execution failed:', err);
  process.exit(1);
});
