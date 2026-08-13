import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';

dotenv.config();

export async function runStoreInventoryBackfill(targetStoreId?: string) {
  await connectDatabase();

  console.log('--- Starting Store Inventory Backfill ---');

  let store;
  if (targetStoreId) {
    store = await Store.findOne({ _id: targetStoreId, deletedAt: null });
    if (!store) {
      throw new Error(`Target store with ID ${targetStoreId} not found.`);
    }
  } else {
    store = await Store.findOne({ active: true, deletedAt: null }).sort({
      displayOrder: 1,
      createdAt: 1,
    });
    if (!store) {
      throw new Error('No active store found to backfill inventory for.');
    }
  }

  console.log(
    `Backfilling inventory for Store: "${store.name}" (${store._id.toString()})`,
  );

  const products = await Product.find({ deletedAt: null }).lean();
  console.log(`Found ${products.length} products to process.`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const product of products) {
    try {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const res = await StoreInventory.updateOne(
            {
              store: store._id,
              product: product._id,
              variantSku: variant.sku.trim(),
            },
            {
              $set: {
                stock: variant.stock ?? 0,
                reservedStock: 0,
                sellingPrice: variant.price,
                mrp: variant.mrp,
                active: variant.active,
                trackInventory: product.trackInventory ?? true,
                deletedAt: null,
              },
            },
            { upsert: true },
          );

          if (res.upsertedCount > 0) {
            createdCount += 1;
          } else if (res.modifiedCount > 0) {
            updatedCount += 1;
          } else {
            skippedCount += 1;
          }
        }
      } else {
        const res = await StoreInventory.updateOne(
          {
            store: store._id,
            product: product._id,
            variantSku: '',
          },
          {
            $set: {
              stock: product.stock ?? 0,
              reservedStock: 0,
              sellingPrice: product.sellingPrice,
              mrp: product.mrp,
              costPrice: product.costPrice,
              discountPercent: product.discountPercent,
              active: product.active,
              trackInventory: product.trackInventory ?? true,
              deletedAt: null,
            },
          },
          { upsert: true },
        );

        if (res.upsertedCount > 0) {
          createdCount += 1;
        } else if (res.modifiedCount > 0) {
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }
      }
    } catch (err) {
      failedCount += 1;
      console.error(
        `Failed to backfill product ${product._id.toString()}:`,
        err,
      );
    }
  }

  console.log('--- Store Inventory Backfill Completed ---');
  console.log({
    storeId: store._id.toString(),
    storeName: store.name,
    totalProductsProcessed: products.length,
    inventoryCreated: createdCount,
    inventoryUpdated: updatedCount,
    inventoryUnchanged: skippedCount,
    failures: failedCount,
  });

  await mongoose.disconnect();
}

if (require.main === module) {
  const storeIdArgIndex = process.argv.indexOf('--storeId');
  const targetStoreId =
    storeIdArgIndex !== -1 ? process.argv[storeIdArgIndex + 1] : undefined;

  runStoreInventoryBackfill(targetStoreId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Backfill error:', err);
      process.exit(1);
    });
}
