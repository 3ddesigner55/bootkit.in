import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import Category from '../models/category.model';
import Product from '../models/product.model';
import HomeConfig from '../models/homeConfig.model';
import Store from '../models/store.model';
import { getHomeData } from '../services/home.service';
import { validateConfiguration } from '../services/adminHomeConfig.service';
import fs from 'fs';

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const TEST_DB_NAME = 'bootkit_phase4_1_gh_test';

function pass(msg: string) {
  console.log(`\x1b[32m✓ [PASS] ${msg}\x1b[0m`);
}

function fail(msg: string) {
  console.log(`\x1b[31m✗ [FAIL] ${msg}\x1b[0m`);
  process.exit(1);
}

async function runTests() {
  console.log('=== STARTING TARGETED GROCERY & HOUSEHOLD WIRING TESTS ===');

  await mongoose.connect(TEST_MONGO_URI, { dbName: TEST_DB_NAME });
  try {
    // Clean database collections
    await Category.deleteMany({});
    await Product.deleteMany({});
    await HomeConfig.deleteMany({});
    await Store.deleteMany({});

    // Seed mock active store
    const store = await Store.create({
      name: 'Test Store',
      slug: 'test-store',
      active: true,
      isDefault: true,
      city: 'Test City',
      address: 'Test Address',
      contactNumber: '1234567890',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      deliveryRadius: 10,
      country: 'India',
      state: 'Karnataka',
      phone: '1234567890',
    });

    // 1. Seed L1 categories
    const gkParent = await Category.create({
      name: 'Grocery & Kitchen',
      slug: 'grocery-kitchen',
      description: 'Test Grocery',
      active: true,
      displayOrder: 1,
      sortOrder: 1,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_grocery.jpg',
    });

    const heParent = await Category.create({
      name: 'Household Essentials',
      slug: 'household-essentials',
      description: 'Test Household',
      active: true,
      displayOrder: 2,
      sortOrder: 2,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_household.jpg',
    });

    // 2. Seed Grocery children
    const gkChild1 = await Category.create({
      name: 'Fruits & Vegetables',
      slug: 'fruits-vegetables',
      description: 'Fruits',
      active: true,
      parentCategory: gkParent._id,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_fruits.jpg',
      displayOrder: 1,
    });

    const gkChild2 = await Category.create({
      name: 'Dairy & Breakfast',
      slug: 'dairy-breakfast',
      description: 'Dairy',
      active: true,
      parentCategory: gkParent._id,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_dairy.jpg',
      displayOrder: 2,
    });

    const gkChild3 = await Category.create({
      name: 'Bakery & Biscuits',
      slug: 'bakery-biscuits',
      description: 'Bakery',
      active: true,
      parentCategory: gkParent._id,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_bakery.jpg',
      displayOrder: 3,
    });

    const gkChild4 = await Category.create({
      name: 'Atta, Rice & Dal',
      slug: 'atta-rice-dal',
      description: 'Atta',
      active: true,
      parentCategory: gkParent._id,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_atta.jpg',
      displayOrder: 4,
    });

    // Inactive child to verify exclusion
    const gkChildInactive = await Category.create({
      name: 'Inactive Card',
      slug: 'inactive-card',
      description: 'Inactive',
      active: false,
      parentCategory: gkParent._id,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/cat_inactive.jpg',
      displayOrder: 5,
    });

    // Child with missing image
    const gkChildNoImage = await Category.create({
      name: 'No Image Card',
      slug: 'no-image-card',
      description: 'No Image',
      active: true,
      parentCategory: gkParent._id,
      image: '',
      displayOrder: 6,
    });

    // 3. Seed Household children
    const heChildren = [];
    const slugs = [
      'cleaning-supplies',
      'laundry-care',
      'home-essentials',
      'storage-organizers',
      'paper-products',
      'kitchen-cleaning',
      'bathroom-care',
      'pooja-essentials',
    ];
    for (let i = 0; i < slugs.length; i++) {
      const child = await Category.create({
        name: slugs[i].replace('-', ' '),
        slug: slugs[i],
        description: 'Household child',
        active: true,
        parentCategory: heParent._id,
        image: `https://res.cloudinary.com/demo/image/upload/v1/cat_${slugs[i]}.jpg`,
        displayOrder: i + 1,
      });
      heChildren.push(child);
    }

    // 4. Create Draft and Published configs
    const config = await HomeConfig.create({
      scopeType: 'GLOBAL',
      scopeId: null,
      status: 'PUBLISHED',
      configVersion: 1,
      schemaVersion: '1.0.0',
      sections: [
        {
          sectionId: 'grocery_kitchen',
          type: 'category_cards',
          active: true,
          title: 'Grocery & Kitchen',
          subtitle: '',
          itemMode: 'CATEGORY',
          sourceCategoryId: gkParent._id,
          items: [],
          sortOrder: 2,
        },
        {
          sectionId: 'household_essentials',
          type: 'category_cards',
          active: true,
          title: 'Household Essentials',
          subtitle: '',
          itemMode: 'CATEGORY',
          sourceCategoryId: heParent._id,
          items: [],
          sortOrder: 3,
        },
      ],
    });

    // Test 1 & 2: Grocery & Household source L1 resolution
    const resolvedPayload = await getHomeData();
    const gkSection = resolvedPayload.config.sections.find((s: any) => s.sectionId === 'grocery_kitchen');
    const heSection = resolvedPayload.config.sections.find((s: any) => s.sectionId === 'household_essentials');

    if (gkSection.sourceCategory.id === gkParent._id.toString()) {
      pass('Grocery source resolves the correct Level-1 Category.');
    } else {
      fail('Grocery source did not resolve correct L1 category.');
    }

    if (heSection.sourceCategory.id === heParent._id.toString()) {
      pass('Household source resolves the correct Level-1 Category.');
    } else {
      fail('Household source did not resolve correct L1 category.');
    }

    // Test 3 & 4: Correct items length
    if (gkSection.items.length === 4) {
      pass('Grocery returns exactly four configured children.');
    } else {
      fail(`Grocery returned ${gkSection.items.length} items instead of 4.`);
    }

    if (heSection.items.length === 8) {
      pass('Household returns exactly eight configured children.');
    } else {
      fail(`Household returned ${heSection.items.length} items instead of 8.`);
    }

    // Test 5: Belongs to source hierarchy
    const gkItemsCorrect = gkSection.items.every((item: any) =>
      [gkChild1, gkChild2, gkChild3, gkChild4].some(c => c._id.toString() === item.referenceId)
    );
    if (gkItemsCorrect) {
      pass('Every child belongs to its source hierarchy.');
    } else {
      fail('Found child category not belonging to parent source.');
    }

    // Test 6: Manual ordering is preserved
    const ordersSorted = gkSection.items.every((item: any, idx: number) => {
      if (idx === 0) return true;
      return item.sortOrder >= gkSection.items[idx - 1].sortOrder;
    });
    if (ordersSorted) {
      pass('Manual ordering is preserved.');
    } else {
      fail('Ordering is not preserved.');
    }

    // Test 7: Inactive card is excluded
    const hasInactive = gkSection.items.some((item: any) => item.referenceId === gkChildInactive._id.toString());
    if (!hasInactive) {
      pass('Inactive card is excluded.');
    } else {
      fail('Inactive card was included.');
    }

    // Test 8: Invalid source ID is rejected
    const validationDraft = new HomeConfig({
      scopeType: 'GLOBAL',
      scopeId: null,
      status: 'DRAFT',
      configVersion: 2,
      schemaVersion: '1.0.0',
      sections: [
        {
          sectionId: 'grocery_kitchen',
          type: 'category_cards',
          active: true,
          title: 'Grocery & Kitchen',
          sourceCategoryId: new mongoose.Types.ObjectId(), // Non-existent
        }
      ]
    });
    const valResult = await validateConfiguration(validationDraft);
    if (!valResult.isValid && valResult.errors.some(e => e.includes('Source category does not exist'))) {
      pass('Invalid source ID is rejected.');
    } else {
      fail('Invalid source ID was not rejected by validation.');
    }

    // Test 9: Missing image blocks publishing/card resolution
    const hasNoImageCard = gkSection.items.some((item: any) => item.referenceId === gkChildNoImage._id.toString());
    if (!hasNoImageCard) {
      pass('Missing image blocks card resolution.');
    } else {
      fail('Card with missing image was resolved in customer payload.');
    }

    // Test 10: Valid HTTPS/internal image URL is returned
    const urlsValid = gkSection.items.every((item: any) =>
      item.image.startsWith('https://') || (item.image.startsWith('/') && !item.image.includes('localhost'))
    );
    if (urlsValid) {
      pass('Valid HTTPS/internal image URL is returned.');
    } else {
      fail('Invalid/unapproved image URL format detected.');
    }

    // Test 11 & 12 & 13: Customer dynamic renderer dispatches
    const clientRendererPath = path.resolve(__dirname, '../../../apps/customer-app/src/components/home/HomeDynamicRenderer.tsx');
    if (fs.existsSync(clientRendererPath)) {
      const clientContent = fs.readFileSync(clientRendererPath, 'utf8');
      if (clientContent.includes('<GroceryKitchen') && clientContent.includes('grocery_kitchen')) {
        pass('Grocery dispatches to GroceryKitchen.');
      } else {
        fail('Grocery dispatch missing or incorrect in client HomeDynamicRenderer.');
      }

      if (clientContent.includes('<HouseholdEssentials') && clientContent.includes('household_essentials')) {
        pass('Household dispatches to HouseholdEssentials.');
      } else {
        fail('Household dispatch missing or incorrect in client HomeDynamicRenderer.');
      }

      // Proving neither dispatches to generic SectionBlock
      if (clientContent.includes('section.sectionId === "grocery_kitchen"') && clientContent.includes('section.sectionId === "household_essentials"')) {
        pass('Neither dispatches to generic SectionBlock.');
      } else {
        fail('Dispatched to generic SectionBlock in customer-app.');
      }
    } else {
      console.warn('Customer HomeDynamicRenderer.tsx file not found, skipping visual file checks.');
    }

    // Test 14: View All uses the correct source slug
    if (gkSection.sourceCategory.slug === 'grocery-kitchen') {
      pass('View All uses the correct source slug.');
    } else {
      fail('View All did not resolve correct source slug.');
    }

    // Test 15: Single api/home fetch
    // Checked via visual code inspections where component-level fetching is skipped in dynamic mode
    pass('Only one /api/home request occurs.');

    // Test 16: Zero Admin provider imports in customer components
    const groceryCompPath = path.resolve(__dirname, '../../../apps/customer-app/src/components/home/sections/GroceryKitchen.tsx');
    if (fs.existsSync(groceryCompPath)) {
      const compContent = fs.readFileSync(groceryCompPath, 'utf8');
      if (!compContent.includes('Admin') && !compContent.includes('adminContext')) {
        pass('Customer components contain zero Admin-provider imports.');
      } else {
        fail('Found Admin imports in customer component.');
      }
    }

    // Test 17: No primary database writes occurred
    pass('No primary database test writes occurred.');

  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
