import 'dotenv/config';
import { JSDOM } from 'jsdom';


// Initialize global DOM environment before React imports
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
});

(global as any).self = dom.window;
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLButtonElement = dom.window.HTMLButtonElement;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).Event = dom.window.Event;
(global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);
(global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
(global as any).requestIdleCallback = (cb: any) => setTimeout(cb, 0);
(global as any).cancelIdleCallback = (id: any) => clearTimeout(id);
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).IntersectionObserver = MockIntersectionObserver;
(dom.window as any).IntersectionObserver = MockIntersectionObserver;


import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import mongoose from 'mongoose';

import { env } from '../config/env';

import Brand from '../models/brand.model';
import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig from '../models/homeConfig.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import StoreInventory from '../models/storeInventory.model';
import User from '../models/user.model';
import { getHomeData } from '../services/home.service';

import { CartContext } from '../../../src/store/CartProvider';
import { WishlistContext } from '../../../src/store/WishlistProvider';
import { LocationContext } from '../../../src/store/LocationProvider';
import HeroCarousel from '../../../src/components/home/hero/HeroCarousel';
import OfferSection from '../../../src/components/home/offers/OfferSection';
import BestSellerGrid from '../../../src/components/home/BestSellerGrid';
import SweetTooth from '../../../src/components/home/sections/SweetTooth';
import FeaturedThisWeek from '../../../src/components/home/sections/FeaturedThisWeek';
import StoreSpotlight from '../../../src/components/home/sections/StoreSpotlight';
import SectionBlock from '../../../src/components/home/sections/SectionBlock';
import HomeDynamicRenderer, { DefaultHomeFallback } from '../../../src/components/home/HomeDynamicRenderer';
import SectionErrorBoundary from '../../../src/components/home/SectionErrorBoundary';
import ProductCard from '../../../src/components/product/ProductCard';
import ProductDrawer from '../../../src/components/product/ProductDrawer';
import { resolveSafeInternalUrl } from '../../../src/utils/navigationWhitelist';
import { validateHomeConfigPayload } from '../validators/adminHomeConfig.validator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Attempted test run against production database "${dbName}"!`);
  }
}

function withMockProviders(
  element: React.ReactElement,
  overrides?: {
    cart?: any;
    wishlist?: any;
    location?: any;
  },
): React.ReactElement {
  const mockCartValue: any = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    hydrated: true,
    getQuantity: () => 0,
    addItem: () => {},
    addItems: () => {},
    increaseItem: () => {},
    decreaseItem: () => {},
    removeItem: () => {},
    clearCart: () => {},
    ...overrides?.cart,
  };

  const mockWishlistValue: any = {
    items: [],
    totalItems: 0,
    hydrated: true,
    isWishlisted: () => false,
    addToWishlist: () => {},
    removeFromWishlist: () => {},
    toggleWishlist: () => {},
    clearWishlist: () => {},
    ...overrides?.wishlist,
  };

  const mockLocationValue: any = {
    location: { city: 'Bangalore', area: 'Indiranagar', pincode: '560038', deliveryMinutes: '10-15' },
    hydrated: true,
    modalOpen: false,
    openLocationModal: () => {},
    closeLocationModal: () => {},
    selectLocation: () => {},
    clearLocation: () => {},
    ...overrides?.location,
  };

  return React.createElement(
    LocationContext.Provider,
    { value: mockLocationValue },
    React.createElement(
      WishlistContext.Provider,
      { value: mockWishlistValue },
      React.createElement(
        CartContext.Provider,
        { value: mockCartValue },
        element,
      ),
    ),
  );
}

// Throwing component for Error Boundary test
function CrashComponent(): React.ReactElement {
  throw new Error('Simulated runtime DOM render crash');
}

async function runClientRuntimeTests() {
  const testDbName = 'bootkit_phase3_2_client_runtime_test';
  const mongoUri = `${env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, `/${testDbName}$1`)}`;

  await mongoose.connect(mongoUri);
  const currentDb = mongoose.connection.db?.databaseName || '';
  verifySafeTestDatabase(currentDb);
  console.log(`✅ Connected safely to ISOLATED test database "${currentDb}" (Primary DB untouched).\n`);

  const container = document.getElementById('root')!;

  try {
    // Clean collections
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      StoreInventory.deleteMany({}),
      Category.deleteMany({}),
      HeroBanner.deleteMany({}),
      HomeConfig.deleteMany({}),
    ]);

    // ==========================================
    // TEST 1: STORE A VS STORE B PRICING & STOCK INVARIANT
    // ==========================================
    console.log('--- Test 1: Store A vs Store B Pricing & Stock Invariant ---');

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Super',
      email: 'admin_p32@test.bootkit',
      password: 'Password123!',
      role: 'ADMIN',
      phone: '+919999999901',
    });

    const storeA = await Store.create({
      name: 'Store Alpha Koramangala',
      slug: 'store-alpha-koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      phone: '+919999999902',
      deliveryRadius: 10,
      minimumOrderAmount: 0,
      active: true,
    });

    const storeB = await Store.create({
      name: 'Store Beta Whitefield',
      slug: 'store-beta-whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      phone: '+919999999903',
      deliveryRadius: 10,
      minimumOrderAmount: 0,
      active: true,
    });


    const testCat = await Category.create({
      name: 'Dairy & Plant Milk',
      slug: 'dairy-plant-milk',
      active: true,
    });

    const testProd = await Product.create({
      name: 'Organic Almond Milk 1L',
      slug: 'organic-almond-milk-1l',
      description: 'Pure plant-based almond milk',
      category: testCat._id,
      mrp: 200,
      sellingPrice: 180,
      stock: 50,
      active: true,
      showOnHome: true,
      sku: 'SKU-ALMOND-1L',
    });


    // Store A Inventory: sellingPrice = 140, mrp = 160, stock = 15
    await StoreInventory.create({
      store: storeA._id,
      product: testProd._id,
      sellingPrice: 140,
      mrp: 160,
      stock: 15,
      active: true,
    });

    // Store B Inventory: sellingPrice = 175, mrp = 190, stock = 3
    await StoreInventory.create({
      store: storeB._id,
      product: testProd._id,
      sellingPrice: 175,
      mrp: 190,
      stock: 3,
      active: true,
    });

    // Published Home Config with product_grid containing testProd
    await HomeConfig.create({
      scopeType: 'STORE',
      scopeId: storeA._id.toString(),
      status: 'PUBLISHED',
      configVersion: 1,
      schemaVersion: '1.0.0',
      publishedAt: new Date(),
      publishedBy: adminUser._id,
      sections: [
        {
          sectionId: 'sec_prod_a',
          type: 'product_grid',
          title: 'Store Alpha Fresh Deals',
          sortOrder: 1,
          active: true,
          items: [
            {
              itemType: 'product',
              referenceId: testProd._id.toString(),
              sortOrder: 1,
              active: true,
            },
          ],
        },
      ],
    });

    await HomeConfig.create({
      scopeType: 'STORE',
      scopeId: storeB._id.toString(),
      status: 'PUBLISHED',
      configVersion: 1,
      schemaVersion: '1.0.0',
      publishedAt: new Date(),
      publishedBy: adminUser._id,
      sections: [
        {
          sectionId: 'sec_prod_b',
          type: 'product_grid',
          title: 'Store Beta Fresh Deals',
          sortOrder: 1,
          active: true,
          items: [
            {
              itemType: 'product',
              referenceId: testProd._id.toString(),
              sortOrder: 1,
              active: true,
            },
          ],
        },
      ],
    });

    const homeDataStoreA = await getHomeData(storeA._id.toString());
    const homeDataStoreB = await getHomeData(storeB._id.toString());

    assert(homeDataStoreA.resolvedStoreId === storeA._id.toString(), 'Store A query resolved Store A ID');
    assert(homeDataStoreB.resolvedStoreId === storeB._id.toString(), 'Store B query resolved Store B ID');

    const itemA = homeDataStoreA.config.sections[0].items[0];
    const itemB = homeDataStoreB.config.sections[0].items[0];

    assert(itemA.sellingPrice === 140, 'Store A product selling price is strictly 140 (from Store A inventory)');
    assert(itemA.mrp === 160, 'Store A product mrp is strictly 160 (from Store A inventory)');
    assert(itemA.stock === 15, 'Store A product stock is strictly 15 (from Store A inventory)');

    assert(itemB.sellingPrice === 175, 'Store B product selling price is strictly 175 (from Store B inventory)');
    assert(itemB.mrp === 190, 'Store B product mrp is strictly 190 (from Store B inventory)');
    assert(itemB.stock === 3, 'Store B product stock is strictly 3 (from Store B inventory)');

    // ==========================================
    // TEST 2: STRICT 1:1 SECTION ITEM-TYPE MATRIX
    // ==========================================
    console.log('\n--- Test 2: Strict 1:1 Section Item-Type Matrix ---');

    // 2a. hero_banner rejects non-banner (e.g. offer or product)
    let heroErrorThrown = false;
    try {
      validateHomeConfigPayload({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 's_hero_bad',
            type: 'hero_banner',
            items: [{ itemType: 'offer' as any, referenceId: new mongoose.Types.ObjectId().toString(), sortOrder: 1 }],
          },
        ],
      });
    } catch {
      heroErrorThrown = true;
    }
    assert(heroErrorThrown, 'Validator rejects non-banner item (offer) in hero_banner');

    // 2b. offer rejects non-offer (e.g. banner)
    let offerErrorThrown = false;
    try {
      validateHomeConfigPayload({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 's_offer_bad',
            type: 'offer',
            items: [{ itemType: 'banner' as any, referenceId: new mongoose.Types.ObjectId().toString(), sortOrder: 1 }],
          },
        ],
      });
    } catch {
      offerErrorThrown = true;
    }
    assert(offerErrorThrown, 'Validator rejects non-offer item (banner) in offer section');

    // 2c. product_grid rejects category
    let prodErrorThrown = false;
    try {
      validateHomeConfigPayload({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 's_prod_bad',
            type: 'product_grid',
            items: [{ itemType: 'category' as any, referenceId: new mongoose.Types.ObjectId().toString(), sortOrder: 1 }],
          },
        ],
      });
    } catch {
      prodErrorThrown = true;
    }
    assert(prodErrorThrown, 'Validator rejects category item in product_grid');

    // 2d. category_cards rejects store
    let catErrorThrown = false;
    try {
      validateHomeConfigPayload({
        scopeType: 'GLOBAL',
        sections: [
          {
            sectionId: 's_cat_bad',
            type: 'category_cards',
            items: [{ itemType: 'store' as any, referenceId: new mongoose.Types.ObjectId().toString(), sortOrder: 1 }],
          },
        ],
      });
    } catch {
      catErrorThrown = true;
    }
    assert(catErrorThrown, 'Validator rejects store item in category_cards');

    // ==========================================
    // TEST 3: NARROW REMOTE NAVIGATION ALLOWLIST
    // ==========================================
    console.log('\n--- Test 3: Narrow Remote Navigation Allowlist ---');

    // Forbidden paths must return null
    const forbiddenPaths = [
      '/admin',
      '/admin/home-builder',
      '/owner',
      '/seller',
      '/api/users',
      '/login',
      '/phone-login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/checkout',
      '/order-success',
      '/welcome',
    ];

    for (const forbidden of forbiddenPaths) {
      const result = resolveSafeInternalUrl('internal_page', forbidden);
      assert(result === null, `Forbidden path "${forbidden}" returns null (non-clickable)`);
    }

    // Allowed customer paths
    assert(resolveSafeInternalUrl('internal_page', 'cart') === '/cart', 'Approved path cart returns /cart');
    assert(resolveSafeInternalUrl('internal_page', 'account') === '/account', 'Approved path account returns /account');
    assert(resolveSafeInternalUrl('internal_page', 'orders') === '/orders', 'Approved path orders returns /orders');
    assert(resolveSafeInternalUrl('internal_page', 'wishlist') === '/wishlist', 'Approved path wishlist returns /wishlist');
    assert(resolveSafeInternalUrl('internal_page', 'offers') === '/offers', 'Approved path offers returns /offers');

    // ==========================================
    // TEST 4: JSDOM CLIENT-RUNTIME COMPONENT MOUNTING
    // ==========================================
    console.log('\n--- Test 4: JSDOM Client-Runtime Mounting & Effect Execution ---');

    const root = createRoot(container);

    // 4a. Dynamic empty child props render null in real DOM with effects running
    await act(async () => {
      root.render(
        withMockProviders(
          React.createElement(
            React.Fragment,
            null,
            React.createElement(HeroCarousel, { banners: [] }),
            React.createElement(OfferSection, { offers: [] }),
            React.createElement(BestSellerGrid, { categories: [] }),
            React.createElement(SweetTooth, { products: [] }),
            React.createElement(FeaturedThisWeek, { banners: [] }),
            React.createElement(StoreSpotlight, { stores: [] }),
            React.createElement(SectionBlock, { items: [] }),
          ),
        ),
      );
    });

    assert(container.innerHTML === '', 'All 7 components with empty dynamic props render null in DOM (0 HTML nodes)');

    // 4b. ProductCard "+ Add" Button Click invokes cart.addItem()
    let addedProduct: any = null;
    await act(async () => {
      root.render(
        withMockProviders(
          React.createElement(ProductCard, {
            product: {
              id: 'p_test_1',
              name: 'Fresh Mangoes 1kg',
              price: 120,
              mrp: 150,
              stock: 20,
              image: '/images/mango.png',
              unit: '1 kg',
            } as any,
          }),
          {
            cart: {
              addItem: (p: any) => {
                addedProduct = p;
              },
            },
          },
        ),
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const addButton = buttons.find((b) => b.textContent?.trim() === 'Add');
    assert(addButton !== undefined, 'ProductCard Add button rendered in DOM');
    if (addButton) {
      await act(async () => {
        addButton.click();
      });
      assert(addedProduct !== null && addedProduct.id === 'p_test_1', 'Clicking "+ Add" invoked cart.addItem() with product');
    }


    // 4c. ProductDrawer Open & Quantity Counter Interaction
    let drawerClosed = false;
    await act(async () => {
      root.render(
        withMockProviders(
          React.createElement(ProductDrawer, {
            product: {
              id: 'p_drawer_1',
              name: 'Pure Desi Ghee 500ml',
              price: 350,
              mrp: 400,
              stock: 10,
              image: '/images/ghee.png',
              unit: '500 ml',
              description: 'Traditional bilona ghee',
            } as any,
            open: true,
            onClose: () => {
              drawerClosed = true;
            },
          }),
        ),
      );
    });

    assert(container.textContent?.includes('Pure Desi Ghee 500ml') === true, 'ProductDrawer rendered product name in DOM');
    assert(container.textContent?.includes('350') === true, 'ProductDrawer rendered product price in DOM');

    // 4d. SectionErrorBoundary Catches Throwing Child in DOM
    const origError = console.error;
    console.error = () => {}; // Suppress expected React boundary error log

    await act(async () => {
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(SectionErrorBoundary, { sectionId: 'sec_good_a' }, React.createElement('div', { id: 'good_a' }, 'Good Section A')),
          React.createElement(SectionErrorBoundary, { sectionId: 'sec_bad' }, React.createElement(CrashComponent)),
          React.createElement(SectionErrorBoundary, { sectionId: 'sec_good_b' }, React.createElement('div', { id: 'good_b' }, 'Good Section B')),
        ),
      );
    });
    console.error = origError;

    const goodA = container.querySelector('#good_a');
    const goodB = container.querySelector('#good_b');
    assert(goodA !== null, 'Good Section A remains in DOM after crash in sibling');
    assert(goodB !== null, 'Good Section B remains in DOM after crash in sibling');

    // 4e. Unsupported Schema Version renders DefaultHomeFallback in DOM
    await act(async () => {
      root.render(
        withMockProviders(
          React.createElement(HomeDynamicRenderer, {
            config: {
              schemaVersion: '99.0.0', // Unsupported version
              configVersion: 1,
              sections: [],
            },
          }),
        ),
      );
    });

    assert(container.textContent?.includes('Best Sellers') === true, 'Unsupported schema version rendered DefaultHomeFallback');

    // Clean up DOM
    root.unmount();

    console.log('\n======================================================');
    console.log('ALL PHASE 3.2 CLIENT-RUNTIME & STORE TESTS PASSED');
    console.log('======================================================');
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('\n🧹 Cleaned up isolated test database.');
  }
}

runClientRuntimeTests().catch((err) => {
  console.error('Phase 3.2 client runtime test failed:', err);
  process.exit(1);
});
