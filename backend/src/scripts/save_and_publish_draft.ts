import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import axios from 'axios';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTc2MWM1NTBiY2UwOTgwZjg4YzI1OGEiLCJyb2xlIjoiT1dORVIiLCJlbWFpbCI6IjNkZGVzaWduZXI1NTQ2QGdtYWlsLmNvbSIsImlhdCI6MTc4NjQyODU5MywiZXhwIjoxNzg5MDIwNTkzfQ.VUDDOulbMkxNOgd7PhFslyxgREdqYeNef1WsFtF1RW8';
const BASE_URL = 'http://localhost:5001/api';

async function run() {
  const TEST_MONGO_URI = process.env.MONGODB_URI;
  const TEST_DB_NAME = process.env.DB_NAME;
  await mongoose.connect(TEST_MONGO_URI!, { dbName: TEST_DB_NAME });

  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }), 'categories');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  const StoreInventory = mongoose.model('StoreInventory', new mongoose.Schema({}, { strict: false }), 'storeinventories');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('=== Step 4.1: Fetch Current Draft ===');
  const draftRes = await axios.get(`${BASE_URL}/admin/home-config/draft`, { headers });
  const draftData = draftRes.data.data;
  console.log(`Current Draft Version: ${draftData.configVersion}`);

  // Find best_sellers_home section and update items
  const bestSellersSec = draftData.sections.find((s: any) => s.sectionId === 'best_sellers_home');
  if (!bestSellersSec) {
    throw new Error('Section best_sellers_home not found in draft config!');
  }

  console.log('Updating best_sellers_home items list with 6 real categories...');
  bestSellersSec.active = true;
  bestSellersSec.items = [
    {
      itemType: 'category',
      referenceId: '6a774f18ecc03c6b79459c84', // Dairy, Bread & Eggs
      sortOrder: 1,
      active: true
    },
    {
      itemType: 'category',
      referenceId: '6a774f18ecc03c6b79459c8d', // Fruits & Vegetables
      sortOrder: 2,
      active: true
    },
    {
      itemType: 'category',
      referenceId: '6a774f19ecc03c6b79459c9b', // Sweets & Chocolates
      sortOrder: 3,
      active: true
    },
    {
      itemType: 'category',
      referenceId: '6a79e43ca37a10f640be05b2', // Snacks & Drinks
      sortOrder: 4,
      active: true
    },
    {
      itemType: 'category',
      referenceId: '6a79e463a37a10f640be05b3', // Sweets & Desserts
      sortOrder: 5,
      active: true
    },
    {
      itemType: 'category',
      referenceId: '6a79e4aaa37a10f640be05b4', // Chocolates & Candies
      sortOrder: 6,
      active: true
    }
  ];

  // Now, validate all active sections, and deactivate any that fail validation criteria
  console.log('Validating draft sections to ensure zero publish blockers...');
  for (const section of draftData.sections) {
    if (!section.active) continue;

    if (section.sectionId === 'best_sellers_home') continue;

    const isCategoryGrid = [
      'category_cards',
      'grocery_kitchen',
      'household_essentials',
      'snacks_drinks',
      'beauty_personal_care',
    ].includes(section.type);

    const isProductShowcase = [
      'leaf_product_showcase',
      'product_grid',
      'sweet_tooth',
    ].includes(section.type);

    if (isCategoryGrid) {
      if (!section.sourceCategoryId || !mongoose.isValidObjectId(section.sourceCategoryId)) {
        console.log(`Deactivating section "${section.sectionId}" due to missing sourceCategoryId`);
        section.active = false;
      } else {
        const cat = await Category.findOne({ _id: section.sourceCategoryId, deletedAt: null }).populate({ path: 'parentCategory', strictPopulate: false });
        if (!cat || !cat.active || cat.parentCategory !== null) {
          console.log(`Deactivating section "${section.sectionId}" due to invalid source category "${cat ? (cat as any).name : 'unknown'}"`);
          section.active = false;
        } else {
          const childCount = await Category.countDocuments({ parentCategory: cat._id, active: true, deletedAt: null });
          if (childCount === 0) {
            console.log(`Deactivating section "${section.sectionId}" because parent category "${(cat as any).name}" has 0 child categories`);
            section.active = false;
          }
        }
      }
    }

    if (isProductShowcase) {
      if (!section.sourceCategoryId || !mongoose.isValidObjectId(section.sourceCategoryId)) {
        console.log(`Deactivating section "${section.sectionId}" due to missing sourceCategoryId`);
        section.active = false;
      } else {
        const cat = await Category.findOne({ _id: section.sourceCategoryId, deletedAt: null }).populate({ path: 'parentCategory', strictPopulate: false });
        if (!cat || !cat.active) {
          console.log(`Deactivating section "${section.sectionId}" due to invalid/inactive category`);
          section.active = false;
        } else {
          // Check level (must be L2 or L3)
          let level = 1;
          if (cat.parentCategory) {
            level = 2;
            const parent = await Category.findOne({ _id: cat.parentCategory, deletedAt: null });
            if (parent && (parent as any).parentCategory) {
              level = 3;
            }
          }
          if (level !== 3 && level !== 2) {
            console.log(`Deactivating section "${section.sectionId}" because category "${(cat as any).name}" is Level ${level} instead of Level 2/3`);
            section.active = false;
          } else {
            const products = await Product.find({ category: cat._id, active: true, deletedAt: null }).select('_id');
            const prodIds = products.map(p => p._id);
            const invCount = await StoreInventory.countDocuments({ product: { $in: prodIds }, active: true, deletedAt: null });
            if (invCount === 0) {
              console.log(`Deactivating section "${section.sectionId}" because category "${(cat as any).name}" has 0 inventory items`);
              section.active = false;
            }
          }
        }
      }
    }
  }

  console.log('=== Step 4.2: Save Updated Draft ===');
  const saveRes = await axios.post(`${BASE_URL}/admin/home-config/draft`, {
    scopeType: draftData.scopeType,
    expectedVersion: draftData.configVersion,
    sections: draftData.sections
  }, { headers });

  console.log('Draft saved successfully. New Version:', saveRes.data.data.configVersion);

  console.log('=== Step 4.3: Fetch Admin Preview ===');
  const previewRes = await axios.get(`${BASE_URL}/admin/home-config/preview`, { headers });
  const previewData = previewRes.data.data;
  console.log('Resolved sections in preview:');
  for (const sec of previewData.sections) {
    if (sec.active) {
      console.log(`- Active Section: "${sec.title}" (${sec.sectionId}), Type: ${sec.type}, Items Count: ${sec.items.length}`);
    }
  }

  console.log('=== Step 4.4: Publish Configuration ===');
  const publishRes = await axios.post(`${BASE_URL}/admin/home-config/publish`, {
    scopeType: draftData.scopeType
  }, { headers });

  console.log('Publish Response:', publishRes.data.message);
  console.log('Published Config version:', publishRes.data.data.published.configVersion);

  await mongoose.disconnect();
}

run().catch(async err => {
  console.error('API Error:', err.response ? err.response.data : err.message);
  await mongoose.disconnect();
});
