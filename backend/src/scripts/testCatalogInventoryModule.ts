import 'dotenv/config';
import mongoose from 'mongoose';
import assert from 'assert';

import Store from '../models/store.model';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Brand from '../models/brand.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import CatalogAudit from '../models/catalogAudit.model';

import {
  parseAndValidateBrands,
  parseAndValidateCategories,
  parseAndValidateProducts,
  parseAndValidateInventory,
  executeImportBrands,
  executeImportCategories,
  executeImportProducts,
  executeImportInventory
} from '../services/catalogImport.service';

import {
  createCategory,
  updateCategory,
  reorderCategories,
  computeCategoryLevelAndPath
} from '../services/category.service';

import {
  createProduct,
  updateProduct
} from '../services/product.service';

import {
  adjustStoreInventoryStock
} from '../services/adminStoreInventory.service';

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

async function runCatalogInventoryTests() {
  console.log('--- STARTING CATALOG & INVENTORY MODULE ISOLATED TESTS ---');

  const testDbName = 'bootkit_catalog_inventory_unit_test';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, { dbName: testDbName });
  console.log(`✅ Connected safely to ISOLATED test database "${testDbName}"\n`);

  try {
    // 0. Clean Collections
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await StoreInventory.deleteMany({});
    await User.deleteMany({});
    await CatalogAudit.deleteMany({});

    // Create a dummy user
    const adminUser = await User.create({
      firstName: 'Catalog',
      lastName: 'Manager',
      phone: '9998887770',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const store = await Store.create({
      name: 'Central Hub',
      slug: 'central-hub',
      code: 'CHUB',
      phone: '9870098700',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      deliveryRadius: 5,
      active: true,
      displayOrder: 1,
    });

    console.log('1. Testing Category Hierarchy constraints...');
    
    // Level 1 category
    const catL1 = await createCategory({
      name: 'Grocery',
      slug: 'grocery',
      active: true,
    }, adminUser._id.toString());
    
    const { level: levelL1 } = await computeCategoryLevelAndPath(catL1);
    assert.strictEqual(levelL1, 1, 'L1 category level must be 1');

    // Level 2 category
    const catL2 = await createCategory({
      name: 'Fruits & Vegetables',
      slug: 'fruits-vegetables',
      parentCategory: catL1._id.toString(),
      active: true,
    }, adminUser._id.toString());

    const { level: levelL2 } = await computeCategoryLevelAndPath(catL2);
    assert.strictEqual(levelL2, 2, 'L2 category level must be 2');

    // Level 3 category
    const catL3 = await createCategory({
      name: 'Fresh Fruits',
      slug: 'fresh-fruits',
      parentCategory: catL2._id.toString(),
      active: true,
    }, adminUser._id.toString());

    const { level: levelL3 } = await computeCategoryLevelAndPath(catL3);
    assert.strictEqual(levelL3, 3, 'L3 category level must be 3');

    // Trying to create a Level 4 category (Should fail)
    try {
      await createCategory({
        name: 'Apples',
        slug: 'apples',
        parentCategory: catL3._id.toString(),
        active: true,
      }, adminUser._id.toString());
      assert.fail('Should have failed to create a Level 4 category');
    } catch (err: any) {
      console.log('✅ Correctly rejected Level 4 category:', err.message);
    }

    // Trying to assign a product to a Level 1 category (Should fail)
    try {
      await createProduct({
        name: 'Apple Red',
        slug: 'apple-red',
        sku: 'APRED001',
        category: catL1._id.toString(),
        sellingPrice: 100,
        stock: 50,
      }, adminUser._id.toString());
      assert.fail('Should have failed to assign product to L1 category');
    } catch (err: any) {
      console.log('✅ Correctly rejected product assignment to non-L3 category:', err.message);
    }

    // Assigning product to active L3 category (Should succeed)
    const product = await createProduct({
      name: 'Apple Red',
      slug: 'apple-red',
      sku: 'APRED001',
      category: catL3._id.toString(),
      sellingPrice: 100,
      mrp: 120,
      stock: 50,
      unit: '1 kg',
    }, adminUser._id.toString());
    assert.ok(product, 'Product created successfully under L3 category');

    console.log('2. Testing Category Reordering / Siblings sorting...');
    const catL3_2 = await createCategory({
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables',
      parentCategory: catL2._id.toString(),
      active: true,
    }, adminUser._id.toString());

    await reorderCategories([
      { id: catL3._id.toString(), sortOrder: 1 },
      { id: catL3_2._id.toString(), sortOrder: 2 },
    ], adminUser._id.toString());

    const updatedL3 = await Category.findById(catL3._id);
    assert.strictEqual(updatedL3?.sortOrder, 1, 'Sort order updated successfully');
    console.log('✅ Category reorder siblings updated.');

    console.log('3. Testing Fast Inventory Delta Stock Adjustments & Concurrency locks...');
    // Setup store inventory
    const inventory = await StoreInventory.create({
      store: store._id,
      product: product._id,
      variantSku: product.sku,
      stock: 50,
      reservedStock: 5,
      sellingPrice: 100,
      mrp: 120,
      active: true,
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });

    // Valid positive delta adjustment (+120)
    const adj1 = await adjustStoreInventoryStock(
      inventory._id.toString(),
      120,
      'Add stock arrived',
      50,
      adminUser._id.toString(),
    );
    assert.strictEqual(adj1.stock, 170, 'Stock should be adjusted to 170');

    // Valid negative delta adjustment (-5)
    const adj2 = await adjustStoreInventoryStock(
      inventory._id.toString(),
      -5,
      'Remove Damaged stock',
      170,
      adminUser._id.toString(),
    );
    assert.strictEqual(adj2.stock, 165, 'Stock should be adjusted to 165');

    // Test negative stock prevention (Should fail)
    try {
      await adjustStoreInventoryStock(
        inventory._id.toString(),
        -200,
        'Massive deduction',
        165,
        adminUser._id.toString(),
      );
      assert.fail('Should have rejected adjustment resulting in negative stock');
    } catch (err: any) {
      console.log('✅ Correctly rejected negative stock level adjustment:', err.message);
    }

    // Test concurrency lock validation (Should fail if expected stock does not match server stock)
    try {
      await adjustStoreInventoryStock(
        inventory._id.toString(),
        10,
        'Stale update',
        150, // Server has 165
        adminUser._id.toString(),
      );
      assert.fail('Should have rejected stale stock level adjustment');
    } catch (err: any) {
      console.log('✅ Correctly caught concurrency conflict:', err.message);
    }

    console.log('4. Testing CSV Import validation & Execute pipelines...');

    // Test Brands CSV
    const csvBrandsText = 'name,slug,description,logo,banner,website,featured,active,displayOrder\nOrganic Farms,organic-farms,Good brand,,,,,true,1\n';
    const validationBrands = await parseAndValidateBrands(Buffer.from(csvBrandsText));
    assert.strictEqual(validationBrands.validCount, 1, 'Brand row should be valid');
    await executeImportBrands(validationBrands.rows.map(r => r.data), 'skip', adminUser._id.toString());
    const brandDoc = await Brand.findOne({ slug: 'organic-farms' });
    assert.ok(brandDoc, 'Brand should be imported successfully');

    // Test Categories CSV
    const csvCategoriesText = 'name,slug,parentCategory,image,icon,active,sortOrder\nDairy,dairy,grocery,,true,5\n';
    const validationCategories = await parseAndValidateCategories(Buffer.from(csvCategoriesText));
    assert.strictEqual(validationCategories.validCount, 1, 'Category row should be valid');
    await executeImportCategories(validationCategories.rows.map(r => r.data), 'skip', adminUser._id.toString());
    const categoryDoc = await Category.findOne({ slug: 'dairy' });
    assert.ok(categoryDoc, 'Category should be imported successfully');

    // Test Products CSV
    const csvProductsText = `name,sku,slug,category,brand,sellingPrice,mrp,stock,unit\nOrganic Milk,OMILK001,organic-milk,fresh-fruits,organic-farms,60,70,100,1L\n`;
    const validationProducts = await parseAndValidateProducts(Buffer.from(csvProductsText));
    assert.strictEqual(validationProducts.validCount, 1, 'Product row should be valid');
    // Execute import with hub scope
    await executeImportProducts(validationProducts.rows.map(r => r.data), 'skip', adminUser._id.toString(), store._id.toString());
    const prodDoc = await Product.findOne({ sku: 'OMILK001' });
    assert.ok(prodDoc, 'Product should be imported successfully');
    
    // Verify store inventory was populated as well
    const storeInvDoc = await StoreInventory.findOne({ store: store._id, product: prodDoc?._id });
    assert.ok(storeInvDoc, 'StoreInventory should be created automatically');
    assert.strictEqual(storeInvDoc?.stock, 100, 'StoreInventory stock should be 100');

    // Test Inventory CSV
    const csvInventoryText = `store,product,stock,reservedStock,sellingPrice,mrp,active\ncentral-hub,OMILK001,250,10,58,68,true\n`;
    const validationInventory = await parseAndValidateInventory(Buffer.from(csvInventoryText));
    console.log('validationInventory result:', JSON.stringify(validationInventory, null, 2));
    assert.strictEqual(validationInventory.duplicateCount, 1, 'Inventory row should be duplicate');
    await executeImportInventory(validationInventory.rows.map(r => r.data), 'update', adminUser._id.toString());
    
    const updatedStoreInvDoc = await StoreInventory.findOne({ store: store._id, product: prodDoc?._id });
    assert.strictEqual(updatedStoreInvDoc?.stock, 250, 'StoreInventory stock should be updated to 250');
    assert.strictEqual(updatedStoreInvDoc?.sellingPrice, 58, 'StoreInventory sellingPrice should be updated to 58');

    console.log('✅ CSV Import validation & execution tests passed successfully!');

  } finally {
    await mongoose.connection.close();
    console.log('🔌 Mongoose connection closed safely.');
  }

  console.log('\n✨ ALL CATALOG & INVENTORY MODULE TESTS PASSED! ✨');
}

runCatalogInventoryTests().catch((err) => {
  console.error('❌ TEST FAILED WITH ERROR:', err);
  process.exit(1);
});
