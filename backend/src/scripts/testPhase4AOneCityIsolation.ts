import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import Store from '../models/store.model';
import Product from '../models/product.model';
import Category from '../models/category.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import Address from '../models/address.model';
import Cart from '../models/cart.model';
import Order from '../models/order.model';
import HomeConfig from '../models/homeConfig.model';
import { getHomeData } from '../services/home.service';
import { addCartItem, getCart } from '../services/cart.service';
import { placeOrder } from '../services/order.service';

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runPhase4ATests() {
  console.log('--- STARTING PHASE 4A ONE-CITY ISOLATION & INVARIANT TESTS ---');

  const testDbName = 'bootkit_phase4a_test_isolation';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, { dbName: testDbName });
  console.log(`✅ Connected safely to ISOLATED test database "${testDbName}" (Primary DB untouched).\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Default Store Configuration & Resolution
    // ----------------------------------------------------
    console.log('--- Test 1: Default Store Configuration & Resolution ---');

    await Store.deleteMany({});
    await Product.deleteMany({});
    await StoreInventory.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    await Address.deleteMany({});

    // 1.1 No store exists -> returns null/undefined resolvedStoreId gracefully
    const emptyHome = await getHomeData();
    if (!emptyHome.resolvedStoreId) {
      console.log('✅ [PASS 1] Controlled handling when no active store exists (resolvedStoreId is undefined/null)');
    } else {
      throw new Error(`Expected undefined/null resolvedStoreId, got ${emptyHome.resolvedStoreId}`);
    }

    const randomSuffix = () => Math.floor(10000000 + Math.random() * 90000000).toString();

    // Create 2 Stores: Store A (non-default), Store B (default)
    const storeA = await Store.create({
      name: 'Secondary Store',
      slug: `secondary-store-${Date.now()}-${randomSuffix()}`,
      phone: `98${randomSuffix()}`,
      city: 'Sardarshahar',
      state: 'Rajasthan',
      country: 'India',
      deliveryRadius: 10,
      active: true,
      isDefault: false,
      displayOrder: 2,
    });

    const storeB = await Store.create({
      name: 'Default Warehouse Sardarshahar',
      slug: `default-warehouse-${Date.now()}-${randomSuffix()}`,
      phone: `98${randomSuffix()}`,
      city: 'Sardarshahar',
      state: 'Rajasthan',
      country: 'India',
      deliveryRadius: 15,
      active: true,
      isDefault: true,
      displayOrder: 1,
    });

    // 1.2 getHomeData() without query resolves default store (Store B)
    const homeDefault = await getHomeData();
    if (homeDefault.resolvedStoreId === storeB._id.toString()) {
      console.log('✅ [PASS 2] Unscoped query automatically resolves isDefault: true Store B');
    } else {
      throw new Error(`Expected Store B ID (${storeB._id}), got ${homeDefault.resolvedStoreId}`);
    }

    // 1.3 Deterministic resolution by displayOrder/createdAt if no store has isDefault: true
    await Store.updateOne({ _id: storeB._id }, { $set: { isDefault: false } });
    const homeFallback = await getHomeData();
    if (homeFallback.resolvedStoreId === storeB._id.toString()) {
      console.log('✅ [PASS 3] Fallback resolves deterministically by displayOrder (Store B displayOrder 1 < Store A displayOrder 2)');
    } else {
      throw new Error(`Expected Store B ID, got ${homeFallback.resolvedStoreId}`);
    }

    // Re-enable isDefault on Store B
    await Store.updateOne({ _id: storeB._id }, { $set: { isDefault: true } });

    // ----------------------------------------------------
    // TEST 2: End-to-End Store ID Invariant
    // Home resolvedStoreId -> ProductCard Add -> Cart.store -> Checkout -> Order.store
    // ----------------------------------------------------
    console.log('\n--- Test 2: End-to-End Store ID Invariant (Home -> Cart -> Order) ---');

    // Create category & product
    const category = await Category.create({
      name: 'Dairy & Milk',
      slug: `dairy-milk-${Date.now()}-${randomSuffix()}`,
      active: true,
    });

    const customerUser = await User.create({
      email: `rahul_${Date.now()}_${randomSuffix()}@test.bootkit`,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: `98${randomSuffix()}`,
      role: 'CUSTOMER',
      isActive: true,
    });

    const customerAddress = await Address.create({
      user: customerUser._id,
      fullName: 'Rahul Sharma',
      phone: '9888800102',
      addressLine1: 'Flat 101, Galaxy Apts',
      city: 'Sardarshahar',
      state: 'Rajasthan',
      postalCode: '331403',
      country: 'India',
      label: 'HOME',
      isDefault: true,
    });

    const product = await Product.create({
      name: 'Fresh Farm Milk 1L',
      slug: `fresh-farm-milk-1l-${Date.now()}-${randomSuffix()}`,
      description: 'Pasteurized whole milk',
      category: category._id,
      sellingPrice: 60,
      mrp: 65,
      stock: 50,
      basePrice: 60,
      active: true,
    });


    // Create StoreInventory for Store B
    await StoreInventory.create({
      store: storeB._id,
      product: product._id,
      sellingPrice: 58,
      mrp: 65,
      stock: 50,
      isAvailable: true,
    });

    // Step A: Home query gives resolvedStoreId
    const homePayload = await getHomeData();
    const homeStoreId = homePayload.resolvedStoreId!;
    console.log(`- Home resolvedStoreId: ${homeStoreId}`);

    // Step B: ProductCard Add-to-cart using that exact Store ID
    const cart = await addCartItem(customerUser._id.toString(), {
      productId: product._id.toString(),
      quantity: 2,
      storeId: homeStoreId,
    });

    const cartStoreId = (cart.store as any)?._id
      ? (cart.store as any)._id.toString()
      : cart.store
        ? cart.store.toString()
        : null;
    console.log(`- Cart.store: ${cartStoreId}`);

    if (cartStoreId === homeStoreId) {
      console.log('✅ [PASS 4] Cart.store strictly matches Home resolvedStoreId');
    } else {
      throw new Error(`Cart store mismatch: ${cartStoreId} vs ${homeStoreId}`);
    }

    // Step C: Place Order / Checkout
    const orderResult = await placeOrder(customerUser._id.toString(), {
      addressId: customerAddress._id.toString(),
      storeId: homeStoreId,
      paymentMethod: 'COD',
      idempotencyKey: `phase4a_order_test_${Date.now()}_${randomSuffix()}`,
    });


    const orderStoreId = (orderResult.store as any)?._id
      ? (orderResult.store as any)._id.toString()
      : orderResult.store
        ? orderResult.store.toString()
        : null;
    console.log(`- Order.store: ${orderStoreId}`);



    if (orderStoreId === homeStoreId && orderStoreId === cartStoreId) {
      console.log('✅ [PASS 5] Order.store strictly equals Cart.store and Home resolvedStoreId');
    } else {
      throw new Error(`Order store mismatch: Order=${orderStoreId}, Cart=${cartStoreId}, Home=${homeStoreId}`);
    }

    // Step D: Verify stock was deducted from Store B inventory (50 -> 48)
    const inventoryB = await StoreInventory.findOne({ store: storeB._id, product: product._id });
    if (inventoryB && inventoryB.stock === 48) {
      console.log('✅ [PASS 6] StoreInventory stock correctly decremented from 50 to 48');
    } else {
      throw new Error(`Expected stock 48, got ${inventoryB?.stock}`);
    }

    // ----------------------------------------------------
    // TEST 3: Boundary & Import Audit for apps/customer-app
    // ----------------------------------------------------
    console.log('\n--- Test 3: apps/customer-app Boundary & Import Audit ---');

    const customerAppSrc = path.resolve(__dirname, '../../../apps/customer-app/src');
    if (!fs.existsSync(customerAppSrc)) {
      throw new Error(`apps/customer-app/src directory not found at ${customerAppSrc}`);
    }

    function getAllFiles(dir: string, fileList: string[] = []): string[] {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getAllFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          fileList.push(filePath);
        }
      }
      return fileList;
    }

    const allCustomerFiles = getAllFiles(customerAppSrc);
    console.log(`Auditing ${allCustomerFiles.length} source files in apps/customer-app/src...`);

    const forbiddenTerms = [
      'ProductAdminProvider',
      'CategoryAdminProvider',
      'BrandAdminProvider',
      'DeliveryAreaAdminProvider',
      'SellerProvider',
      'useAdminProducts',
      'useAdminCategories',
      'useAdminDeliveryAreas',
      'useAdminBrands',
      'useSellers',
      'OwnerGuard',
      'AdminGuard',
    ];

    let violations = 0;
    for (const file of allCustomerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const term of forbiddenTerms) {
        if (content.includes(term)) {
          console.error(`❌ [VIOLATION] File ${file} contains forbidden term "${term}"`);
          violations++;
        }
      }
    }

    if (violations === 0) {
      console.log('✅ [PASS 7] apps/customer-app contains 0 forbidden Admin/Owner/Seller provider/hook imports');
    } else {
      throw new Error(`Found ${violations} forbidden imports in customer-app`);
    }

    // Check routes in apps/customer-app/src/app
    const routes = fs.readdirSync(path.join(customerAppSrc, 'app'));
    const forbiddenRoutes = ['admin', 'owner', 'seller'];
    const foundForbiddenRoutes = routes.filter((r) => forbiddenRoutes.includes(r));

    if (foundForbiddenRoutes.length === 0) {
      console.log('✅ [PASS 8] apps/customer-app/src/app contains 0 admin/owner/seller routes');
    } else {
      throw new Error(`Found forbidden routes in customer-app: ${foundForbiddenRoutes.join(', ')}`);
    }

    console.log('\n======================================================');
    console.log('ALL PHASE 4A ONE-CITY ISOLATION TESTS PASSED: 8/8');
    console.log('======================================================\n');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
      console.log('🧹 Cleaned up isolated test database.');
    }
  }
}

runPhase4ATests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
