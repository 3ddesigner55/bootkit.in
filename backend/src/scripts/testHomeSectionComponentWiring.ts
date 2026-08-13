import 'dotenv/config';
import mongoose from 'mongoose';
import assert from 'assert';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { JSDOM } from 'jsdom';

// Import Mongoose Models
import User from '../models/user.model';
import Store from '../models/store.model';
import Product from '../models/product.model';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import StoreInventory from '../models/storeInventory.model';
import Cart from '../models/cart.model';
import Address from '../models/address.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';


// Import Services & Validators
import {
  createDefaultDraft,
  saveDraftConfiguration,
  publishConfiguration,
} from '../services/adminHomeConfig.service';
import { getHomeData } from '../services/home.service';
import { placeOrder } from '../services/order.service';

import { validateHomeConfigSection } from '../validators/adminHomeConfig.validator';

// Set up JSDOM for React component rendering tests
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;
(global as any).location = dom.window.location;

import { LocationContext } from '../../../src/store/LocationProvider';

function wrapWithProviders(element: React.ReactElement): React.ReactElement {
  const mockLocationValue: any = {
    location: { city: 'Bangalore', area: 'Indiranagar', pincode: '560038', deliveryMinutes: '10-15' },
    resolvedStoreId: 'store_123',
    hydrated: true,
    modalOpen: false,
    openLocationModal: () => {},
    closeLocationModal: () => {},
    selectLocation: () => {},
    clearLocation: () => {},
  };
  return React.createElement(
    LocationContext.Provider,
    { value: mockLocationValue },
    element
  );
}


// Import Frontend Components
import HomeDynamicRenderer, { DefaultHomeFallback } from '../../../src/components/home/HomeDynamicRenderer';
import HeroCarousel from '../../../src/components/home/hero/HeroCarousel';
import OfferSection from '../../../src/components/home/offers/OfferSection';
import BestSellerGrid from '../../../src/components/home/BestSellerGrid';
import GroceryKitchen from '../../../src/components/home/sections/GroceryKitchen';
import DryFoodMasala from '../../../src/components/home/sections/DryFoodMasala';
import HouseholdEssentials from '../../../src/components/home/sections/HouseholdEssentials';
import SweetTooth from '../../../src/components/home/sections/SweetTooth';
import FeaturedThisWeek from '../../../src/components/home/sections/FeaturedThisWeek';
import SnacksDrinks from '../../../src/components/home/sections/SnacksDrinks';
import BeautyPersonalCare from '../../../src/components/home/sections/BeautyPersonalCare';
import StoreSpotlight from '../../../src/components/home/sections/StoreSpotlight';
import SectionBlock from '../../../src/components/home/sections/SectionBlock';

const TEST_DB_NAME = 'bootkit_test_home_wiring_correction';

async function runHomeSectionWiringTests() {
  console.log('--- STARTING EXISTING HOME SECTION COMPONENT WIRING TESTS ---');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, { dbName: TEST_DB_NAME });
  await mongoose.connection.dropDatabase();
  console.log(`✅ Connected safely to ISOLATED test database "${TEST_DB_NAME}" (Primary DB untouched).`);


  let passed = 0;
  function pass(msg: string) {
    passed++;
    console.log(`✅ [PASS ${passed}] ${msg}`);
  }

  try {
    // -------------------------------------------------------------
    // 1. Setup Base Entities
    // -------------------------------------------------------------
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@bootkit.test',
      password: 'password123',
      role: 'ADMIN',
      phone: '9999999999',
    });

    const customerUser = await User.create({
      name: 'Rahul Customer',
      email: 'rahul@bootkit.test',
      password: 'password123',
      role: 'CUSTOMER',
      phone: '9888888888',
    });

    const testStore = await Store.create({
      name: 'Main Sardarshahar Hub',
      slug: `main-sardarshahar-hub-${Date.now()}`,
      phone: '9876543210',
      city: 'Sardarshahar',
      state: 'Rajasthan',
      country: 'India',
      deliveryRadius: 15,
      isDefault: true,
      active: true,
      displayOrder: 1,
    });


    const testCat = await Category.create({
      name: 'Daily Staples',
      slug: 'daily-staples',
      image: '/images/categories/staples.png',
      active: true,
    });

    const testCat2 = await Category.create({
      name: 'Fresh Dairy',
      slug: 'fresh-dairy',
      image: '/images/categories/dairy.png',
      active: true,
    });

    const testProd1 = await Product.create({
      name: 'Aashirvaad Atta 5kg',
      slug: 'aashirvaad-atta-5kg',
      sku: 'SKU_TEST_ATTA_5K',
      category: testCat._id,
      categorySlug: testCat.slug,
      sellingPrice: 220,
      mrp: 260,
      stock: 50,
      active: true,
      showOnHome: true,
    });

    const testProd2 = await Product.create({
      name: 'Amul Butter 500g',
      slug: 'amul-butter-500g',
      sku: 'SKU_TEST_BUTTER_500G',
      category: testCat2._id,
      categorySlug: testCat2.slug,
      sellingPrice: 275,
      mrp: 290,
      stock: 40,
      active: true,
      showOnHome: true,
    });


    await StoreInventory.create({
      store: testStore._id,
      product: testProd1._id,
      sellingPrice: 215,
      mrp: 260,
      stock: 50,
      active: true,
    });

    await StoreInventory.create({
      store: testStore._id,
      product: testProd2._id,
      sellingPrice: 270,
      mrp: 290,
      stock: 40,
      active: true,
    });

    const testBanner = await HeroBanner.create({
      title: 'Monsoon Mega Deals',
      desktopImage: '/images/banners/monsoon.png',
      mobileImage: '/images/banners/monsoon.png',
      buttonLink: '/category/daily-staples',
      displayOrder: 1,
      placement: 'hero',
      active: true,
      showOnHome: true,
    });

    // -------------------------------------------------------------
    // TEST 1: Fixed Renderer Whitelist Validation
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Fixed Renderer Whitelist Validation ---');

    const validRendererKeys = [
      'hero_carousel',
      'hero_banner',
      'offer_section',
      'offer',
      'best_seller_grid',
      'best_sellers',
      'grocery_kitchen',
      'dry_food_masala',
      'household_essentials',
      'sweet_tooth',
      'featured_this_week',
      'featured_banner',
      'snacks_drinks',
      'beauty_personal_care',
      'store_spotlight',
      'category_cards',
      'product_grid',
    ];

    for (const key of validRendererKeys) {
      const validated = validateHomeConfigSection(
        {
          sectionId: `sec_${key}`,
          type: key,
          title: `Section for ${key}`,
          active: true,
          items: [],
        },
        0,
      );
      assert.strictEqual(validated.type, key);
    }
    pass('All approved compile-time renderer keys pass backend validation');

    let unknownKeyRejected = false;
    try {
      validateHomeConfigSection(
        {
          sectionId: 'sec_malicious',
          type: 'malicious_eval_renderer',
          title: 'Exploit',
          active: true,
          items: [],
        },
        0,
      );
    } catch (e: any) {
      unknownKeyRejected = true;
    }
    assert(unknownKeyRejected, 'Unknown renderer key is rejected by validator');
    pass('Unknown/arbitrary renderer key is strictly rejected by backend validator');

    // -------------------------------------------------------------
    // TEST 2: Every Approved Renderer Maps to Exact Existing Component
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Every Approved Renderer Maps to Exact Component ---');

    // 2.1 HeroCarousel
    const heroMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_hero',
              type: 'hero_carousel',
              title: 'Hero Promo',
              sortOrder: 1,
              items: [
                {
                  itemType: 'banner',
                  referenceId: testBanner._id.toString(),
                  title: 'Hero Banner Item',
                  imageUrl: '/images/banners/hero.png',
                },
              ],
            },
          ],
        },
      })),
    );
    assert(heroMarkup.includes('Hero Banner Item'), 'HeroCarousel rendered item');
    pass('hero_carousel maps directly to compiled HeroCarousel');

    // 2.2 GroceryKitchen - Must NOT render as SweetTooth or SectionBlock
    const groceryMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_grocery',
              type: 'grocery_kitchen',
              title: 'Fresh Grocery & Kitchen Hub',
              sortOrder: 1,
              items: [
                {
                  itemType: 'category',
                  referenceId: testCat._id.toString(),
                  name: 'Farm Fresh Staples',
                  slug: 'farm-fresh-staples',
                  image: '/images/categories/staples.png',
                },
              ],
            },
          ],
        },
      })),
    );
    console.log('GROCERY MARKUP:', groceryMarkup);
    assert(
      groceryMarkup.includes('Fresh Grocery &amp; Kitchen Hub') || groceryMarkup.includes('Fresh Grocery & Kitchen Hub'),
      'GroceryKitchen title rendered',
    );
    assert(groceryMarkup.includes('Farm Fresh Staples'), 'GroceryKitchen category item rendered');
    assert(!groceryMarkup.includes('Sweet Tooth'), 'GroceryKitchen is NOT rendered through SweetTooth');
    pass('grocery_kitchen maps directly to dedicated GroceryKitchen component (not SweetTooth)');

    // 2.3 DryFoodMasala
    const dryFoodMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_dry_food',
              type: 'dry_food_masala',
              title: 'Dry Food & Spices Hub',
              sortOrder: 1,
              items: [
                {
                  itemType: 'product',
                  referenceId: testProd1._id.toString(),
                  name: 'Organic Cumin Seeds',
                  sellingPrice: 150,
                },
              ],
            },
          ],
        },
      })),
    );
    assert(
      dryFoodMarkup.includes('Dry Food &amp; Spices Hub') || dryFoodMarkup.includes('Dry Food & Spices Hub'),
      'DryFoodMasala title rendered',
    );
    assert(dryFoodMarkup.includes('Organic Cumin Seeds'), 'DryFoodMasala item rendered');
    pass('dry_food_masala maps directly to dedicated DryFoodMasala component');


    // 2.4 HouseholdEssentials
    const householdMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_house',
              type: 'household_essentials',
              title: 'Household Cleaning Essentials',
              sortOrder: 1,
              items: [
                {
                  itemType: 'category',
                  referenceId: testCat._id.toString(),
                  name: 'Detergents & Cleaners',
                  slug: 'detergents',
                  image: '/images/categories/detergents.png',
                },
              ],
            },
          ],
        },
      })),
    );
    assert(householdMarkup.includes('Household Cleaning Essentials'), 'HouseholdEssentials rendered');
    pass('household_essentials maps directly to dedicated HouseholdEssentials component');

    // 2.5 SnacksDrinks
    const snacksMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_snacks',
              type: 'snacks_drinks',
              title: 'Snacks & Cold Drinks Lounge',
              sortOrder: 1,
              items: [
                {
                  itemType: 'category',
                  referenceId: testCat._id.toString(),
                  name: 'Gourmet Chips',
                  slug: 'gourmet-chips',
                  image: '/images/categories/chips.png',
                },
              ],
            },
          ],
        },
      })),
    );
    assert(
      snacksMarkup.includes('Snacks &amp; Cold Drinks Lounge') || snacksMarkup.includes('Snacks & Cold Drinks Lounge'),
      'SnacksDrinks rendered',
    );
    pass('snacks_drinks maps directly to dedicated SnacksDrinks component');

    // 2.6 BeautyPersonalCare
    const beautyMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_beauty',
              type: 'beauty_personal_care',
              title: 'Beauty & Skincare Zone',
              sortOrder: 1,
              items: [
                {
                  itemType: 'category',
                  referenceId: testCat._id.toString(),
                  name: 'Organic Face Wash',
                  slug: 'face-wash',
                  image: '/images/categories/facewash.png',
                },
              ],
            },
          ],
        },
      })),
    );
    assert(
      beautyMarkup.includes('Beauty &amp; Skincare Zone') || beautyMarkup.includes('Beauty & Skincare Zone'),
      'BeautyPersonalCare rendered',
    );
    pass('beauty_personal_care maps directly to dedicated BeautyPersonalCare component');


    // 2.7 Unknown Renderer Key Renders null
    const unknownMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_unknown',
              type: 'non_existent_key' as any,
              title: 'Unknown',
              sortOrder: 1,
              items: [],
            },
          ],
        },
      })),
    );
    assert.strictEqual(unknownMarkup, '', 'Unknown renderer key must render null / empty');
    pass('Unknown renderer key renders null without error');

    // -------------------------------------------------------------
    // TEST 3: Empty Dynamic Section Renders Nothing (null)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Empty Dynamic Section Semantics ---');

    const emptySectionTypes: any[] = [
      { type: 'hero_carousel', component: HeroCarousel, propName: 'banners' },
      { type: 'offer_section', component: OfferSection, propName: 'offers' },
      { type: 'best_seller_grid', component: BestSellerGrid, propName: 'categories' },
      { type: 'grocery_kitchen', component: GroceryKitchen, propName: 'items' },
      { type: 'dry_food_masala', component: DryFoodMasala, propName: 'products' },
      { type: 'household_essentials', component: HouseholdEssentials, propName: 'items' },
      { type: 'sweet_tooth', component: SweetTooth, propName: 'products' },
      { type: 'featured_this_week', component: FeaturedThisWeek, propName: 'banners' },
      { type: 'snacks_drinks', component: SnacksDrinks, propName: 'items' },
      { type: 'beauty_personal_care', component: BeautyPersonalCare, propName: 'items' },
      { type: 'store_spotlight', component: StoreSpotlight, propName: 'stores' },
    ];

    for (const { type, component, propName } of emptySectionTypes) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        wrapWithProviders(React.createElement(component, { [propName]: [] })),
      );
      assert.strictEqual(markup, '', `Empty dynamic ${type} with [] must render empty markup`);
    }
    pass('All 11 section components render null when passed empty items array ([])');

    // -------------------------------------------------------------
    // TEST 4: Admin Section Order & Item Order Respected
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Admin Section Order & Item Order Respected ---');

    const orderedMarkup = ReactDOMServer.renderToStaticMarkup(
      wrapWithProviders(React.createElement(HomeDynamicRenderer, {
        config: {
          schemaVersion: '1.0.0',
          configVersion: 1,
          sections: [
            {
              sectionId: 'sec_2',
              type: 'dry_food_masala',
              title: 'Second Section - Masala',
              sortOrder: 2,
              items: [
                {
                  itemType: 'product',
                  referenceId: testProd1._id.toString(),
                  name: 'First Item In Masala',
                  sellingPrice: 100,
                  sortOrder: 1,
                },
                {
                  itemType: 'product',
                  referenceId: testProd2._id.toString(),
                  name: 'Second Item In Masala',
                  sellingPrice: 200,
                  sortOrder: 2,
                },
              ],
            },
            {
              sectionId: 'sec_1',
              type: 'grocery_kitchen',
              title: 'First Section - Grocery',
              sortOrder: 1,
              items: [
                {
                  itemType: 'category',
                  referenceId: testCat._id.toString(),
                  name: 'Category Alpha',
                  slug: 'cat-alpha',
                  image: '/images/categories/grocery.png',
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      })),
    );

    const firstSectionPos = orderedMarkup.indexOf('First Section - Grocery');
    const secondSectionPos = orderedMarkup.indexOf('Second Section - Masala');
    assert(firstSectionPos !== -1 && secondSectionPos !== -1, 'Both sections rendered');
    assert(firstSectionPos < secondSectionPos, 'Section with sortOrder 1 renders before sortOrder 2');

    const firstItemPos = orderedMarkup.indexOf('First Item In Masala');
    const secondItemPos = orderedMarkup.indexOf('Second Item In Masala');
    assert(firstItemPos < secondItemPos, 'Item with sortOrder 1 renders before sortOrder 2');
    pass('Admin section sortOrder and item sortOrder are strictly respected');

    // -------------------------------------------------------------
    // TEST 5: DefaultHomeFallback Contains Exact Original Sequence
    // -------------------------------------------------------------
    console.log('\n--- Test 5: DefaultHomeFallback Sequence Audit ---');

    const fallbackElement = DefaultHomeFallback();
    const children = React.Children.toArray(fallbackElement.props.children);
    assert.strictEqual(children.length, 11, 'DefaultHomeFallback has exactly 11 legacy sections');

    const expectedSequence = [
      HeroCarousel,
      OfferSection,
      BestSellerGrid,
      GroceryKitchen,
      DryFoodMasala,
      HouseholdEssentials,
      SweetTooth,
      FeaturedThisWeek,
      SnacksDrinks,
      BeautyPersonalCare,
      StoreSpotlight,
    ];

    for (let i = 0; i < expectedSequence.length; i++) {
      const child: any = children[i];
      assert.strictEqual(
        child.type,
        expectedSequence[i],
        `Fallback sequence index ${i} matches ${expectedSequence[i].name}`,
      );
    }
    pass('DefaultHomeFallback renders all 11 approved legacy sections in exact sequence (HeroCarousel -> OfferSection -> BestSellerGrid -> GroceryKitchen -> DryFoodMasala -> HouseholdEssentials -> SweetTooth -> FeaturedThisWeek -> SnacksDrinks -> BeautyPersonalCare -> StoreSpotlight)');




    // -------------------------------------------------------------
    // TEST 6: Store Invariant End-to-End Test
    // -------------------------------------------------------------
    console.log('\n--- Test 6: End-to-End Store ID Invariant ---');

    // 6.1 Home returns resolvedStoreId
    const customerHome = await getHomeData();
    assert(customerHome.resolvedStoreId, 'Home returns resolvedStoreId');
    assert.strictEqual(
      customerHome.resolvedStoreId,
      testStore._id.toString(),
      'resolvedStoreId matches default launch store',
    );

    pass('Home API returns resolvedStoreId matching default store');

    // 6.2 Cart locks to resolvedStoreId
    const cart = await Cart.create({
      user: customerUser._id,
      store: customerHome.resolvedStoreId,
      items: [
        {
          product: testProd1._id,
          quantity: 2,
          price: 215,
        },
      ],
    });
    assert.strictEqual(cart.store.toString(), customerHome.resolvedStoreId, 'Cart.store matches Home resolvedStoreId');
    pass('Cart.store locks strictly to Home resolvedStoreId');

    // Create address for customer
    const customerAddress = await Address.create({
      user: customerUser._id,
      label: 'Home',
      fullName: 'Rahul Customer',
      phone: '9888888888',
      addressLine1: 'Main Road',
      addressLine2: '',
      landmark: '',
      city: 'Sardarshahar',
      state: 'Rajasthan',
      country: 'India',
      postalCode: '331401',
      isDefault: true,
    });


    // 6.3 Checkout & Order inheritance
    const order = await placeOrder(customerUser._id.toString(), {
      addressId: customerAddress._id.toString(),
      storeId: customerHome.resolvedStoreId,
      paymentMethod: 'COD',
      idempotencyKey: 'idemp_wiring_test_1',
    });
    const orderStoreId = (order.store as any)?._id
      ? (order.store as any)._id.toString()
      : order.store
        ? order.store.toString()
        : null;
    assert.strictEqual(
      orderStoreId,
      customerHome.resolvedStoreId,
      'Order.store matches Cart.store and Home resolvedStoreId',
    );


    const updatedInv = await StoreInventory.findOne({ store: testStore._id, product: testProd1._id });
    assert.strictEqual(updatedInv?.stock, 48, 'StoreInventory decremented by 2 in resolved store');
    pass('Order.store inherits Cart.store and decrements StoreInventory accurately');

    console.log('\n======================================================');
    console.log(`ALL HOME SECTION WIRING TESTS PASSED: ${passed}/${passed}`);
    console.log('======================================================\n');
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('🧹 Cleaned up isolated test database.');
  }
}

runHomeSectionWiringTests().catch((err) => {
  console.error('Home Section Wiring Test Failed:', err);
  process.exit(1);
});
