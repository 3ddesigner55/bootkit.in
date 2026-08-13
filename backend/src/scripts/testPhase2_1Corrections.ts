import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import HomeConfigAudit from '../models/homeConfigAudit.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import {
  createDefaultDraft,
  getDraftConfig,
  publishConfiguration,
  saveDraftConfig,
} from '../services/adminHomeConfig.service';
import { getHomeData as getCustomerHomeData } from '../services/home.service';
import { validateSaveDraftInput } from '../validators/adminHomeConfig.validator';
import { validateCategoryCreate } from '../validators/category.validator';


function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runPhase2_1Corrections() {
  const testDbName = 'bootkit_phase2_1_test_corrections';
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
    // STEP 1: VERIFY HOME CONFIG INDEXES VIA listIndexes()
    // ==========================================
    console.log('--- Step 1: Auditing HomeConfig indexes with listIndexes() ---');
    await HomeConfig.init();
    const indexes = await HomeConfig.collection.listIndexes().toArray();
    const uniqPublishedIdx = indexes.find((idx) => idx.name === 'uniq_published_scope_config');

    assert(!!uniqPublishedIdx, 'HomeConfig has named index "uniq_published_scope_config"');
    assert(uniqPublishedIdx?.unique === true, 'Index is unique: true');
    assert(uniqPublishedIdx?.sparse === undefined || uniqPublishedIdx?.sparse === false, 'Index does NOT have sparse: true');
    assert(
      uniqPublishedIdx?.partialFilterExpression?.status === 'PUBLISHED',
      'Index has partialFilterExpression: { status: "PUBLISHED" }',
    );

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

    const storeBangalore = await Store.create({
      name: 'Bangalore Flagship Store',
      slug: `store-blr-${Date.now()}-${randomSuffix()}`,
      addressLine1: 'MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: `98${randomSuffix()}`,
      active: true,
    });

    const testCategory = await Category.create({
      name: 'Fresh Fruits',
      slug: `fruits-${Date.now()}-${randomSuffix()}`,
      active: true,
      homeSection: 'groceryKitchen',
    });

    const testProduct1 = await Product.create({
      name: 'Kashmiri Apple 1kg',
      slug: `apple-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-AP-${Date.now()}`,
      category: testCategory._id,
      mrp: 200,
      sellingPrice: 180,
      stock: 50,
      active: true,
    });

    const testProduct2 = await Product.create({
      name: 'Organic Banana 1 Dozen',
      slug: `banana-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-BN-${Date.now()}`,
      category: testCategory._id,
      mrp: 80,
      sellingPrice: 60,
      stock: 50,
      active: true,
    });

    const testBanner = await HeroBanner.create({
      title: 'Monsoon Mega Sale',
      desktopImage: '/images/banners/monsoon.png',
      mobileImage: '/images/banners/monsoon.png',
      buttonLink: '/collection/monsoon',
      displayOrder: 1,
      placement: 'hero',
      active: true,
      showOnHome: true,
    });

    // ==========================================
    // TEST 2: GET DRAFT PERFORMS ZERO DATABASE WRITES
    // ==========================================
    console.log('\n--- Test 2: GET Draft Performs Zero Database Writes ---');
    const countBeforeGet = await HomeConfig.countDocuments();
    const getResult1 = await getDraftConfig('GLOBAL');
    const getResult2 = await getDraftConfig('GLOBAL');
    const countAfterGet = await HomeConfig.countDocuments();

    assert(getResult1 === null && getResult2 === null, 'GET draft returns null when no draft exists');
    assert(countBeforeGet === countAfterGet, 'Repeated GET requests perform 0 database writes');

    // ==========================================
    // TEST 3: EXPLICIT DRAFT CREATION & CONFLICT CHECK
    // ==========================================
    console.log('\n--- Test 3: Explicit Draft Creation & Optimistic Version Check ---');
    const initialDraft = await createDefaultDraft(adminUser._id.toString(), 'ADMIN', 'GLOBAL');
    assert(initialDraft.status === 'DRAFT', 'Explicit draft creation creates DRAFT document');
    assert(initialDraft.configVersion === 1, 'Initial draft has version 1');

    // Test optimistic version conflict: passing expectedVersion: 99 on version 1 draft
    let versionConflictCaught = false;
    try {
      await saveDraftConfig(adminUser._id.toString(), 'ADMIN', {
        scopeType: 'GLOBAL',
        scopeId: null,
        expectedVersion: 99,
        sections: initialDraft.sections,
      });
    } catch (err: any) {
      if (err.code === 'DRAFT_VERSION_CONFLICT') versionConflictCaught = true;
    }
    assert(versionConflictCaught, 'Mismatched expectedVersion throws 409 DRAFT_VERSION_CONFLICT');

    // ==========================================
    // TEST 4: SECTION / ITEM COMPATIBILITY MATRIX
    // ==========================================
    console.log('\n--- Test 4: Section/Item Compatibility Matrix ---');

    // 4a. Incompatible itemType for hero_banner (e.g. category in hero_banner)
    let heroIncompatible = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 'hero_bad',
            type: 'hero_banner',
            active: true,
            items: [{ itemType: 'category', referenceId: testCategory._id.toString() }],
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Incompatible itemType')) heroIncompatible = true;
    }
    assert(heroIncompatible, 'Category item rejected in hero_banner section');

    // 4b. startAt >= endAt rejected
    let dateOrderRejected = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 'timed_sec',
            type: 'category_cards',
            startAt: '2026-08-15T00:00:00Z',
            endAt: '2026-08-10T00:00:00Z',
            active: true,
            items: [],
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('startAt must be strictly earlier than endAt')) dateOrderRejected = true;
    }
    assert(dateOrderRejected, 'startAt >= endAt is rejected in section definition');

    // 4c. Duplicate referenceId inside a section rejected
    let duplicateItemRejected = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 'sec_dup',
            type: 'category_cards',
            active: true,
            items: [
              { itemType: 'category', referenceId: testCategory._id.toString() },
              { itemType: 'category', referenceId: testCategory._id.toString() },
            ],
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Duplicate referenceId')) duplicateItemRejected = true;
    }
    assert(duplicateItemRejected, 'Duplicate reference items in the same section are rejected');

    // ==========================================
    // TEST 5: ATOMIC PUBLISH & CONCURRENT RACE TEST
    // ==========================================
    console.log('\n--- Test 5: Atomic Publish & Concurrent Publish Race ---');
    // Save valid items to draft
    const validSections: HomeConfigSection[] = [
      {
        sectionId: 'hero_main',
        type: 'hero_banner',
        title: 'Top Banner',
        subtitle: '',
        active: true,
        sortOrder: 1,
        itemMode: 'MANUAL',
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
      },
      {
        sectionId: 'fresh_produce',
        type: 'product_grid',
        title: 'Fresh Fruits',
        subtitle: '',
        active: true,
        sortOrder: 2,
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
          {
            itemType: 'product',
            referenceId: testProduct2._id,
            sortOrder: 2,
            active: true,
            targetType: 'product',
            targetValue: `/product/${testProduct2.slug}`,
          },
        ],
      },
    ];

    await saveDraftConfig(adminUser._id.toString(), 'ADMIN', {
      scopeType: 'GLOBAL',
      scopeId: null,
      sections: validSections,
    });

    // Test simultaneous publish race on GLOBAL scope
    const publishPromises = [
      publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null),
      publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL', null),
    ];

    const raceResults = await Promise.allSettled(publishPromises);
    const fulfilledPublishes = raceResults.filter((r) => r.status === 'fulfilled');
    assert(fulfilledPublishes.length >= 1, 'At least one publish succeeded in concurrent race');

    const publishedConfigsInDb = await HomeConfig.find({
      status: 'PUBLISHED',
      scopeType: 'GLOBAL',
      scopeId: null,
    });
    assert(publishedConfigsInDb.length === 1, 'Exactly ONE configuration is PUBLISHED for GLOBAL scope');

    // ==========================================
    // TEST 6: SCOPE PRECEDENCE RESOLUTION (STORE -> CITY -> GLOBAL)
    // ==========================================
    console.log('\n--- Test 6: Hierarchical Scope Precedence ---');

    // 6a. Global resolution without store selection
    const globalHome = await getCustomerHomeData();
    assert(
      globalHome.config?.scopeType === 'GLOBAL',
      'Unscoped customer query resolves GLOBAL published configuration',
    );

    // 6b. Create and publish a STORE-specific configuration
    const storeDraft = await createDefaultDraft(adminUser._id.toString(), 'ADMIN', 'STORE', storeBangalore._id.toString());
    storeDraft.sections = [
      {
        sectionId: 'store_exclusive',
        type: 'product_grid',
        title: 'Bangalore Store Exclusives',
        subtitle: '',
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
    ];
    await storeDraft.save();

    await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'STORE', storeBangalore._id.toString());

    // Create inventory for Product 1 at Bangalore Store
    await StoreInventory.create({
      store: storeBangalore._id,
      product: testProduct1._id,
      sellingPrice: 165,
      mrp: 200,
      stock: 40,
      active: true,
    });

    const storeScopedHome = await getCustomerHomeData(storeBangalore._id.toString());
    assert(
      storeScopedHome.config?.scopeType === 'STORE' && storeScopedHome.config?.scopeId === storeBangalore._id.toString(),
      'Store-scoped customer query resolves matching STORE configuration',
    );
    const resolvedStoreItem = storeScopedHome.config?.sections[0]?.items[0] as any;
    assert(
      resolvedStoreItem?.sellingPrice === 165,
      'Product selling price correctly resolves from StoreInventory (165)',
    );

    // 6c. Test that Product 2 (missing StoreInventory in storeBangalore) is excluded from storeScopedHome
    const prod2Included = storeScopedHome.config?.sections[0]?.items?.some(
      (i: any) => i.referenceId?.toString() === testProduct2._id.toString(),
    );
    assert(!prod2Included, 'Product without StoreInventory is excluded from store-scoped Home');

    // ==========================================
    // TEST 7: LEGACY CATEGORY MASTER WRITE SHUTDOWN
    // ==========================================
    console.log('\n--- Test 7: Legacy Category homeSection Write Rejection ---');
    const validatedCatInput = validateCategoryCreate({
      name: 'New Dairy Category',
      slug: `dairy-${Date.now()}-${randomSuffix()}`,
      homeSection: 'groceryKitchen', // Attempting legacy placement
    });
    assert(
      validatedCatInput.homeSection === undefined,
      'Category validator strips/ignores homeSection writes (HomeBuilder is exclusive writer)',
    );

    // ==========================================
    // TEST 8: BACKEND ENDPOINT RBAC PERMISSION CHECKS
    // ==========================================
    console.log('\n--- Test 8: Backend RBAC Permission Checks ---');
    const { authorizeRoles } = await import('../middleware/role.middleware');
    const { ROLES } = await import('../constants/roles');


    const mockAdminReq = { user: { role: ROLES.ADMIN, id: adminUser._id.toString() } } as any;
    const mockOwnerReq = { user: { role: ROLES.OWNER, id: adminUser._id.toString() } } as any;
    const mockSellerReq = { user: { role: ROLES.SELLER, id: adminUser._id.toString() } } as any;
    const mockCustomerReq = { user: { role: ROLES.CUSTOMER, id: adminUser._id.toString() } } as any;

    let adminAllowed = false;
    let ownerAllowed = false;
    let sellerDenied = false;
    let customerDenied = false;

    const rbacMiddleware = authorizeRoles(ROLES.ADMIN, ROLES.OWNER);

    rbacMiddleware(mockAdminReq, {} as any, (err?: any) => {
      if (!err) adminAllowed = true;
    });

    rbacMiddleware(mockOwnerReq, {} as any, (err?: any) => {
      if (!err) ownerAllowed = true;
    });

    function createMockRes() {
      let code = 200;
      let body: any = null;
      const res: any = {
        status: (c: number) => {
          code = c;
          return res;
        },
        json: (b: any) => {
          body = b;
          return res;
        },
        getStatusCode: () => code,
        getBody: () => body,
      };
      return res;
    }

    const resSeller = createMockRes();
    rbacMiddleware(mockSellerReq, resSeller, () => {});
    sellerDenied = resSeller.getStatusCode() === 403;

    const resCustomer = createMockRes();
    rbacMiddleware(mockCustomerReq, resCustomer, () => {});
    customerDenied = resCustomer.getStatusCode() === 403;

    assert(adminAllowed, 'ADMIN role is authorized for Home Merchandising');
    assert(ownerAllowed, 'OWNER role is authorized for Home Merchandising');
    assert(sellerDenied, 'SELLER role is denied (403 Forbidden) for Home Merchandising');
    assert(customerDenied, 'CUSTOMER role is denied (403 Forbidden) for Home Merchandising');




    console.log(`\n======================================================`);
    console.log(`ALL PHASE 2.1 CORRECTION TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log(`======================================================\n`);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log('🧹 Cleaned up isolated test database.');
    await mongoose.disconnect();
  }
}

runPhase2_1Corrections().catch((err) => {
  console.error('Phase 2.1 test execution failed:', err);
  process.exit(1);
});
