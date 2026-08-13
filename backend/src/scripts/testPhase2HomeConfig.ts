import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig from '../models/homeConfig.model';
import HomeConfigAudit from '../models/homeConfigAudit.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import {
  getDraftConfig,
  getVersionHistory,
  previewConfiguration,
  publishConfiguration,
  saveDraftConfig,
  validateConfiguration,
} from '../services/adminHomeConfig.service';
import { validateSaveDraftInput } from '../validators/adminHomeConfig.validator';
import { getHomeData as getCustomerHomeData } from '../services/home.service';


function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runPhase2Tests() {
  const testDbName = 'bootkit_phase2_test_home_config';
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
    // SETUP TEST ENTITIES
    // ==========================================
    console.log('--- Step 1: Setting up test entities ---');
    const adminUser = await User.create({
      email: `admin_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Admin',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'ADMIN',
      isActive: true,
    });

    const ownerUser = await User.create({
      email: `owner_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Owner',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'OWNER',
      isActive: true,
    });

    const sellerUser = await User.create({
      email: `seller_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Seller',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'SELLER',
      isActive: true,
    });

    const customerUser = await User.create({
      email: `cust_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Customer',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'CUSTOMER',
      isActive: true,
    });

    const testStore = await Store.create({
      name: 'Central Mall Store',
      slug: `store-central-${Date.now()}-${randomSuffix()}`,
      addressLine1: 'Central Ave',
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
      name: 'Organic Dairy',
      slug: `org-dairy-${Date.now()}-${randomSuffix()}`,
      active: true,
      homeSection: 'groceryKitchen', // Legacy placement
    });

    const testProduct = await Product.create({
      name: 'A2 Cow Milk 1L',
      slug: `a2-milk-${Date.now()}-${randomSuffix()}`,
      sku: `SKU-A2-${Date.now()}`,
      category: testCategory._id,
      mrp: 90,
      sellingPrice: 85,
      stock: 50,
      active: true,
    });

    const testBanner = await HeroBanner.create({
      title: 'Summer Splash 50% Off',
      desktopImage: '/images/banners/summer.png',
      mobileImage: '/images/banners/summer.png',
      buttonLink: '/collection/summer-sale',
      displayOrder: 1,
      placement: 'hero',
      active: true,
      showOnHome: true,
    });


    // ==========================================
    // TEST 1: DEFAULT DRAFT INITIALIZATION
    // ==========================================
    console.log('\n--- Test 1: Default Draft Configuration ---');
    const draft = await getDraftConfig('GLOBAL');
    assert(draft.status === 'DRAFT', 'Initial draft has status DRAFT');
    assert(draft.sections.length >= 7, 'Default draft initialized approved section types');
    assert(draft.configVersion >= 1, 'Default draft has valid configVersion');

    // ==========================================
    // TEST 2: VALIDATION RULES & INJECTION PROTECTION
    // ==========================================
    console.log('\n--- Test 2: Validation & Injection Protection ---');

    // 2a. Duplicate sectionId rejection
    let duplicateRejected = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          { sectionId: 'hero_main', type: 'hero_banner', active: true, items: [] },
          { sectionId: 'hero_main', type: 'category_cards', active: true, items: [] },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Duplicate sectionId')) duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate sectionId in draft is rejected');

    // 2b. Unknown section type rejection
    let unknownTypeRejected = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          { sectionId: 'custom_sec', type: 'arbitrary_react_component', active: true, items: [] },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Invalid section type')) unknownTypeRejected = true;
    }
    assert(unknownTypeRejected, 'Unknown/arbitrary section type is rejected');

    // 2c. HTML / Script injection rejection
    let xssRejected = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 'xss_sec',
            type: 'hero_banner',
            title: '<script>alert("hacked")</script>',
            active: true,
            items: [],
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('Invalid characters or code detected')) xssRejected = true;
    }
    assert(xssRejected, 'Raw HTML/Script injection in section title is rejected');

    // 2d. Invalid targetType rejection
    let invalidTargetHandled = false;
    const validatedWithDefaultTarget = validateSaveDraftInput({
      scopeType: 'GLOBAL',
      sections: [
        {
          sectionId: 'target_sec',
          type: 'category_cards',
          active: true,
          items: [
            {
              itemType: 'category',
              referenceId: testCategory._id.toString(),
              targetType: 'invalid_intent_scheme',
            },
          ],
        },
      ],
    });
    assert(
      validatedWithDefaultTarget.sections[0].items[0].targetType === 'category',
      'Unapproved targetType falls back safely to whitelist default ("category")',
    );

    // ==========================================
    // TEST 3: SAVE DRAFT & AUDIT LOGGING
    // ==========================================
    console.log('\n--- Test 3: Save Draft & Audit Logging ---');
    const validDraftInput = validateSaveDraftInput({
      scopeType: 'GLOBAL',
      sections: [
        {
          sectionId: 'hero_main',
          type: 'hero_banner',
          title: 'Top Offers',
          active: true,
          sortOrder: 1,
          items: [
            {
              itemType: 'banner',
              referenceId: testBanner._id.toString(),
              sortOrder: 1,
              active: true,
              targetType: 'collection',
              targetValue: testBanner.buttonLink || '/collection/summer-sale',
            },

          ],
        },
        {
          sectionId: 'best_sellers',
          type: 'best_sellers',
          title: 'Best Sellers',
          active: true,
          sortOrder: 2,
          items: [
            {
              itemType: 'category',
              referenceId: testCategory._id.toString(),
              sortOrder: 1,
              active: true,
              targetType: 'category',
              targetValue: `/category/${testCategory.slug}`,
            },
          ],
        },
        {
          sectionId: 'curated_prods',
          type: 'product_grid',
          title: 'Fresh Milk',
          active: true,
          sortOrder: 3,
          items: [
            {
              itemType: 'product',
              referenceId: testProduct._id.toString(),
              sortOrder: 1,
              active: true,
              targetType: 'product',
              targetValue: `/product/${testProduct.slug}`,
            },
          ],
        },
      ],
    });

    const savedDraft = await saveDraftConfig(
      adminUser._id.toString(),
      'ADMIN',
      validDraftInput,
    );
    assert(savedDraft.sections.length === 3, 'Draft successfully saved with 3 sections');

    const auditAfterDraft = await HomeConfigAudit.findOne({
      configId: savedDraft._id,
      action: 'DRAFT_UPDATED',
    });
    assert(!!auditAfterDraft, 'Audit log recorded for DRAFT_UPDATED action');

    // ==========================================
    // TEST 4: PUBLISH VALIDATION & FAILED PUBLISH ROLLBACK
    // ==========================================
    console.log('\n--- Test 4: Publish Validation & Inactive Reference Rejection ---');
    // Simulate an invalid reference by creating a soft-deleted category
    const deletedCat = await Category.create({
      name: 'Deleted Category',
      slug: `del-cat-${Date.now()}`,
      active: false,
      deletedAt: new Date(),
    });

    savedDraft.sections.push({
      sectionId: 'invalid_sec',
      type: 'category_cards',
      title: 'Invalid Cat Section',
      active: true,
      sortOrder: 4,
      items: [
        {
          itemType: 'category',
          referenceId: deletedCat._id,
          sortOrder: 1,
          active: true,
        },
      ],
    });
    await savedDraft.save();

    let publishErrorCaught = false;
    try {
      await publishConfiguration(adminUser._id.toString(), 'ADMIN', 'GLOBAL');
    } catch (err: any) {
      if (err.message.includes('Cannot publish invalid configuration')) {
        publishErrorCaught = true;
      }
    }
    assert(publishErrorCaught, 'Publishing draft with inactive/deleted reference is rejected');

    // Remove invalid section and verify publish succeeds
    savedDraft.sections.pop();
    await savedDraft.save();

    const publishResult = await publishConfiguration(
      adminUser._id.toString(),
      'ADMIN',
      'GLOBAL',
    );
    assert(
      publishResult.published.status === 'PUBLISHED',
      'Configuration status transitioned to PUBLISHED',
    );
    assert(
      publishResult.published.configVersion === 1,
      'Published version is v1',
    );
    assert(
      publishResult.nextDraft.status === 'DRAFT',
      'Fresh DRAFT cloned for future edits',
    );

    const publishAudit = await HomeConfigAudit.findOne({
      configId: publishResult.published._id,
      action: 'CONFIG_PUBLISHED',
    });
    assert(!!publishAudit, 'Audit log recorded for CONFIG_PUBLISHED action');

    // ==========================================
    // TEST 5: CUSTOMER HOME API RESOLUTION & SANITIZATION
    // ==========================================
    console.log('\n--- Test 5: Customer-Safe Home API ---');
    const customerHomePayload = await getCustomerHomeData();
    assert(!!customerHomePayload.config, 'Customer GET /api/home returns published versioned config');
    assert(customerHomePayload.config?.configVersion === 1, 'Versioned config version matches published version');
    assert(
      customerHomePayload.config?.sections?.length === 3,
      'Resolved sections match published count (3)',
    );
    assert(
      !!customerHomePayload.heroBanners,
      'Legacy fallback keys (heroBanners, etc.) remain intact for backward compatibility',
    );

    // Verify StoreInventory pricing resolution
    await StoreInventory.create({
      store: testStore._id,
      product: testProduct._id,
      sellingPrice: 79,
      mrp: 90,
      stock: 25,
      active: true,
    });

    const storeAwarePayload = await getCustomerHomeData(testStore._id.toString());
    const prodSection = storeAwarePayload.config?.sections.find((s) => s.sectionId === 'curated_prods');
    const resolvedProdItem = prodSection?.items[0] as any;
    assert(
      resolvedProdItem?.sellingPrice === 79,
      'StoreInventory sellingPrice (79) applied to product in store-scoped home payload',
    );

    // ==========================================
    // TEST 6: PREVIEW & VERSION HISTORY
    // ==========================================
    console.log('\n--- Test 6: Preview & History Endpoints ---');
    const preview = await previewConfiguration('GLOBAL');
    assert(!!preview.sections, 'Preview endpoint resolves section data');

    const history = await getVersionHistory('GLOBAL');
    assert(history.versions.length >= 1, 'Version history returns published versions');
    assert(history.auditLogs.length >= 2, 'Audit logs return tracked actions');

    // ==========================================
    // TEST 7: CATEGORY TAXONOMY INTACT
    // ==========================================
    console.log('\n--- Test 7: Category Master Intact ---');
    const catCheck = await Category.findById(testCategory._id);
    assert(catCheck?.name === 'Organic Dairy', 'Category Master taxonomy remains 100% intact');

    console.log(`\n======================================================`);
    console.log(`ALL PHASE 2 TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log(`======================================================\n`);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log('🧹 Cleaned up isolated test database.');
    await mongoose.disconnect();
  }
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test execution failed:', err);
  process.exit(1);
});
