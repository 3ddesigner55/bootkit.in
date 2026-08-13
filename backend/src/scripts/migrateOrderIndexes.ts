import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/order.model';
import Cart from '../models/cart.model';

export type MigrationOptions = {
  execute?: boolean;
  allowProduction?: boolean;
};

export async function runOrderIndexMigration(options: MigrationOptions = {}) {
  const isExecute = options.execute === true;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  console.log(`\n======================================================`);
  console.log(`ORDER & CART INDEX MIGRATION SCRIPT`);
  console.log(`Mode: ${isExecute ? 'EXECUTE' : 'DRY RUN (Read Only)'}`);
  console.log(`Target Database: ${primaryDb}`);
  console.log(`======================================================\n`);

  if (isExecute && !options.allowProduction) {
    throw new Error(
      'SAFETY LOCK: Explicit confirmation (allowProduction: true) is required to execute changes on production databases.',
    );
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri, {
      dbName: primaryDb,
    });
  }

  const orderCollection = Order.collection;
  const cartCollection = Cart.collection;

  // 1. Audit Order Indexes
  console.log('--- Step 1: Auditing Order Indexes ---');
  const existingOrderIndexes = await orderCollection.listIndexes().toArray();
  console.log('Current Order indexes in database:');
  for (const idx of existingOrderIndexes) {
    console.log(` - Name: "${idx.name}", Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}, Sparse: ${!!idx.sparse}, PartialFilter: ${JSON.stringify(idx.partialFilterExpression || null)}`);
  }

  // Check for obsolete global idempotencyKey index
  const legacyGlobalIndex = existingOrderIndexes.find(
    (idx) => idx.name === 'idempotencyKey_1' && Object.keys(idx.key).length === 1 && idx.key.idempotencyKey === 1,
  );

  if (legacyGlobalIndex) {
    console.log(`⚠️ Detected legacy global index "idempotencyKey_1".`);
    if (isExecute) {
      console.log(`Dropping verified legacy index "idempotencyKey_1"...`);
      await orderCollection.dropIndex('idempotencyKey_1');
      console.log(`✅ Dropped legacy index "idempotencyKey_1".`);
    } else {
      console.log(`[DRY RUN] Would drop legacy index "idempotencyKey_1".`);
    }
  }

  // 2. Check for conflicting duplicate order data
  console.log('\n--- Step 2: Checking for Conflicting Duplicate Order Data ---');
  const duplicateOrders = await Order.aggregate([
    { $match: { idempotencyKey: { $exists: true, $type: 'string', $ne: '' } } },
    {
      $group: {
        _id: { user: '$user', idempotencyKey: '$idempotencyKey' },
        count: { $sum: 1 },
        orderNumbers: { $push: '$orderNumber' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicateOrders.length > 0) {
    console.error(`❌ CONFLICT DETECTED: Found ${duplicateOrders.length} duplicate (user + idempotencyKey) records:`, duplicateOrders);
    throw new Error('Data conflict: Cannot apply unique index until duplicate orders are resolved.');
  } else {
    console.log('✅ No duplicate (user + idempotencyKey) conflicts found.');
  }

  // 3. Create named compound partial unique index on Order
  console.log('\n--- Step 3: Ensuring Named Compound Partial Unique Index ---');
  const targetIndexName = 'uniq_user_idempotencyKey';
  const existingTarget = existingOrderIndexes.find((idx) => idx.name === targetIndexName);

  if (existingTarget) {
    console.log(`✅ Index "${targetIndexName}" already exists with valid definition.`);
  } else {
    if (isExecute) {
      console.log(`Creating index "${targetIndexName}"...`);
      await orderCollection.createIndex(
        { user: 1, idempotencyKey: 1 },
        {
          unique: true,
          name: targetIndexName,
          partialFilterExpression: { idempotencyKey: { $type: 'string' } },
        },
      );
      console.log(`✅ Created index "${targetIndexName}".`);
    } else {
      console.log(`[DRY RUN] Would create index "${targetIndexName}": { user: 1, idempotencyKey: 1 } (unique, partialFilterExpression).`);
    }
  }

  // 4. Audit Cart Indexes
  console.log('\n--- Step 4: Auditing Cart Indexes ---');
  const existingCartIndexes = await cartCollection.listIndexes().toArray();
  console.log('Current Cart indexes in database:');
  for (const idx of existingCartIndexes) {
    console.log(` - Name: "${idx.name}", Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
  }

  // 5. Final Verification
  console.log('\n--- Step 5: Verification ---');
  const finalOrderIndexes = await orderCollection.listIndexes().toArray();
  console.log('Verified Order Indexes:');
  for (const idx of finalOrderIndexes) {
    console.log(` - Name: "${idx.name}", Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
  }

  console.log('\nMigration plan completed successfully.');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const allowProd = args.includes('--allow-production');

  runOrderIndexMigration({ execute: isExecute, allowProduction: allowProd })
    .then(() => {
      console.log('\nDone.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nMigration script failed:', err.message);
      process.exit(1);
    });
}
