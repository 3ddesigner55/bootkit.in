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
import { validateSaveDraftInput } from '../validators/adminHomeConfig.validator';

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runPhase3WiringTests() {
  const testDbName = 'bootkit_phase3_test_dynamic_wiring';
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
    // SETUP TEST FIXTURES
    // ==========================================
    const adminUser = await User.create({
      email: `admin_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Admin',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'ADMIN',
      isActive: true,
    });

    const storeDelhi = await Store.create({
      name: 'Delhi Central Store',
      slug: `store-delhi-${Date.now()}-${randomSuffix()}`,
      addressLine1: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      latitude: 28.6139,
      longitude: 77.209,
      deliveryRadius: 5000,
      phone: `98${randomSuffix()}`,
      active: true,
      isDefault: true,
    });

    const storeMumbai = await Store.create({
      name: 'Mumbai Flagship Store',
      slug: `store-mumbai-${Date.now()}-${randomSuffix()}`,
      addressLine1: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      deliveryRadius: 5000,
      phone: `98${randomSuffix()}`,
      active: true,
      isDefault: false,
    });

    const testCategory = await Category.create({
      name: 'Organic Fruits',
      slug: `fruits-${Date.now()}-${randomSuffix()}`,
      active: true,
      homeSection: 'groceryKitchen',
    });

    const testProduct1 = await Product.create({
      name: 'Shimla Apple 1kg',
      slug: `shimla-apple-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-SH-${Date.now()}`,
      category: testCategory._id,
      mrp: 180,
      sellingPrice: 150,
      stock: 60,
      active: true,
    });

    const testProduct2 = await Product.create({
      name: 'Nagpur Orange 1kg',
      slug: `orange-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-OR-${Date.now()}`,
      category: testCategory._id,
      mrp: 120,
      sellingPrice: 90,
      stock: 40,
      active: true,
    });

    await StoreInventory.create({
      store: storeDelhi._id,
      product: testProduct1._id,
      mrp: 180,
      sellingPrice: 150,
      stock: 60,
      active: true,
    });

    await StoreInventory.create({
      store: storeDelhi._id,
      product: testProduct2._id,
      mrp: 120,
      sellingPrice: 90,
      stock: 40,
      active: true,
    });

    await StoreInventory.create({
      store: storeMumbai._id,
      product: testProduct1._id,
      mrp: 180,
      sellingPrice: 150,
      stock: 60,
      active: true,
    });

    await StoreInventory.create({
      store: storeMumbai._id,
      product: testProduct2._id,
      mrp: 120,
      sellingPrice: 90,
      stock: 40,
      active: true,
    });

    const testBanner = await HeroBanner.create({
      title: 'Summer Refreshers',
      desktopImage: '/images/banners/summer.png',
      mobileImage: '/images/banners/summer.png',
      buttonLink: '/collection/summer',
      displayOrder: 1,
      placement: 'hero',
      active: true,
      showOnHome: true,
    });

    // ==========================================
    // TEST 1: NO CONFIG -> LEGACY FALLBACK
    // ==========================================
    console.log('--- Test 1: No Config -> Legacy Fallback ---');
    const legacyHome = await getCustomerHomeData();
    assert(legacyHome.config === null, 'When no published HomeConfig exists, config is null');
    assert(Array.isArray(legacyHome.bestSellers), 'Legacy bestSellers key is returned');
    assert(Array.isArray(legacyHome.groceryKitchen), 'Legacy groceryKitchen key is returned');

    // ==========================================
    // TEST 2: GLOBAL CONFIG PUBLISH & RESOLUTION
    // ==========================================
    console.log('\n--- Test 2: GLOBAL Config Publish & Resolution ---');
    const globalDraft = await createDefaultDraft(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    const defaultSections = globalDraft.sections.map((s: any) => s.toObject ? s.toObject() : s);
    const validGlobalSections = defaultSections.map((sec: any) => {
      if (sec.sectionId === 'hero_main') {
        return {
          ...sec,
          type: 'hero_banner',
          title: 'Global Hero Banner',
          active: true,
          items: [
            {
              itemType: 'banner',
              referenceId: testBanner._id,
              sortOrder: 1,
              active: true,
              targetType: 'collection',
              targetValue: testBanner.buttonLink,
            },
          ],
        };
      }
      if (sec.sectionId === 'grocery_kitchen') {
        return {
          ...sec,
          type: 'product_grid',
          title: 'Fresh Fruits Grid',
          active: true,
          items: [
            {
              itemType: 'product',
              referenceId: testProduct1._id,
              sortOrder: 1,
              active: true,
              targetType: 'product',
              targetValue: `/product/${testProduct1.slug}`,
            },
          ],
        };
      }
      return {
        ...sec,
        active: false,
      };
    });

    await saveDraftConfig(adminUser._id.toString(), 'ADMIN', {
      scopeType: 'GLOBAL',
      scopeId: null,
      sections: validGlobalSections,
    });

    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    const globalHomeData = await getCustomerHomeData();
    assert(globalHomeData.config?.scopeType === 'GLOBAL', 'Resolved GLOBAL scope when no store/city provided');
    console.log("SECTIONS IN CONFIG:", globalHomeData.config?.sections);
    assert(globalHomeData.config?.sections.length === 2, 'Resolved 2 sections in published GLOBAL config');

    // ==========================================
    // TEST 3: CITY SCOPE CONFIG & STORE -> CITY -> GLOBAL FALLBACK
    // ==========================================
    console.log('\n--- Test 3: City Scope Config & Fallback Hierarchy ---');

    // 3a. Publish CITY config for 'Delhi'
    const delhiDraft = await createDefaultDraft(adminUser._id.toString(), 'ADMIN', 'CITY', 'Delhi');
    delhiDraft.sections = [
      {
        sectionId: 'delhi_specials',
        type: 'product_grid',
        title: 'Delhi Specials',
        subtitle: '',
        active: true,
        sortOrder: 1,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'product',
            referenceId: testProduct2._id,
            sortOrder: 1,
            active: true,
            targetType: 'product',
            targetValue: `/product/${testProduct2.slug}`,
          },
        ],
      },
    ];
    await delhiDraft.save();
    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'CITY', 'Delhi');

    // 3b. Query with Delhi context -> resolves CITY config
    const delhiHome = await getCustomerHomeData(undefined, 'Delhi');
    assert(delhiHome.config?.scopeType === 'CITY', 'Resolves CITY scope for Delhi');
    assert(delhiHome.config?.scopeId === 'Delhi', 'City scopeId is Delhi');
    assert(delhiHome.config?.sections[0].title === 'Delhi Specials', 'Renders Delhi Specials section');

    // 3c. Store in Delhi without store-specific config falls back to Delhi CITY config
    const storeDelhiHome = await getCustomerHomeData(storeDelhi._id.toString());
    assert(
      storeDelhiHome.config?.scopeType === 'CITY' && storeDelhiHome.config?.scopeId === 'Delhi',
      'STORE without store-specific config falls back to CITY config',
    );

    // 3d. Store in Mumbai (no Mumbai CITY config) falls back to GLOBAL config
    const storeMumbaiHome = await getCustomerHomeData(storeMumbai._id.toString());
    assert(
      storeMumbaiHome.config?.scopeType === 'GLOBAL',
      'STORE without STORE/CITY config falls back to GLOBAL config',
    );

    // ==========================================
    // TEST 4: SCHEDULED SECTION STARTAT & ENDAT FILTERING
    // ==========================================
    console.log('\n--- Test 4: Scheduled Sections startAt / endAt Filtering ---');
    const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in future
    const pastDate = new Date(Date.now() - 86400000 * 5); // 5 days in past
    const pastEndDate = new Date(Date.now() - 86400000 * 2); // 2 days in past

    // Draft with scheduled future section and expired section
    await HomeConfig.deleteMany({ scopeType: { $in: ['STORE', 'CITY'] } });
    const scheduledDraft = await createDefaultDraft(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    scheduledDraft.sections = [
      {
        sectionId: 'active_section',
        type: 'product_grid',
        title: 'Always Active Section',
        active: true,
        sortOrder: 1,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'product',
            referenceId: testProduct1._id,
            sortOrder: 1,
            active: true,
            targetType: 'product',
            targetValue: `/product/${testProduct1.slug}`,
          },
        ],
      },
      {
        sectionId: 'future_promo',
        type: 'product_grid',
        title: 'Upcoming Festival Sale',
        startAt: futureDate,
        active: true,
        sortOrder: 2,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'product',
            referenceId: testProduct2._id,
            sortOrder: 1,
            active: true,
            targetType: 'product',
            targetValue: `/product/${testProduct2.slug}`,
          },
        ],
      },
      {
        sectionId: 'expired_promo',
        type: 'product_grid',
        title: 'Expired Clearance',
        startAt: pastDate,
        endAt: pastEndDate,
        active: true,
        sortOrder: 3,
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'product',
            referenceId: testProduct2._id,
            sortOrder: 1,
            active: true,
            targetType: 'product',
            targetValue: `/product/${testProduct2.slug}`,
          },
        ],
      },
    ];
    await scheduledDraft.save();
    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null);

    const resolvedScheduledHome = await getCustomerHomeData();
    const resolvedSectionIds = resolvedScheduledHome.config?.sections.map((s: any) => s.sectionId) || [];

    assert(resolvedSectionIds.includes('active_section'), 'Active section is included');
    assert(!resolvedSectionIds.includes('future_promo'), 'Future scheduled section (startAt in future) is excluded');
    assert(!resolvedSectionIds.includes('expired_promo'), 'Expired section (endAt in past) is excluded');


    // ==========================================
    // TEST 5: INCOMPATIBILITY MATRIX VALIDATION
    // ==========================================
    console.log('\n--- Test 5: Section/Item Incompatibility Matrix ---');
    let offerBannerIncompatible = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 'sec_bad',
            type: 'featured_banner',
            active: true,
            items: [{ itemType: 'product', referenceId: testProduct1._id.toString() }],
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Incompatible itemType')) offerBannerIncompatible = true;
    }
    assert(offerBannerIncompatible, 'Product item in featured_banner is rejected');

    console.log(`\n======================================================`);
    console.log(`ALL PHASE 3 WIRING TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log(`======================================================\n`);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log('🧹 Cleaned up isolated test database.');
    await mongoose.disconnect();
  }
}

runPhase3WiringTests().catch((err) => {
  console.error('Phase 3 test execution failed:', err);
  process.exit(1);
});
