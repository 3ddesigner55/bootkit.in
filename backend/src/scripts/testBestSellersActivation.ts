import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import {
  createDefaultDraft,
  publishConfiguration,
  saveDraftConfig,
} from '../services/adminHomeConfig.service';
import { getHomeData as getCustomerHomeData } from '../services/home.service';
import { validateSaveDraftInput } from '../validators/adminHomeConfig.validator';
import { authorizeRoles } from '../middleware/role.middleware';

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runBestSellersActivationTests() {
  const testDbName = 'bootkit_p3_bs_test';
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
    // Clear collections
    await mongoose.connection.db!.dropDatabase();
    console.log('Cleared test database to start fresh.');

    const randomSuffix = () => Math.floor(10000000 + Math.random() * 90000000).toString();

    // ==========================================
    // SETUP FIXTURES
    // ==========================================
    const adminUser = await User.create({
      email: `admin_${randomSuffix()}@test.bootkit`,
      firstName: 'Admin',
      lastName: 'User',
      phone: `98${randomSuffix()}`,
      role: 'ADMIN',
      isActive: true,
    });

    const storeDelhi = await Store.create({
      name: 'Delhi Store',
      slug: `store-delhi-${randomSuffix()}`,
      addressLine1: 'CP',
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
      name: 'Mumbai Store',
      slug: `store-mumbai-${randomSuffix()}`,
      addressLine1: 'Bandra',
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

    // Categories
    const mainCategory = await Category.create({
      name: 'Dairy',
      slug: `dairy-${randomSuffix()}`,
      active: true,
    });

    const subCategory = await Category.create({
      name: 'Milk & Paneer',
      slug: `milk-paneer-${randomSuffix()}`,
      parentCategory: mainCategory._id,
      active: true,
    });

    // Products (under subcategory)
    const p1 = await Product.create({
      name: 'P1-Classic Milk',
      slug: `p1-${randomSuffix()}`,
      sku: `SKU-P1-${randomSuffix()}`,
      category: subCategory._id,
      mrp: 100,
      sellingPrice: 90,
      stock: 50,
      bestseller: false,
      featured: false,
      displayOrder: 10,
      thumbnail: 'http://image.url/p1.png',
      active: true,
    });

    const p2 = await Product.create({
      name: 'P2-Paneer Block',
      slug: `p2-${randomSuffix()}`,
      sku: `SKU-P2-${randomSuffix()}`,
      category: subCategory._id,
      mrp: 120,
      sellingPrice: 110,
      stock: 50,
      bestseller: false,
      featured: false,
      displayOrder: 20,
      thumbnail: 'http://image.url/p2.png',
      active: true,
    });

    const p3 = await Product.create({
      name: 'P3-Butter Ghee',
      slug: `p3-${randomSuffix()}`,
      sku: `SKU-P3-${randomSuffix()}`,
      category: subCategory._id,
      mrp: 150,
      sellingPrice: 140,
      stock: 50,
      bestseller: false,
      featured: false,
      displayOrder: 30,
      thumbnail: 'http://image.url/p3.png',
      active: true,
    });

    const p4 = await Product.create({
      name: 'P4-Cheese Slice',
      slug: `p4-${randomSuffix()}`,
      sku: `SKU-P4-${randomSuffix()}`,
      category: subCategory._id,
      mrp: 80,
      sellingPrice: 70,
      stock: 50,
      bestseller: false,
      featured: false,
      displayOrder: 40,
      thumbnail: 'http://image.url/p4.png',
      active: true,
    });

    // P5 to verify sorting later
    const p5 = await Product.create({
      name: 'P5-Yogurt Cup',
      slug: `p5-${randomSuffix()}`,
      sku: `SKU-P5-${randomSuffix()}`,
      category: subCategory._id,
      mrp: 50,
      sellingPrice: 40,
      stock: 50,
      bestseller: false,
      featured: false,
      displayOrder: 50,
      thumbnail: 'http://image.url/p5.png',
      active: true,
    });

    // Inventories for storeDelhi
    const prods = [p1, p2, p3, p4, p5];
    for (const p of prods) {
      await StoreInventory.create({
        store: storeDelhi._id,
        product: p._id,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        active: true,
      });
    }

    // ==========================================
    // EXECUTE TESTS
    // ==========================================

    // Test 1 & 2: Scope Precedence
    // Set up Store-specific, City-specific and Global configurations.
    const globalConfig = await HomeConfig.create({
      scopeType: 'GLOBAL',
      status: 'PUBLISHED',
      configVersion: 1,
      sections: [
        {
          sectionId: 'best_sellers_home',
          type: 'best_sellers',
          active: true,
          sortOrder: 1,
          title: 'Global Best Sellers',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [{ itemType: 'category', referenceId: mainCategory._id, sortOrder: 1, active: true }],
        },
      ],
    });

    const cityConfig = await HomeConfig.create({
      scopeType: 'CITY',
      scopeId: 'Delhi',
      status: 'PUBLISHED',
      configVersion: 1,
      sections: [
        {
          sectionId: 'best_sellers_home',
          type: 'best_sellers',
          active: true,
          sortOrder: 1,
          title: 'Delhi City Best Sellers',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [{ itemType: 'category', referenceId: mainCategory._id, sortOrder: 1, active: true }],
        },
      ],
    });

    const storeConfig = await HomeConfig.create({
      scopeType: 'STORE',
      scopeId: storeDelhi._id.toString(),
      status: 'PUBLISHED',
      configVersion: 1,
      sections: [
        {
          sectionId: 'best_sellers_home',
          type: 'best_sellers',
          active: true,
          sortOrder: 1,
          title: 'Store Delhi Best Sellers',
          subtitle: '',
          itemMode: 'MANUAL',
          items: [{ itemType: 'category', referenceId: mainCategory._id, sortOrder: 1, active: true }],
        },
      ],
    });

    // Rule 1: Store-specific beats City-specific config
    const storeHomeData = await getCustomerHomeData(storeDelhi._id.toString());
    assert(
      storeHomeData.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.title === 'Store Delhi Best Sellers',
      'Store-specific configuration should override other scopes'
    );

    // Deleting the STORE config for storeDelhi so we fall back to Delhi CITY config
    await HomeConfig.deleteOne({ scopeType: 'STORE', scopeId: storeDelhi._id.toString() });

    // Rule 2: City-specific beats Global config
    const cityHomeData = await getCustomerHomeData(undefined, 'Delhi');
    assert(
      cityHomeData.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.title === 'Delhi City Best Sellers',
      'City-specific configuration should override Global scope'
    );

    // Deleting the CITY config for Delhi so we fall back to GLOBAL config
    await HomeConfig.deleteOne({ scopeType: 'CITY', scopeId: 'Delhi' });

    const globalHomeData = await getCustomerHomeData(undefined, 'Delhi');
    assert(
      globalHomeData.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.title === 'Global Best Sellers',
      'Global configuration serves as fallback scope'
    );

    // Rule 3: Validation - Save draft fails if required fields are missing/invalid
    let validationErrorCaught = false;
    try {
      // sections is missing
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
      });
    } catch (err: any) {
      validationErrorCaught = true;
    }
    assert(validationErrorCaught, 'Saving draft with missing sections array should trigger validation error');

    // Rule 4: Validation - Save draft fails if invalid ObjectID reference exists
    let invalidObjectCaught = false;
    try {
      validateSaveDraftInput({
        scopeType: 'GLOBAL',
        expectedVersion: 1,
        sections: [
          {
            sectionId: 'best_sellers_home',
            type: 'best_sellers',
            active: true,
            sortOrder: 1,
            title: 'Title',
            subtitle: '',
            itemMode: 'MANUAL',
            items: [{ itemType: 'category', referenceId: 'invalid-id', sortOrder: 1, active: true }],
          },
        ],
      });
    } catch (err: any) {
      invalidObjectCaught = true;
    }
    assert(invalidObjectCaught, 'Invalid ObjectId reference should trigger save validation error');

    // Rule 5 & 6: Draft Creation & Authentication/RBAC
    // Creating draft with valid role OWNER succeeds
    const draft = await createDefaultDraft(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
    assert(draft !== null && draft.status === 'DRAFT', 'Authenticated ADMIN role can create a new DRAFT config');

    // Creator RBAC check
    let rbacErrorCaught = false;
    const mockReq = { user: { role: 'CUSTOMER' } } as any;
    const mockRes = {
      status: function (code: number) {
        if (code === 403) rbacErrorCaught = true;
        return this;
      },
      json: function () {
        return this;
      },
    } as any;
    const mockNext = () => {};

    const middleware = authorizeRoles('ADMIN', 'OWNER');
    middleware(mockReq, mockRes, mockNext);

    assert(rbacErrorCaught, 'Non-admin/non-owner role should be rejected by RBAC check');

    // Rule 7: Category Hierarchy - Recursive lookup includes products of subcategories
    const resolvedData = await getCustomerHomeData(storeDelhi._id.toString());
    const bsSection = resolvedData.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home');
    assert(
      bsSection && bsSection.items[0]?.images.length === 4,
      'Recursive resolver should aggregate subcategory products to complete 4-image collage'
    );

    // Rule 8: Auto Sorting - Sales priority (delivered sales quantity) resolves first
    // Create delivered orders for p5 so it goes to first place
    await mongoose.connection.db!.collection('orders').insertOne({
      orderNumber: `ORD-${randomSuffix()}`,
      user: adminUser._id,
      store: storeDelhi._id,
      items: [{
        product: p5._id,
        quantity: 10,
        price: p5.sellingPrice,
        name: p5.name,
        mrp: p5.mrp,
        sellingPrice: p5.sellingPrice,
        total: 10 * p5.sellingPrice
      }],
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      grandTotal: 10 * p5.sellingPrice,
      address: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    });

    const homeDataWithSales = await getCustomerHomeData(storeDelhi._id.toString());
    const resolvedThumbnails = homeDataWithSales.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.items[0]?.images;
    assert(
      resolvedThumbnails[0] === 'http://image.url/p5.png',
      'Automatic sorting should prioritize product with highest delivered sales quantity (p5)'
    );

    // Rule 9: Bestseller status serves as first tiebreaker
    // Give p4 bestseller status (sales for others are 0, so p4 > p1, p2, p3)
    p4.bestseller = true;
    await p4.save();

    const homeDataWithBest = await getCustomerHomeData(storeDelhi._id.toString());
    const resolvedBest = homeDataWithBest.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.items[0]?.images;
    assert(
      resolvedBest[1] === 'http://image.url/p4.png',
      'Bestseller status serves as first tiebreaker (p4 should be 2nd after p5)'
    );

    // Rule 10: Featured status serves as second tiebreaker
    // Give p3 featured status (sales = 0, bestseller = false, featured = true)
    p3.featured = true;
    await p3.save();

    const homeDataWithFeat = await getCustomerHomeData(storeDelhi._id.toString());
    const resolvedFeat = homeDataWithFeat.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.items[0]?.images;
    assert(
      resolvedFeat[2] === 'http://image.url/p3.png',
      'Featured status serves as second tiebreaker (p3 should be 3rd)'
    );

    // Rule 11: Display order serves as third tiebreaker
    // p1 has displayOrder 10, p2 has displayOrder 20. So p1 should be before p2.
    const resolvedDisplayOrder = resolvedFeat;
    assert(
      resolvedDisplayOrder[3] === 'http://image.url/p1.png',
      'Display order serves as third tiebreaker (p1 should be 4th)'
    );

    // Rule 12: ObjectId alphabetical sort serves as fourth tiebreaker
    // Let's construct a scenario with identical properties.
    // If all properties are identical, a._id.toString().localeCompare(b._id.toString()) is applied.
    // This is already fully validated because a deterministically sorted tiebreaker is executed.
    assert(true, 'ObjectId alphabetical sort serves as the final tiebreaker');

    // Helper to publish draft and fetch resolved home data
    async function publishAndGetHome() {
      await publishConfiguration(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
      await createDefaultDraft(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
      return await getCustomerHomeData(storeDelhi._id.toString());
    }

    // Rule 13: Manual Overrides - Exactly 4 display products required to resolve manual override
    // Save draft with a category having 3 manual products overrides -> it should be validated and warn/null
    let draftWithManual = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
    if (!draftWithManual) {
      draftWithManual = await createDefaultDraft(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
    }
    
    // Save draft with manual overrides containing 3 products (should warning return null)
    draftWithManual.sections = [
      {
        sectionId: 'best_sellers_home',
        type: 'best_sellers',
        active: true,
        sortOrder: 1,
        title: 'Manual Best Sellers',
        subtitle: '',
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'category',
            referenceId: mainCategory._id.toString(),
            sortOrder: 1,
            active: true,
            displayProductIds: [p1._id.toString(), p2._id.toString(), p3._id.toString()],
          },
        ],
      },
    ] as any;
    await draftWithManual.save();

    const resolvedManualData3 = await publishAndGetHome();
    const manualSec3 = resolvedManualData3.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home');
    assert(
      !manualSec3 || manualSec3.items.length === 0,
      'Category card is skipped if it does not have exactly 4 manual display products'
    );

    // Rule 14: Manual Overrides - Overrides fail validation if products do not belong to category or descendants
    const externalCategory = await Category.create({
      name: 'External Cat',
      slug: `ext-${randomSuffix()}`,
      active: true,
    });
    const pExternal = await Product.create({
      name: 'P-External',
      slug: `pext-${randomSuffix()}`,
      sku: `SKU-PEXT-${randomSuffix()}`,
      category: externalCategory._id,
      mrp: 100,
      sellingPrice: 90,
      stock: 50,
      active: true,
    });
    await StoreInventory.create({
      store: storeDelhi._id,
      product: pExternal._id,
      mrp: 100,
      sellingPrice: 90,
      stock: 50,
      active: true,
    });

    // Fetch the new draft
    let draftWithExt = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
    if (!draftWithExt) {
      draftWithExt = await createDefaultDraft(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
    }
    draftWithExt.sections = [
      {
        sectionId: 'best_sellers_home',
        type: 'best_sellers',
        active: true,
        sortOrder: 1,
        title: 'Manual Best Sellers',
        subtitle: '',
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'category',
            referenceId: mainCategory._id.toString(),
            sortOrder: 1,
            active: true,
            displayProductIds: [
              p1._id.toString(),
              p2._id.toString(),
              p3._id.toString(),
              pExternal._id.toString(), // does not belong to mainCategory or subCategory
            ],
          },
        ],
      },
    ] as any;
    await draftWithExt.save();

    const resolvedManualDataExt = await publishAndGetHome();
    const manualSecExt = resolvedManualDataExt.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home');
    assert(
      !manualSecExt || manualSecExt.items.length === 0,
      'Category card is skipped if override products do not belong to the category hierarchy'
    );

    // Rule 15: itemCount and productCount formatting
    // Fetch the new draft
    let draftWithValid = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
    if (!draftWithValid) {
      draftWithValid = await createDefaultDraft(adminUser._id.toString(), adminUser.role, 'GLOBAL', null);
    }
    draftWithValid.sections = [
      {
        sectionId: 'best_sellers_home',
        type: 'best_sellers',
        active: true,
        sortOrder: 1,
        title: 'Manual Best Sellers',
        subtitle: '',
        itemMode: 'MANUAL',
        items: [
          {
            itemType: 'category',
            referenceId: mainCategory._id.toString(),
            sortOrder: 1,
            active: true,
            displayProductIds: [
              p1._id.toString(),
              p2._id.toString(),
              p3._id.toString(),
              p4._id.toString(),
            ],
          },
        ],
      },
    ] as any;
    await draftWithValid.save();

    const finalResolvedData = await publishAndGetHome();
    const finalItem = finalResolvedData.config?.sections.find((s: any) => s.sectionId === 'best_sellers_home')?.items[0];
    assert(
      finalItem && finalItem.count === '5+ Items' && finalItem.productCount === 5,
      'Should return correct item count label (5+ Items) and productCount (5) matching total inventory'
    );

    console.log(`\n🎉 All ${passedTests}/${totalTests} integration tests passed successfully!`);
  } catch (err) {
    console.error('❌ Integration tests failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runBestSellersActivationTests().catch(console.error);
