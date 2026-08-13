import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import User from '../models/user.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import Address from '../models/address.model';
import Cart from '../models/cart.model';
import Order from '../models/order.model';
import { addCartItem, clearCart, getCart, updateCartItem } from '../services/cart.service';
import { placeOrder } from '../services/order.service';
import { createStore, deleteStore } from '../services/store.service';
import Category from '../models/category.model';

function verifySafeTestDatabase(dbName: string) {

  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runCorrectionPassTests() {
  const testDbName = 'bootkit_phase1_test_isolated';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, {
    dbName: testDbName,
  });
  console.log(`✅ Connected safely to ISOLATED test database "${testDbName}" (Primary "${process.env.DB_NAME}" untouched).\n`);


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

  // --- Setup Entities ---
  let testUserA = await User.findOne({ email: 'test_usera@bootkit.test' });
  if (!testUserA) {
    testUserA = await User.create({
      email: 'test_usera@bootkit.test',
      firstName: 'UserA',
      lastName: 'Test',
      phone: '9888800001',
      role: 'CUSTOMER',
      isActive: true,
    });
  }

  let testUserB = await User.findOne({ email: 'test_userb@bootkit.test' });
  if (!testUserB) {
    testUserB = await User.create({
      email: 'test_userb@bootkit.test',
      firstName: 'UserB',
      lastName: 'Test',
      phone: '9888800002',
      role: 'CUSTOMER',
      isActive: true,
    });
  }

  let adminUser = await User.findOne({ email: 'admin_test@bootkit.test' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'admin_test@bootkit.test',
      firstName: 'Admin',
      lastName: 'Test',
      phone: '9888800003',
      role: 'ADMIN',
      isActive: true,
    });
  }

  let storeA = await Store.findOne({ slug: 'test-store-a-cp' });
  if (!storeA) {
    storeA = await Store.create({
      name: 'Test Store A',
      slug: 'test-store-a-cp',
      addressLine1: '123 Alpha St',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: '9888811111',
      active: true,
    });
  }

  let storeB = await Store.findOne({ slug: 'test-store-b-cp' });
  if (!storeB) {
    storeB = await Store.create({
      name: 'Test Store B',
      slug: 'test-store-b-cp',
      addressLine1: '456 Beta St',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560002',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: '9888822222',
      active: true,
    });
  }

  let testAddressA = await Address.findOne({ user: testUserA._id, deletedAt: null });
  if (!testAddressA) {
    testAddressA = await Address.create({
      user: testUserA._id,
      fullName: 'User A Address',
      phone: '9888800001',
      addressLine1: '123 Alpha St',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      label: 'HOME',
      isDefault: true,
    });
  }

  let testCat = await Category.findOne({ slug: 'cp-test-category' });

  if (!testCat) {
    testCat = await Category.create({
      name: 'CP Test Category',
      slug: 'cp-test-category',
      active: true,
    });
  }

  let prod1 = await Product.findOne({ slug: 'cp-test-prod-1' });
  if (!prod1) {
    prod1 = await Product.create({
      name: 'CP Test Product 1',
      slug: 'cp-test-prod-1',
      sku: 'CP-SKU-1',
      description: 'Test product 1',
      category: testCat._id,
      mrp: 500,
      sellingPrice: 450,
      stock: 100,
      active: true,
    });
  }

  let prod2 = await Product.findOne({ slug: 'cp-test-prod-2' });
  if (!prod2) {
    prod2 = await Product.create({
      name: 'CP Test Product 2',
      slug: 'cp-test-prod-2',
      sku: 'CP-SKU-2',
      description: 'Test product 2',
      category: testCat._id,
      mrp: 200,
      sellingPrice: 180,
      stock: 50,
      active: true,
    });
  }



  // Inventory for prod1 in Store A
  let invA1 = await StoreInventory.findOneAndUpdate(
    { store: storeA._id, product: prod1._id },
    {
      store: storeA._id,
      product: prod1._id,
      sellingPrice: 399,
      mrp: 499,
      stock: 25,
      reservedStock: 0,
      active: true,
      deletedAt: null,
    },
    { upsert: true, new: true },
  );

  // Inventory for prod2 in Store B
  let invB2 = await StoreInventory.findOneAndUpdate(
    { store: storeB._id, product: prod2._id },
    {
      store: storeB._id,
      product: prod2._id,
      sellingPrice: 150,
      mrp: 200,
      stock: 15,
      reservedStock: 0,
      active: true,
      deletedAt: null,
    },
    { upsert: true, new: true },
  );

  // ==========================================
  // TEST 1: Add to cart with Store A
  // ==========================================
  await clearCart(testUserA._id.toString());
  const cartA = await addCartItem(testUserA._id.toString(), {
    productId: prod1._id.toString(),
    quantity: 2,
    storeId: storeA._id.toString(),
  });
  assert(cartA.items.length === 1 && cartA.items[0].price === 399, 'Cart receives Store A inventory price (399)');
  assert(cartA.store?._id?.toString() === storeA._id.toString() || cartA.store?.toString() === storeA._id.toString(), 'Cart is locked to Store A');

  // ==========================================
  // TEST 2: Mixed-Store add returns HTTP 409 CART_STORE_MISMATCH
  // ==========================================
  let mismatchCaught = false;
  try {
    await addCartItem(testUserA._id.toString(), {
      productId: prod2._id.toString(),
      quantity: 1,
      storeId: storeB._id.toString(),
    });
  } catch (err: any) {
    if (err.statusCode === 409 && (err.code === 'CART_STORE_MISMATCH' || err.message.includes('another store'))) {
      mismatchCaught = true;
    }
  }
  assert(mismatchCaught, 'Adding item from Store B into Store A cart throws 409 CART_STORE_MISMATCH');

  // ==========================================
  // TEST 3: Existing Cart remains completely intact after mismatch
  // ==========================================
  const cartAfterMismatch = await getCart(testUserA._id.toString());
  assert(cartAfterMismatch.items.length === 1, 'Cart items count unchanged after rejected store mismatch');
  assert(cartAfterMismatch.items[0].product._id.toString() === prod1._id.toString(), 'Cart item 1 preserved');
  assert(cartAfterMismatch.items[0].quantity === 2, 'Cart item 1 quantity preserved');

  // ==========================================
  // TEST 4: Missing StoreInventory rejected (no master fallback)
  // ==========================================
  let missingInvCaught = false;
  try {
    // prod2 has no inventory in storeA
    await addCartItem(testUserA._id.toString(), {
      productId: prod2._id.toString(),
      quantity: 1,
      storeId: storeA._id.toString(),
    });
  } catch (err: any) {
    if (err.message.includes('not available at the selected store')) {
      missingInvCaught = true;
    }
  }
  assert(missingInvCaught, 'Missing StoreInventory rejected without master product fallback');

  // ==========================================
  // TEST 5: Inactive/deleted StoreInventory rejected
  // ==========================================
  invA1.active = false;
  await invA1.save();
  let inactiveInvCaught = false;
  try {
    const itemId = (cartAfterMismatch.items[0] as any)._id.toString();
    await updateCartItem(testUserA._id.toString(), itemId, { quantity: 3 });
  } catch (err: any) {
    inactiveInvCaught = true;
  }
  assert(inactiveInvCaught, 'Inactive StoreInventory rejected upon cart update');
  invA1.active = true;
  await invA1.save();


  // ==========================================
  // TEST 6: Client price/stock manipulation ignored
  // ==========================================
  const idempotencyKey1 = `idempotency-test-${Date.now()}`;
  const order1 = await placeOrder(testUserA._id.toString(), {
    addressId: testAddressA._id.toString(),
    storeId: storeA._id.toString(),
    paymentMethod: 'COD',
    idempotencyKey: idempotencyKey1,
  });
  assert(order1.items[0].sellingPrice === 399, 'OrderItem price comes strictly from StoreInventory (399)');
  assert(order1.grandTotal === 399 * 2, 'Grand total accurately calculated from StoreInventory price');

  // ==========================================
  // TEST 7: Same-customer same-key retry returns existing order
  // ==========================================
  const order1Retry = await placeOrder(testUserA._id.toString(), {
    addressId: testAddressA._id.toString(),
    storeId: storeA._id.toString(),
    paymentMethod: 'COD',
    idempotencyKey: idempotencyKey1,
  });
  assert(order1Retry.orderNumber === order1.orderNumber, 'Idempotent retry with same payload returns existing order');

  // ==========================================
  // TEST 8: Different customer with same idempotency key cannot read another customer\'s order
  // ==========================================
  let userBNoLeak = false;
  try {
    // User B submits same idempotency key with empty cart
    await placeOrder(testUserB._id.toString(), {
      addressId: testAddressA._id.toString(),
      storeId: storeA._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: idempotencyKey1,
    });
  } catch (err: any) {
    // Should fail because UserB cart is empty, NOT return UserA's order
    if (err.message.includes('Cart is empty')) {
      userBNoLeak = true;
    }
  }
  assert(userBNoLeak, 'Different customer cannot access or return another customer order by reusing idempotencyKey');

  // ==========================================
  // TEST 9: Same key with different payload returns 409 Conflict
  // ==========================================
  // Add item back to UserA cart
  await addCartItem(testUserA._id.toString(), {
    productId: prod1._id.toString(),
    quantity: 1,
    storeId: storeA._id.toString(),
  });
  let diffPayloadCaught = false;
  try {
    await placeOrder(testUserA._id.toString(), {
      addressId: testAddressA._id.toString(),
      storeId: storeA._id.toString(),
      paymentMethod: 'RAZORPAY', // Different payment method!
      idempotencyKey: idempotencyKey1,
    });
  } catch (err: any) {
    if (err.statusCode === 409 && (err.code === 'IDEMPOTENCY_CONFLICT' || err.message.includes('Idempotency key'))) {
      diffPayloadCaught = true;
    }
  }
  assert(diffPayloadCaught, 'Reusing idempotency key with different payload returns HTTP 409 IDEMPOTENCY_CONFLICT');

  // ==========================================
  // TEST 10: Atomic stock decrement on StoreInventory
  // ==========================================
  const invA1AfterOrder = await StoreInventory.findById(invA1._id);
  assert(invA1AfterOrder?.stock === 23, 'StoreInventory stock was decremented from 25 to 23');

  // ==========================================
  // TEST 11: Out of stock rejects order and preserves cart
  // ==========================================
  invA1AfterOrder!.stock = 0;
  await invA1AfterOrder!.save();
  let oosRejected = false;
  try {
    await placeOrder(testUserA._id.toString(), {
      addressId: testAddressA._id.toString(),
      storeId: storeA._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: `idemp-oos-${Date.now()}`,
    });
  } catch (err: any) {
    if (err.message.includes('Insufficient stock')) {
      oosRejected = true;
    }
  }
  assert(oosRejected, 'Order placement rejects when StoreInventory stock is insufficient');
  const cartAfterOos = await getCart(testUserA._id.toString());
  assert(cartAfterOos.items.length === 1, 'Failed order leaves customer cart intact');

  // ==========================================
  // TEST 12: RBAC - Seller forbidden from store creation
  // ==========================================
  let sellerBlockedCreate = false;
  try {
    await createStore(
      {
        name: 'Seller Fake Store',
        slug: 'seller-fake-store',
        addressLine1: 'Test St',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5000,
        phone: '9999999999',
      },
      testUserA._id.toString(),
      ['store-123'], // Seller scope simulation
    );
  } catch (err: any) {
    if (err.statusCode === 403) {
      sellerBlockedCreate = true;
    }
  }
  assert(sellerBlockedCreate, 'Seller is forbidden from creating new Stores (HTTP 403)');

  // ==========================================
  // TEST 13: RBAC - Seller forbidden from store deletion
  // ==========================================
  let sellerBlockedDelete = false;
  try {
    await deleteStore(storeB._id.toString(), testUserA._id.toString(), ['store-123']);
  } catch (err: any) {
    if (err.statusCode === 403) {
      sellerBlockedDelete = true;
    }
  }
  assert(sellerBlockedDelete, 'Seller is forbidden from deleting Stores (HTTP 403)');

  // ==========================================
  // TEST 14: Safe Store Soft-Deletion
  // ==========================================
  const softDeletedStore = await deleteStore(storeB._id.toString(), adminUser._id.toString(), null);
  assert(softDeletedStore.deletedAt !== null && softDeletedStore.active === false, 'Store deletion performs safe soft-delete with active=false');

  // ==========================================
  // TEST 15: Inactive/deleted Store rejected for new Cart additions
  // ==========================================
  let deletedStoreCartRejected = false;
  try {
    await addCartItem(testUserA._id.toString(), {
      productId: prod2._id.toString(),
      quantity: 1,
      storeId: storeB._id.toString(),
    });
  } catch (err: any) {
    if (err.message.includes('Store not found or inactive')) {
      deletedStoreCartRejected = true;
    }
  }
  assert(deletedStoreCartRejected, 'Deleted/inactive store rejected for cart operations');

  // ==========================================
  // TEST 16: RBAC - Customer forbidden from store creation/deletion
  // ==========================================

  let customerBlockedCreate = false;
  try {
    await createStore(
      {
        name: 'Customer Store',
        slug: 'customer-store',
        addressLine1: 'Test St',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5000,
        phone: '9999999999',
      },
      testUserA._id.toString(),
      ['store-customer'], // non-null scope
    );
  } catch (err: any) {
    if (err.statusCode === 403) customerBlockedCreate = true;
  }
  assert(customerBlockedCreate, 'Customer/non-admin is forbidden from creating Stores (HTTP 403)');

  console.log(`\n======================================================`);
  console.log(`ALL PHASE 1 CORRECTION PASS TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log(`======================================================\n`);

  // Clean up isolated test database
  await mongoose.connection.dropDatabase();
  console.log('🧹 Cleaned up isolated test database.');
  await mongoose.disconnect();
}

runCorrectionPassTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

