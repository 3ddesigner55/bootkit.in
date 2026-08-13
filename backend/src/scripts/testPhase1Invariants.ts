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
import { addCartItem, clearCart, getCart } from '../services/cart.service';
import { placeOrder } from '../services/order.service';
import { createStore } from '../services/store.service';


async function runTests() {
  await connectDatabase();
  console.log('Connected to DB for invariant testing.');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Setup mock user, address, store, products, and store inventory
  const testUser = await User.findOne({ email: '3ddesigner5546@gmail.com' }) || await User.findOne({ isActive: true, deletedAt: null });
  if (!testUser) throw new Error('No active user found in DB');

  let testStore = await Store.findOne({ active: true, deletedAt: null });
  if (!testStore) {
    testStore = await Store.create({
      name: 'Test Invariant Store',
      slug: 'test-invariant-store',
      addressLine1: 'Test St',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      deliveryRadius: 5000,
      phone: '9999999999',
      active: true,
    });
  }


  let testAddress = await Address.findOne({ user: testUser._id, deletedAt: null });
  if (!testAddress) {
    testAddress = await Address.create({
      user: testUser._id,
      fullName: 'Test User',
      phone: '9999999999',
      addressLine1: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      label: 'HOME',
      isDefault: true,
    });
  }


  const testProduct = await Product.findOne({ active: true, deletedAt: null, stock: { $gte: 10 } });
  if (!testProduct) throw new Error('No active product found in DB');

  // Ensure StoreInventory exists for testProduct in testStore
  let inventory = await StoreInventory.findOne({
    store: testStore._id,
    product: testProduct._id,
    deletedAt: null,
  });

  const customStorePrice = 999;
  const initialStock = 20;

  if (inventory) {
    inventory.sellingPrice = customStorePrice;
    inventory.stock = initialStock;
    inventory.reservedStock = 0;
    inventory.active = true;
    await inventory.save();
  } else {
    inventory = await StoreInventory.create({
      store: testStore._id,
      product: testProduct._id,
      sellingPrice: customStorePrice,
      mrp: customStorePrice + 100,
      stock: initialStock,
      reservedStock: 0,
      active: true,
      trackInventory: true,
    });
  }

  // TEST 1: StoreInventory price used instead of master Product price
  await clearCart(testUser._id.toString());
  const cartAfterAdd = await addCartItem(testUser._id.toString(), {
    productId: testProduct._id.toString(),
    quantity: 2,
    storeId: testStore._id.toString(),
  });

  assert(cartAfterAdd.items[0].price === customStorePrice, 'Cart uses StoreInventory price, not client/master price');
  assert(cartAfterAdd.store?._id?.toString() === testStore._id.toString() || cartAfterAdd.store?.toString() === testStore._id.toString(), 'Cart is locked to selected store');

  // TEST 2: Out of stock item rejected during order placement
  inventory.stock = 1;
  await inventory.save();
  let oosErrorThrown = false;
  try {
    await placeOrder(testUser._id.toString(), {
      addressId: testAddress._id.toString(),
      storeId: testStore._id.toString(),
      paymentMethod: 'COD',
      idempotencyKey: `oos-key-${Date.now()}`,
    });
  } catch (err: any) {

    oosErrorThrown = true;
    console.log('Caught expected OOS error:', err.message);
    assert(err.message.toLowerCase().includes('stock') || err.message.toLowerCase().includes('insufficient'), 'Out of stock rejected with clear error');
  }

  assert(oosErrorThrown, 'Order placement rejects when StoreInventory stock < cart quantity');

  // TEST 3: Atomic stock decrement and snapshot creation
  inventory.stock = initialStock;
  await inventory.save();

  const idempotencyKey = `test-order-${Date.now()}`;
  const placedOrder = await placeOrder(testUser._id.toString(), {
    addressId: testAddress._id.toString(),
    storeId: testStore._id.toString(),
    paymentMethod: 'COD',
    idempotencyKey,
  });

  assert(placedOrder.items[0].sellingPrice === customStorePrice, 'Order snapshot records StoreInventory price');
  assert(placedOrder.items[0].quantity === 2, 'Order records correct item quantity');
  assert(placedOrder.grandTotal === customStorePrice * 2, 'Grand total correctly computed from StoreInventory');

  // Check that inventory was atomically decremented by 2
  const updatedInventory = await StoreInventory.findById(inventory._id);
  assert(updatedInventory?.stock === initialStock - 2, 'StoreInventory stock was atomically decremented');

  // TEST 4: Idempotency protection against duplicate order submissions
  const duplicateOrder = await placeOrder(testUser._id.toString(), {
    addressId: testAddress._id.toString(),
    storeId: testStore._id.toString(),
    paymentMethod: 'COD',
    idempotencyKey,
  });

  assert(duplicateOrder.orderNumber === placedOrder.orderNumber, 'Idempotency returns existing order without creating a duplicate');

  // TEST 5: Seller forbidden from creating a store
  let sellerBlockedFromStoreCreate = false;
  try {
    await createStore(
      {
        name: 'Unauthorized Seller Store',
        slug: 'unauthorized-seller-store',
        addressLine1: '123 Fake St',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5000,
        phone: '9999999999',
      },
      testUser._id.toString(),
      ['some-other-store-id'], // Seller scope simulated
    );

  } catch (err: any) {
    if (err.statusCode === 403 || err.message.includes('Access denied')) {
      sellerBlockedFromStoreCreate = true;
    }
  }
  assert(sellerBlockedFromStoreCreate, 'Seller is forbidden from creating new Stores');

  console.log(`\n========================================`);
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
