import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import HomeConfig from '../models/homeConfig.model';
import Store from '../models/store.model';

async function main() {
  const execute = process.argv.includes('--execute');
  console.log(`\n=================== BACKFILL START (Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}) ===================\n`);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: 'keshavmeena7424_db_user' });

  // 1. Ensure Test Invariant Store is default
  console.log(`Mongoose Store model collection name: ${Store.collection.name}`);
  const nativeStore = await mongoose.connection.db!.collection('stores').findOne({});
  console.log('Native store document _id:', nativeStore?._id, 'constructor:', nativeStore?._id?.constructor?.name);
  const store = await Store.findOne({ deletedAt: null });
  if (!store) {
    console.warn('Test Invariant Store not found!');
  } else {
    console.log(`Store: "${store.name}" | Current isDefault: ${store.isDefault}`);
    if (!store.isDefault) {
      console.log('Action: Set Test Invariant Store as default store (isDefault = true)');
      if (execute) {
        store.isDefault = true;
        await store.save();
        await Store.updateMany(
          { _id: { $ne: store._id }, active: true, deletedAt: null },
          { $set: { isDefault: false } }
        );
        console.log('Successfully saved store default state in DB.');
      }
    }
  }

  // 2. Map category section sourceCategoryIds
  const categoryMaps: Record<string, string> = {
    grocery_kitchen: '69c75908e600000000000001',
    snacks_drinks: '69c75908e600000000000010',
    beauty_personal_care: '69c75908e60000000000001d',
    household_essentials: '69c75908e60000000000002b',
    category_cards: '69c75908e600000000000001',
    dry_food_masala: '69c75908e60000000000000a',
    sweet_tooth: '69c75908e600000000000019',
    product_grid: '69c75908e600000000000019',
    leaf_product_showcase: '69c75908e600000000000019',
  };

  const configs = await HomeConfig.find({});
  console.log(`Found ${configs.length} HomeConfigs in DB.`);

  for (const config of configs) {
    console.log(`\nConfig ID: ${config._id} | Status: ${config.status} | Scope: ${config.scopeType} | Version: ${config.configVersion}`);
    let modified = false;

    const updatedSections = config.sections.map((section: any) => {
      const targetCatId = categoryMaps[section.type];
      if (targetCatId) {
        if (section.sourceCategoryId?.toString() !== targetCatId) {
          console.log(`  - Section "${section.sectionId}" (${section.type}): Set sourceCategoryId to "${targetCatId}"`);
          modified = true;
          return {
            ...section.toObject ? section.toObject() : section,
            sourceCategoryId: new mongoose.Types.ObjectId(targetCatId),
          };
        }
      }
      return section.toObject ? section.toObject() : section;
    });

    if (modified) {
      if (execute) {
        config.sections = updatedSections;
        await config.save();
        console.log(`Successfully saved Config ${config._id} in DB.`);
      } else {
        console.log(`[DRY-RUN] Proposed saving changes for Config ${config._id}`);
      }
    } else {
      console.log('  No changes needed for this config.');
    }
  }

  await mongoose.disconnect();
  console.log(`\n=================== BACKFILL END ===================\n`);
}

main().catch(console.error);
