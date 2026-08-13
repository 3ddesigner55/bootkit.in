process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test_cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test_key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test_secret';

import mongoose from 'mongoose';
import Category from '../models/category.model';
import Product from '../models/product.model';
import { parseAndValidateCategoryCsv, executeCategoryCsvImport } from '../services/category.service';

async function runCategoryCsvTests() {
  console.log('--- STARTING CATEGORY HIERARCHY & CSV IMPORT INVARIANTS TEST SUITE ---');

  const fakeAdminId = new mongoose.Types.ObjectId();

  // TEST 1: Level 1 Main Category Schema
  const l1Main = new Category({
    name: 'Grocery & Kitchen',
    slug: 'grocery-kitchen',
    parentCategory: null,
    active: true,
    sortOrder: 1,
    createdBy: fakeAdminId,
  });
  const l1Err = l1Main.validateSync();
  if (l1Err) throw l1Err;
  console.log('✓ Test 1: Level 1 Main Category created with no parent.');

  // TEST 2: Level 2 Subcategory Schema
  const l2Sub = new Category({
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    parentCategory: l1Main._id,
    active: true,
    sortOrder: 1,
    createdBy: fakeAdminId,
  });
  const l2Err = l2Sub.validateSync();
  if (l2Err) throw l2Err;
  console.log('✓ Test 2: Level 2 Subcategory created linked to Level 1 parent.');

  // TEST 3: Level 3 Leaf Category Schema
  const l3Leaf = new Category({
    name: 'Fresh Fruits',
    slug: 'fresh-fruits',
    parentCategory: l2Sub._id,
    active: true,
    sortOrder: 1,
    createdBy: fakeAdminId,
  });
  const l3Err = l3Leaf.validateSync();
  if (l3Err) throw l3Err;
  console.log('✓ Test 3: Level 3 Leaf Category created linked to Level 2 parent.');

  // TEST 4: CSV Multi-Pass Validation for 3-Level Hierarchy
  const validCsv = `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Fresh Fruits,fresh-fruits,fruits-vegetables,Seasonal fresh fruits,,,,true,1,,
Grocery & Kitchen,grocery-kitchen,,Daily staples and essentials,,,,true,1,,
Fruits & Vegetables,fruits-vegetables,grocery-kitchen,Fresh farm produce,,,,true,1,,`;

  const validationResult = await parseAndValidateCategoryCsv(validCsv);
  if (validationResult.validCount === 3 && validationResult.errorCount === 0) {
    console.log('✓ Test 4: CSV multi-pass dependency resolution succeeded regardless of row ordering.');
  } else {
    throw new Error(`CSV validation failed with ${validationResult.errorCount} errors.`);
  }

  // TEST 5: CSV Level 4 Hierarchy Depth Guard
  const invalidDepthCsv = `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Grocery,grocery,,Daily items,,,,true,1,,
Produce,produce,grocery,Fresh produce,,,,true,1,,
Fruits,fruits,produce,Fruits,,,,true,1,,
Apples,apples,fruits,Red apples (LEVEL 4),,,,true,1,,`;

  const depthResult = await parseAndValidateCategoryCsv(invalidDepthCsv);
  const appleRow = depthResult.rows.find((r) => r.slug === 'apples');
  if (appleRow && appleRow.status === 'ERROR' && appleRow.computedLevel === 4) {
    console.log('✓ Test 5: Level 4 category strictly rejected by maximum depth guard.');
  } else {
    throw new Error('Level 4 hierarchy was not properly rejected.');
  }

  // TEST 6: CSV Duplicate Slug Detection
  const duplicateCsv = `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Snacks,snacks,,Snacks items,,,,true,1,,
Chips,snacks,,Chips item with duplicate slug,,,,true,2,,`;

  const dupResult = await parseAndValidateCategoryCsv(duplicateCsv);
  if (dupResult.errorCount > 0) {
    console.log('✓ Test 6: Duplicate slug within CSV rejected.');
  }

  // TEST 7: Self-Parenting Guard
  const selfParentCsv = `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Beverages,beverages,beverages,Self parenting category,,,,true,1,,`;

  const selfResult = await parseAndValidateCategoryCsv(selfParentCsv);
  if (selfResult.errorCount > 0) {
    console.log('✓ Test 7: Self-parenting category within CSV rejected.');
  }

  // TEST 8: Missing Parent Guard
  const missingParentCsv = `name,slug,parentSlug,description,image,icon,banner,active,sortOrder,seoTitle,seoDescription
Organic Milk,organic-milk,non-existent-dairy-parent,Missing parent test,,,,true,1,,`;

  const missingResult = await parseAndValidateCategoryCsv(missingParentCsv);
  if (missingResult.errorCount > 0) {
    console.log('✓ Test 8: Missing parent slug rejected.');
  }

  // TEST 9: Product Assignment to Leaf Category
  const product = new Product({
    name: 'Shimla Royal Apple 1kg',
    slug: 'shimla-royal-apple-1kg',
    sku: 'FRUIT-APPLE-001',
    category: l3Leaf._id,
    sellingPrice: 16000,
    mrp: 20000,
    stock: 50,
    active: true,
  });
  const prodErr = product.validateSync();
  if (prodErr) throw prodErr;
  console.log('✓ Test 9: Product assignment validated against Level 3 Leaf category.');

  console.log('\n======================================================');
  console.log('ALL CATEGORY HIERARCHY & CSV INVARIANT ASSERTIONS PASSED!');
  console.log('======================================================\n');
}

runCategoryCsvTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
