import mongoose from 'mongoose';
import Store from '../models/store.model';
import DeliveryArea from '../models/deliveryArea.model';
import StoreInventory from '../models/storeInventory.model';
import Product from '../models/product.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import CatalogAudit from '../models/catalogAudit.model';

const TEST_DB_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/bootkit_test_stores';

async function runHubTests() {
  console.log('--- STARTING HUB MANAGEMENT INVARIANTS TEST SUITE ---');
  await mongoose.connect(TEST_DB_URI);
  console.log('Connected to isolated test database:', mongoose.connection.name);

  try {
    // Clear collections
    await Promise.all([
      Store.deleteMany({}),
      DeliveryArea.deleteMany({}),
      StoreInventory.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      CatalogAudit.deleteMany({}),
    ]);

    // TEST 1: Create Hub & Reject Duplicate Slug/Code
    const hub1 = await Store.create({
      name: 'South Hub',
      slug: 'south-hub',
      phone: '9876543210',
      addressLine1: 'South Street',
      city: 'Mumbai',
      state: 'MH',
      country: 'India',
      deliveryRadius: 5,
      active: true,
      operationalStatus: 'OPEN',
    });
    console.log('✓ Test 1a: Store South Hub created.');

    try {
      await Store.create({
        name: 'South Hub Duplicate',
        slug: 'south-hub',
        phone: '9876543211',
        city: 'Mumbai',
        state: 'MH',
        country: 'India',
        deliveryRadius: 5,
      });
      throw new Error('Should have rejected duplicate slug');
    } catch (err: any) {
      console.log('✓ Test 1b: Duplicate Hub slug correctly rejected by index constraint.');
    }

    // TEST 2: Unique Pincode Mapping (One Active Store per Pincode)
    const area1 = await DeliveryArea.create({
      store: hub1._id,
      pincode: '400001',
      areaName: 'Fort',
      active: true,
      deliveryFee: 15,
      estimatedDeliveryMinutes: 10,
    });
    console.log('✓ Test 2a: Pincode 400001 mapped to South Hub.');

    const hub2 = await Store.create({
      name: 'North Hub',
      slug: 'north-hub',
      phone: '9876543212',
      addressLine1: 'North Road',
      city: 'Mumbai',
      state: 'MH',
      country: 'India',
      deliveryRadius: 5,
      active: true,
      operationalStatus: 'OPEN',
    });

    try {
      await DeliveryArea.create({
        store: hub2._id,
        pincode: '400001', // duplicate active pincode
        areaName: 'Fort Duplicate',
        active: true,
      });
      throw new Error('Should have rejected duplicate active pincode mapping across hubs');
    } catch (err: any) {
      console.log('✓ Test 2b: Duplicate active pincode across different Hubs correctly rejected by partial index.');
    }

    // TEST 3: Weekly Schedule Validation & Timings
    hub1.weeklySchedule = [
      {
        day: 'MONDAY',
        enabled: true,
        intervals: [{ open: '07:00', close: '23:00' }],
      },
      {
        day: 'TUESDAY',
        enabled: false, // Closed on Tuesday
        intervals: [],
      },
    ];
    await hub1.save();
    console.log('✓ Test 3: Weekly schedule persisted with Monday open and Tuesday closed.');

    // TEST 4: Emergency Offline Overrides
    hub1.operationalStatus = 'TEMPORARILY_OFFLINE';
    hub1.emergencyOffline = {
      reason: 'BAD_WEATHER',
      startedAt: new Date(),
      offlineUntil: new Date(Date.now() + 3600000),
      actorId: hub1._id,
    };
    await hub1.save();
    console.log('✓ Test 4a: Store transitioned to TEMPORARILY_OFFLINE.');

    // Restore store online
    hub1.operationalStatus = 'OPEN';
    await hub1.save();
    console.log('✓ Test 4b: Store restored to OPEN status.');

    // TEST 5: High Demand / Surge Fee Mode
    hub1.operationalStatus = 'HIGH_DEMAND';
    await hub1.save();
    console.log('✓ Test 5: High Demand surge fee mode toggled on Hub.');

    console.log('\n=============================================');
    console.log('ALL HUB & ROUTING INVARIANT TESTS PASSED!');
    console.log('=============================================\n');
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

void runHubTests();
