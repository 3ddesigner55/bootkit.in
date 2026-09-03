import mongoose from 'mongoose';
import User from '../models/user.model';
import CustomerCounter from '../models/customerCounter.model';
import { allocateCustomerCode } from '../services/customerCode.service';

async function migrate() {
  console.log('=== STARTING CUSTOMER CODE MIGRATION SCRIPT ===');

  // Guard 1: Require explicit separate MONGODB_MIGRATION_URI
  const migrationUri = process.env.MONGODB_MIGRATION_URI;
  if (!migrationUri) {
    console.error('ERROR: MONGODB_MIGRATION_URI environment variable is required.');
    process.exit(1);
  }

  // Guard 2: Require MIGRATION_DB_NAME
  const migrationDbName = process.env.MIGRATION_DB_NAME;
  if (!migrationDbName) {
    console.error('ERROR: MIGRATION_DB_NAME environment variable is required.');
    process.exit(1);
  }

  // Guard 3: Confirm database name matching exactly
  const confirmDbName = process.env.CONFIRM_DB_NAME;
  if (confirmDbName !== migrationDbName) {
    console.error(`ERROR: CONFIRM_DB_NAME environment variable (currently: "${confirmDbName}") must match MIGRATION_DB_NAME ("${migrationDbName}") to confirm target database.`);
    process.exit(1);
  }

  // Guard 4: Require CONFIRM_CUSTOMER_CODE_MIGRATION flag
  const confirmMigration = process.env.CONFIRM_CUSTOMER_CODE_MIGRATION;
  if (confirmMigration !== 'ASSIGN_BK_CODES') {
    console.error('ERROR: CONFIRM_CUSTOMER_CODE_MIGRATION must be set to "ASSIGN_BK_CODES" to authorize migration execution.');
    process.exit(1);
  }

  const isDryRun = !process.argv.includes('--apply');
  if (isDryRun) {
    console.log('Running in DRY-RUN mode. No changes will be written to the database (including counter or index writes).');
  } else {
    console.log('Running in WRITE/APPLY mode. Executing database backfill...');
  }

  // Connect to the target DB with index safety disabled
  await mongoose.connect(migrationUri, {
    dbName: migrationDbName,
    autoIndex: false,
    autoCreate: false,
  });
  console.log('Connected to the target migration database context safely.');

  try {
    // 1. Fetch all customer records for pre-flight validation checks
    const allCustomers = await User.find({
      role: 'CUSTOMER',
      deletedAt: null
    }).select('customerCode').lean();

    const codesMap = new Map<string, string>(); // customerCode -> userId
    const duplicateCodes = new Set<string>();
    const invalidCodes = new Set<{ id: string; code: string }>();

    for (const c of allCustomers) {
      const code = c.customerCode;
      if (code !== undefined && code !== null && code !== '') {
        // Validate format BK-XXXX
        if (!/^BK-\d{4,}$/.test(code)) {
          invalidCodes.add({ id: c._id.toString(), code });
        }
        // Validate uniqueness
        if (codesMap.has(code)) {
          duplicateCodes.add(code);
        } else {
          codesMap.set(code, c._id.toString());
        }
      }
    }

    if (invalidCodes.size > 0 || duplicateCodes.size > 0) {
      console.error('ERROR: Pre-flight validation failed. Stopping migration before any database writes.');
      if (invalidCodes.size > 0) {
        console.error('Invalid customerCode formats detected:');
        for (const inv of invalidCodes) {
          console.error(`- Customer ID: ${inv.id} has invalid code: "${inv.code}"`);
        }
      }
      if (duplicateCodes.size > 0) {
        console.error('Duplicate customerCodes detected:');
        for (const dup of duplicateCodes) {
          console.error(`- Duplicate code: "${dup}"`);
        }
      }
      throw new Error('Pre-flight validation failed. Cannot proceed with migration.');
    }

    console.log('✓ Pre-flight validation checks passed. No duplicates or invalid formats detected.');

    // 2. Detect the highest existing valid BK sequence
    let maxSeq = 1000;
    for (const code of codesMap.keys()) {
      const numPart = parseInt(code.replace('BK-', ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
    console.log(`Highest existing sequence detected: BK-${maxSeq}`);

    // 3. In apply mode, atomically seed CustomerCounter using $max
    if (!isDryRun) {
      await CustomerCounter.updateOne(
        { _id: 'customerCode' },
        { $max: { seq: maxSeq } },
        { upsert: true }
      );
      console.log(`Atomically seeded CustomerCounter sequence with $max: ${maxSeq}`);
    }

    // 4. Query customers lacking customerCode
    const query = {
      role: 'CUSTOMER',
      deletedAt: null,
      $or: [
        { customerCode: { $exists: false } },
        { customerCode: null },
        { customerCode: '' }
      ]
    };

    // Process sequentially in createdAt + _id order
    const cursor = User.find(query).sort({ createdAt: 1, _id: 1 }).cursor();
    
    let processedCount = 0;
    let virtualSeq = maxSeq;

    for (let customer = await cursor.next(); customer != null; customer = await cursor.next()) {
      if (isDryRun) {
        virtualSeq++;
        processedCount++;
        const nextCode = `BK-${virtualSeq}`;
        console.log(`[DRY-RUN] Would assign Customer ID: ${customer._id} code: ${nextCode}`);
      } else {
        // Apply mode: call allocateCustomerCode() atomically
        const nextCode = await allocateCustomerCode();
        
        // Execute conditional update bypass Mongoose immutability check
        const updateResult = await User.collection.updateOne(
          {
            _id: customer._id,
            $or: [
              { customerCode: { $exists: false } },
              { customerCode: null },
              { customerCode: '' }
            ]
          },
          { $set: { customerCode: nextCode } }
        );

        if (updateResult.modifiedCount > 0) {
          processedCount++;
          console.log(`Assigned Customer ID: ${customer._id} code: ${nextCode}`);
        }
      }
    }

    console.log(`\nMigration operation completed successfully. Total processed: ${processedCount}`);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected safely.');
  }
}

// Executed only if called directly
if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

export { migrate };
