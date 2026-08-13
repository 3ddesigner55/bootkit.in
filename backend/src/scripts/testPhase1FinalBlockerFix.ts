import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import Address from '../models/address.model';
import Cart from '../models/cart.model';
import Order from '../models/order.model';
import Category from '../models/category.model';
import { addCartItem, clearCart, getCart, updateCartItem } from '../services/cart.service';
import { placeOrder } from '../services/order.service';
import { createStore, deleteStore } from '../services/store.service';

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runFinalBlockerTests() {
  const testDbName = 'bootkit_phase1_test_final_blockers';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, {
    dbName: testDbName,
  });
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

  // ==========================================
  // STEP 1: INITIALIZE MODELS AND AUDIT REAL DB INDEXES
  // ==========================================
  console.log('--- Step 1: Initializing indexes and auditing listIndexes() ---');
  await Order.init();
  await Cart.init();

  const orderIndexes = await Order.collection.listIndexes().toArray();
  const cartIndexes = await Cart.collection.listIndexes().toArray();

  const idempotencyIdx = orderIndexes.find((idx) => idx.name === 'uniq_user_idempotencyKey');
  assert(!!idempotencyIdx, 'Order has named index "uniq_user_idempotencyKey"');
  assert(idempotencyIdx?.unique === true, 'Index is unique: true');
  assert(idempotencyIdx?.sparse === undefined || idempotencyIdx?.sparse === false, 'Index does NOT have sparse: true');
  assert(
    idempotencyIdx?.partialFilterExpression?.idempotencyKey?.$type === 'string',
    'Index has valid partialFilterExpression: { idempotencyKey: { $type: "string" } }',
  );

  const cartUserIdx = cartIndexes.find((idx) => idx.key.user === 1);
  assert(!!cartUserIdx && cartUserIdx.unique === true, 'Cart has unique index on user: 1');

  // ==========================================
  // SETUP TEST DATA
  // ==========================================
  const randomSuffix = () => Math.floor(10000000 + Math.random() * 90000000).toString();

  const testCat = await Category.create({
    name: 'Blocker Test Category',
    slug: `blk-cat-${Date.now()}-${randomSuffix()}`,
    active: true,
  });

  const storeAlpha = await Store.create({
    name: 'Store Alpha',
    slug: `store-alpha-${Date.now()}-${randomSuffix()}`,
    addressLine1: 'Alpha St',
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

  const userAlice = await User.create({
    email: `alice_${Date.now()}_${randomSuffix()}@test.bootkit`,
    firstName: 'Alice',
    lastName: 'Test',
    phone: `98${randomSuffix()}`,
    role: 'CUSTOMER',
    isActive: true,
  });

  const userBob = await User.create({
    email: `bob_${Date.now()}_${randomSuffix()}@test.bootkit`,
    firstName: 'Bob',
    lastName: 'Test',
    phone: `98${randomSuffix()}`,
    role: 'CUSTOMER',
    isActive: true,
  });

  const adminUser = await User.create({
    email: `admin_${Date.now()}_${randomSuffix()}@test.bootkit`,
    firstName: 'Admin',
    lastName: 'User',
    phone: `98${randomSuffix()}`,
    role: 'ADMIN',
    isActive: true,
  });


  const addressAlice = await Address.create({
    user: userAlice._id,
    fullName: 'Alice Address',
    phone: '9888800102',
    addressLine1: '123 Alice St',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    label: 'HOME',
    isDefault: true,
  });

  const prodA = await Product.create({
    name: 'Product A',
    slug: `prod-a-${Date.now()}`,
    sku: `SKU-A-${Date.now()}`,
    category: testCat._id,
    mrp: 100,
    sellingPrice: 90,
    stock: 50,
    active: true,
  });

  const prodB = await Product.create({
    name: 'Product B',
    slug: `prod-b-${Date.now()}`,
    sku: `SKU-B-${Date.now()}`,
    category: testCat._id,
    mrp: 200,
    sellingPrice: 180,
    stock: 50,
    active: true,
  });

  const invA = await StoreInventory.create({
    store: storeAlpha._id,
    product: prodA._id,
    sellingPrice: 85,
    mrp: 100,
    stock: 10,
    reservedStock: 0,
    active: true,
  });

  const invB = await StoreInventory.create({
    store: storeAlpha._id,
    product: prodB._id,
    sellingPrice: 170,
    mrp: 200,
    stock: 0, // Out of stock for multi-item rollback test!
    reservedStock: 0,
    active: true,
  });

  // ==========================================
  // TEST 2: CONCURRENT IDEMPOTENCY SAFETY
  // ==========================================
  console.log('\n--- Test: Concurrent Idempotency ---');
  await clearCart(userAlice._id.toString());
  await addCartItem(userAlice._id.toString(), {
    productId: prodA._id.toString(),
    quantity: 2,
    storeId: storeAlpha._id.toString(),
  });

  const idempKeyConcurrent = `idemp-concurrent-${Date.now()}`;
  const concurrentOrderPromises = [
    placeOrder(userAlice._id.toString(), {
      addressId: addressAlice._id.toString(),
      storeId: storeAlpha._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: idempKeyConcurrent,
    }),
    placeOrder(userAlice._id.toString(), {
      addressId: addressAlice._id.toString(),
      storeId: storeAlpha._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: idempKeyConcurrent,
    }),
  ];

  const results = await Promise.allSettled(concurrentOrderPromises);
  const successfulResults = results.filter((r) => r.status === 'fulfilled');
  assert(successfulResults.length >= 1, 'At least one concurrent placeOrder succeeded');

  const ordersInDb = await Order.find({
    user: userAlice._id,
    idempotencyKey: idempKeyConcurrent,
  });
  assert(ordersInDb.length === 1, 'Exactly ONE Order document exists in MongoDB for the concurrent requests');

  const invAAfterConcurrent = await StoreInventory.findById(invA._id);
  assert(invAAfterConcurrent?.stock === 8, 'Stock was decremented exactly once (10 -> 8) across concurrent requests');

  // ==========================================
  // TEST 3: MULTI-ITEM TRANSACTION ROLLBACK
  // ==========================================
  console.log('\n--- Test: Multi-Item Transaction Rollback ---');
  await addCartItem(userAlice._id.toString(), {
    productId: prodA._id.toString(),
    quantity: 2,
    storeId: storeAlpha._id.toString(),
  });

  // Force add out-of-stock prodB directly to cart to simulate multi-item cart
  const cartAlice = await Cart.findOne({ user: userAlice._id });
  cartAlice!.items.push({
    product: prodB._id,
    quantity: 1,
    price: 170,
  });
  await cartAlice!.save();

  const stockBeforeFailedTx = (await StoreInventory.findById(invA._id))?.stock;
  let multiItemErrorThrown = false;
  try {
    await placeOrder(userAlice._id.toString(), {
      addressId: addressAlice._id.toString(),
      storeId: storeAlpha._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: `idemp-multi-fail-${Date.now()}`,
    });
  } catch (err: any) {
    if (err.message.includes('Insufficient stock')) {
      multiItemErrorThrown = true;
    }
  }
  assert(multiItemErrorThrown, 'Multi-item order with out-of-stock Item B threw Insufficient stock error');

  const stockAfterFailedTx = (await StoreInventory.findById(invA._id))?.stock;
  assert(stockAfterFailedTx === stockBeforeFailedTx, 'Item A stock was completely rolled back/preserved upon Item B failure');

  const cartAfterFailedTx = await Cart.findOne({ user: userAlice._id });
  assert(cartAfterFailedTx!.items.length === 2, 'Customer cart remained intact after multi-item transaction rollback');

  // ==========================================
  // TEST 4: CONCURRENT STOCK OVER-ALLOCATION TEST
  // ==========================================
  console.log('\n--- Test: Concurrent Stock Over-Allocation ---');
  // Stock is 8. Set stock to 3.
  invA.stock = 3;
  await invA.save();

  // Clean cart for Alice and Bob
  await clearCart(userAlice._id.toString());
  await addCartItem(userAlice._id.toString(), {
    productId: prodA._id.toString(),
    quantity: 2,
    storeId: storeAlpha._id.toString(),
  });

  const addressBob = await Address.create({
    user: userBob._id,
    fullName: 'Bob Address',
    phone: '9888800103',
    addressLine1: '456 Bob St',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    label: 'HOME',
    isDefault: true,
  });

  await clearCart(userBob._id.toString());
  await addCartItem(userBob._id.toString(), {
    productId: prodA._id.toString(),
    quantity: 2,
    storeId: storeAlpha._id.toString(),
  });

  // Alice and Bob both attempt to buy quantity 2 when available stock is only 3!
  const stockRacePromises = [
    placeOrder(userAlice._id.toString(), {
      addressId: addressAlice._id.toString(),
      storeId: storeAlpha._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: `idemp-race-alice-${Date.now()}`,
    }),
    placeOrder(userBob._id.toString(), {
      addressId: addressBob._id.toString(),
      storeId: storeAlpha._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: `idemp-race-bob-${Date.now()}`,
    }),
  ];

  const raceResults = await Promise.allSettled(stockRacePromises);
  const raceSuccesses = raceResults.filter((r) => r.status === 'fulfilled');
  const raceFailures = raceResults.filter((r) => r.status === 'rejected');

  assert(raceSuccesses.length === 1, 'Exactly one order succeeded in the stock race (2 <= 3)');
  assert(raceFailures.length === 1, 'Exactly one order failed due to stock over-allocation (4 > 3)');

  const finalInvA = await StoreInventory.findById(invA._id);
  assert(finalInvA?.stock === 1, 'Final stock is exactly 1 (never negative)');

  // ==========================================
  // TEST 5: LEGACY STORELESS CART HANDLING
  // ==========================================
  console.log('\n--- Test: Legacy Storeless Cart ---');
  // Create a legacy storeless cart for Alice with items
  await Cart.updateOne(
    { user: userAlice._id },
    {
      store: null,
      items: [{ product: prodA._id, quantity: 1, price: 85 }],
      totalItems: 1,
      subtotal: 85,
    },
  );

  const rawCart = await Cart.findOne({ user: userAlice._id });
  let storeSelectionRequiredCaught = false;
  try {
    const itemId = rawCart!.items[0]._id!.toString();
    await updateCartItem(userAlice._id.toString(), itemId, { quantity: 2 });
  } catch (err: any) {
    if (err.code === 'STORE_SELECTION_REQUIRED' || err.message.includes('Store selection is required')) {
      storeSelectionRequiredCaught = true;
    }
  }
  assert(storeSelectionRequiredCaught, 'Legacy storeless cart returns STORE_SELECTION_REQUIRED on update');

  const cartPreserved = await Cart.findOne({ user: userAlice._id });
  assert(cartPreserved!.items.length === 1, 'Legacy cart items remain untouched without silent clearing');

  // ==========================================
  // TEST 6: RBAC COMPLETE SUITE
  // ==========================================
  console.log('\n--- Test: Complete RBAC Suite ---');
  // ADMIN create and soft-delete
  const adminStore = await createStore(
    {
      name: 'Admin Store',
      slug: `admin-store-${Date.now()}`,
      addressLine1: 'Admin Way',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: '9999999901',
    },
    adminUser._id.toString(),
    null,
  );
  assert(!!adminStore, 'ADMIN is authorized to create Store');

  const adminDeleted = await deleteStore(adminStore._id.toString(), adminUser._id.toString(), null);
  assert(adminDeleted.active === false && adminDeleted.deletedAt !== null, 'ADMIN is authorized to soft-delete Store');

  // OWNER create and soft-delete (null allowedStoreIds represents full access)
  const ownerStore = await createStore(
    {
      name: 'Owner Store',
      slug: `owner-store-${Date.now()}`,
      addressLine1: 'Owner Way',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: '9999999902',
    },
    adminUser._id.toString(),
    null,
  );
  assert(!!ownerStore, 'OWNER is authorized to create Store');

  // SELLER forbidden from creating/deleting
  let sellerBlockedCreate = false;
  try {
    await createStore(
      {
        name: 'Seller Store',
        slug: `seller-store-${Date.now()}`,
        addressLine1: 'Seller Way',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5000,
        phone: '9999999903',
      },
      userAlice._id.toString(),
      ['store-assigned-1'],
    );
  } catch (err: any) {
    if (err.statusCode === 403) sellerBlockedCreate = true;
  }
  assert(sellerBlockedCreate, 'SELLER is forbidden from creating Store (HTTP 403)');

  let sellerBlockedDelete = false;
  try {
    await deleteStore(ownerStore._id.toString(), userAlice._id.toString(), ['store-assigned-1']);
  } catch (err: any) {
    if (err.statusCode === 403) sellerBlockedDelete = true;
  }
  assert(sellerBlockedDelete, 'SELLER is forbidden from deleting Store (HTTP 403)');

  // CUSTOMER forbidden
  let customerBlocked = false;
  try {
    await createStore(
      {
        name: 'Customer Store',
        slug: `customer-store-${Date.now()}`,
        addressLine1: 'Cust Way',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5000,
        phone: '9999999904',
      },
      userAlice._id.toString(),
      ['scope-cust'],
    );
  } catch (err: any) {
    if (err.statusCode === 403) customerBlocked = true;
  }
  assert(customerBlocked, 'CUSTOMER is forbidden from creating Store (HTTP 403)');

  // ==========================================
  // TEST 7: BUSINESS INVARIANTS - INACTIVE/DELETED ENTITIES
  // ==========================================
  console.log('\n--- Test: Business Invariants ---');
  // Inactive Product
  prodA.active = false;
  await prodA.save();
  let inactiveProdRejected = false;
  try {
    await addCartItem(userBob._id.toString(), {
      productId: prodA._id.toString(),
      quantity: 1,
      storeId: storeAlpha._id.toString(),
    });
  } catch (err: any) {
    if (err.message.includes('Product not found or inactive')) inactiveProdRejected = true;
  }
  assert(inactiveProdRejected, 'Inactive Product is rejected from cart operations');
  prodA.active = true;
  await prodA.save();

  // Inactive Store
  storeAlpha.active = false;
  await storeAlpha.save();
  let inactiveStoreRejected = false;
  try {
    await addCartItem(userBob._id.toString(), {
      productId: prodA._id.toString(),
      quantity: 1,
      storeId: storeAlpha._id.toString(),
    });
  } catch (err: any) {
    if (err.message.includes('Store not found or inactive')) inactiveStoreRejected = true;
  }
  assert(inactiveStoreRejected, 'Inactive Store is rejected from cart operations');
  storeAlpha.active = true;
  await storeAlpha.save();

  console.log(`\n======================================================`);
  console.log(`ALL FINAL BLOCKER FIX TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log(`======================================================\n`);

  await mongoose.connection.dropDatabase();
  console.log('🧹 Cleaned up isolated test database.');
  await mongoose.disconnect();
}

runFinalBlockerTests().catch((err) => {
  console.error('Final blocker test execution failed:', err);
  process.exit(1);
});
