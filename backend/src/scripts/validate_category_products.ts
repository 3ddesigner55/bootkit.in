import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { createCategory, getCategoryProducts } from '../services/category.service';
import Category from '../models/category.model';
import Product from '../models/product.model';
import Brand from '../models/brand.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';

async function runTests() {
  await connectDatabase();
  console.log('--- STARTING CATEGORY PRODUCTS INTEGRATION TESTS ---');

  const dummyUserId = new mongoose.Types.ObjectId().toString();

  // 1. Clean up old test records
  await Category.deleteMany({ slug: { $in: ['test-l1', 'test-l2', 'test-l3'] } });
  await Product.deleteMany({ slug: { $in: ['test-prod-1', 'test-prod-2'] } });
  await Brand.deleteMany({ slug: { $in: ['test-brand-a', 'test-brand-b'] } });
  await Store.deleteMany({ city: 'TestCity' });

  // 2. Setup mock Store
  const store = await Store.create({
    name: 'Test Store',
    slug: 'test-store',
    city: 'TestCity',
    state: 'TestState',
    country: 'TestCountry',
    phone: '1234567890',
    deliveryRadius: 10,
    active: true,
    isDefault: true,
  });
  console.log('✅ Store created:', store._id.toString());

  // 3. Setup category tree (L1 -> L2 -> L3)
  const l1 = await createCategory({ name: 'Test L1', slug: 'test-l1', active: true, parentCategory: null }, dummyUserId);
  const l2 = await createCategory({ name: 'Test L2', slug: 'test-l2', active: true, parentCategory: l1._id.toString() }, dummyUserId);
  const l3 = await createCategory({ name: 'Test L3', slug: 'test-l3', active: true, parentCategory: l2._id.toString() }, dummyUserId);
  console.log('✅ Category hierarchy setup: test-l1 -> test-l2 -> test-l3');

  // 4. Setup mock Brands
  const brandA = await Brand.create({ name: 'Test Brand A', slug: 'test-brand-a', active: true });
  const brandB = await Brand.create({ name: 'Test Brand B', slug: 'test-brand-b', active: true });
  console.log('✅ Brands created:', brandA.name, brandB.name);

  // 5. Create products under L3 category (New products strictly require Level-3)
  const prod1 = await Product.create({
    name: 'Test Product 1',
    slug: 'test-prod-1',
    sku: 'test-sku-1',
    category: l3._id,
    brand: brandA._id,
    active: true,
    thumbnail: '/images/test-p1.jpg',
    mrp: 150,
    sellingPrice: 120,
    stock: 10,
  });

  const prod2 = await Product.create({
    name: 'Test Product 2',
    slug: 'test-prod-2',
    sku: 'test-sku-2',
    category: l3._id,
    brand: brandB._id,
    active: true,
    thumbnail: '/images/test-p2.jpg',
    mrp: 200,
    sellingPrice: 180,
    stock: 10,
  });
  console.log('✅ Products created under L3 category');

  // 6. Setup StoreInventory (Pricing, stock)
  await StoreInventory.create({
    store: store._id,
    product: prod1._id,
    sellingPrice: 110,
    mrp: 150,
    stock: 20,
    active: true,
  });

  await StoreInventory.create({
    store: store._id,
    product: prod2._id,
    sellingPrice: 170,
    mrp: 200,
    stock: 15,
    active: true,
  });
  console.log('✅ StoreInventory entries created');

  // 7. Test getCategoryProducts for Level 3 (exact match)
  console.log('7. Testing L3 products query...');
  const resL3 = await getCategoryProducts('test-l3', { storeId: store._id.toString() });
  console.log('L3 category level:', resL3.category.level);
  console.log('L3 product count:', resL3.products.length);
  if (resL3.category.level !== 3) {
    throw new Error('FAIL: L3 category level is incorrect');
  }
  if (resL3.products.length !== 2) {
    throw new Error('FAIL: L3 did not return correct number of products');
  }
  if (resL3.products[0].sellingPrice !== 110) {
    throw new Error('FAIL: Store inventory price mapping did not apply');
  }

  // 8. Test getCategoryProducts for Level 2 (recursive descendant match)
  console.log('8. Testing L2 products query (recursive)...');
  const resL2 = await getCategoryProducts('test-l2', { storeId: store._id.toString() });
  console.log('L2 product count:', resL2.products.length);
  if (resL2.products.length !== 2) {
    throw new Error('FAIL: L2 recursive query did not fetch descendants products');
  }

  // 9. Test getCategoryProducts for Level 1 (recursive descendant match)
  console.log('9. Testing L1 products query (recursive)...');
  const resL1 = await getCategoryProducts('test-l1', { storeId: store._id.toString() });
  console.log('L1 product count:', resL1.products.length);
  if (resL1.products.length !== 2) {
    throw new Error('FAIL: L1 recursive query did not fetch descendants products');
  }

  // 10. Test Brand facet generation
  console.log('10. Testing Brand facet generation...');
  console.log('Facets count:', resL1.brands.length);
  if (resL1.brands.length !== 2) {
    throw new Error('FAIL: Facet generation did not output all available brands');
  }
  console.log('Brand facets:', resL1.brands.map(b => b.name));

  // 11. Test Price filters
  console.log('11. Testing price query filtering...');
  const resFiltered = await getCategoryProducts('test-l3', {
    storeId: store._id.toString(),
    maxPrice: '120',
  });
  console.log('Filtered product count:', resFiltered.products.length);
  if (resFiltered.products.length !== 1 || resFiltered.products[0].id !== prod1._id.toString()) {
    throw new Error('FAIL: Price filtering did not work correctly');
  }

  // 12. Test Sort behavior
  console.log('12. Testing sorting behavior...');
  const resSorted = await getCategoryProducts('test-l3', {
    storeId: store._id.toString(),
    sort: 'price-desc',
  });
  if (resSorted.products[0].sellingPrice < resSorted.products[1].sellingPrice) {
    throw new Error('FAIL: Price sorting high-to-low did not sort correctly');
  }

  // 13. Clean up
  console.log('13. Cleaning up test data...');
  await Category.deleteMany({ slug: { $in: ['test-l1', 'test-l2', 'test-l3'] } });
  await Product.deleteMany({ slug: { $in: ['test-prod-1', 'test-prod-2'] } });
  await Brand.deleteMany({ slug: { $in: ['test-brand-a', 'test-brand-b'] } });
  await Store.deleteMany({ _id: store._id });
  await StoreInventory.deleteMany({ store: store._id });

  console.log('--- ALL CATEGORY PRODUCTS INTEGRATION TESTS PASSED ---');
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
