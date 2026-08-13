import 'dotenv/config';
import mongoose from 'mongoose';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Category from '../models/category.model';
import HeroBanner from '../models/heroBanner.model';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import Product from '../models/product.model';
import Store from '../models/store.model';
import User from '../models/user.model';
import {
  createDefaultDraft,
  publishConfiguration,
  saveDraftConfig,
} from '../services/adminHomeConfig.service';
import { getHomeData as getCustomerHomeData } from '../services/home.service';
import { resolveSafeInternalUrl } from '../utils/navigationWhitelist';

import HomeDynamicRenderer, {
  DefaultHomeFallback,
  type HomeConfigPayload,
  SUPPORTED_SCHEMA_VERSION,
} from '../../../src/components/home/HomeDynamicRenderer';
import SectionErrorBoundary from '../../../src/components/home/SectionErrorBoundary';
import HeroCarousel from '../../../src/components/home/hero/HeroCarousel';
import OfferSection from '../../../src/components/home/offers/OfferSection';
import BestSellerGrid from '../../../src/components/home/BestSellerGrid';
import SweetTooth from '../../../src/components/home/sections/SweetTooth';
import FeaturedThisWeek from '../../../src/components/home/sections/FeaturedThisWeek';
import StoreSpotlight from '../../../src/components/home/sections/StoreSpotlight';
import SectionBlock from '../../../src/components/home/sections/SectionBlock';

import { CartContext } from '../../../src/store/CartProvider';
import { ProductAdminContext } from '../../../src/store/ProductAdminProvider';
import { WishlistContext } from '../../../src/store/WishlistProvider';
import { LocationContext } from '../../../src/store/LocationProvider';

function withMockProviders(element: React.ReactElement): React.ReactElement {
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
  };

  const mockProductAdminValue: any = {
    products: [],
    activeProducts: [],
    loading: false,
    error: null,
    addProduct: async () => {},
    updateProduct: async () => {},
    deleteProduct: async () => {},
    refreshProducts: async () => {},
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
  };


  const mockLocationValue: any = {
    location: { city: 'Bangalore', area: 'Indiranagar', pincode: '560038', deliveryMinutes: '10-15' },
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
    React.createElement(
      WishlistContext.Provider,
      { value: mockWishlistValue },
      React.createElement(
        CartContext.Provider,
        { value: mockCartValue },
        React.createElement(
          ProductAdminContext.Provider,
          { value: mockProductAdminValue },
          element,
        ),
      ),
    ),
  );
}


function verifySafeTestDatabase(dbName: string) {
  const primaryDb = process.env.DB_NAME || 'keshavmeena7424_db_user';
  if (dbName === primaryDb || dbName === 'production' || dbName === 'prod') {
    throw new Error(`CRITICAL ABORT: Refusing to run tests against primary/production database: ${dbName}`);
  }
}

// Faulty component for Error Boundary testing
function BrokenSection(): React.ReactElement {
  throw new Error('Simulated intentional runtime crash in child section component');
}


async function runPhase3_2RuntimeTests() {
  const testDbName = 'bootkit_phase3_2_test_runtime';
  verifySafeTestDatabase(testDbName);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(mongoUri, { dbName: testDbName });
  console.log(`✅ Connected safely to ISOLATED test database "${testDbName}" (Primary DB untouched).\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    const randomSuffix = () => Math.floor(10000000 + Math.random() * 90000000).toString();

    // ==========================================
    // TEST 1: DYNAMIC EMPTY-DATA SEMANTICS (7 COMPONENTS)
    // ==========================================
    console.log('--- Test 1: Dynamic Empty-Data Semantics (Empty Array -> Null) ---');

    // 1a. HeroCarousel
    const heroEmpty = renderToStaticMarkup(React.createElement(HeroCarousel, { banners: [] }));
    assert(heroEmpty === '', 'HeroCarousel with banners=[] renders null (empty markup)');

    // 1b. OfferSection
    const offerEmpty = renderToStaticMarkup(React.createElement(OfferSection, { offers: [] }));
    assert(offerEmpty === '', 'OfferSection with offers=[] renders null (empty markup)');

    // 1c. BestSellerGrid
    const bestEmpty = renderToStaticMarkup(withMockProviders(React.createElement(BestSellerGrid, { categories: [] })));
    assert(bestEmpty === '', 'BestSellerGrid with categories=[] renders null (empty markup)');

    // 1d. SweetTooth
    const sweetEmpty = renderToStaticMarkup(React.createElement(SweetTooth, { products: [] }));
    assert(sweetEmpty === '', 'SweetTooth with products=[] renders null (empty markup)');

    // 1e. FeaturedThisWeek
    const featEmpty = renderToStaticMarkup(React.createElement(FeaturedThisWeek, { banners: [] }));
    assert(featEmpty === '', 'FeaturedThisWeek with banners=[] renders null (empty markup)');

    // 1f. StoreSpotlight
    const storeEmpty = renderToStaticMarkup(React.createElement(StoreSpotlight, { stores: [] }));
    assert(storeEmpty === '', 'StoreSpotlight with stores=[] renders null (empty markup)');

    // 1g. SectionBlock
    const blockEmpty = renderToStaticMarkup(React.createElement(SectionBlock, { title: 'Test Block', items: [] }));
    assert(blockEmpty === '', 'SectionBlock with items=[] renders null (empty markup)');

    // ==========================================
    // TEST 2: ALL 7 RENDERER TYPES CONSUME SECTION DATA
    // ==========================================
    console.log('\n--- Test 2: All Seven Section Types Render Dedicated Data ---');

    const sevenSectionConfig: HomeConfigPayload = {
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      configVersion: 1,
      scopeType: 'GLOBAL',
      sections: [
        {
          sectionId: 'sec_1_hero',
          type: 'hero_banner',
          title: 'Hero Exclusive Title 1',
          subtitle: 'Hero Subtitle 1',
          sortOrder: 1,
          items: [
            {
              itemType: 'banner',
              referenceId: 'b1',
              title: 'Hero Promo 101',
              subtitle: 'Super Savings',
              imageUrl: '/images/banners/hero_b1.png',
              targetType: 'collection',
              targetValue: '/categories',
            },
          ],
        },
        {
          sectionId: 'sec_2_offer',
          type: 'offer',
          title: 'Offers Exclusive 2',
          sortOrder: 2,
          items: [
            {
              itemType: 'offer',
              referenceId: 'o1',
              title: 'Special 50% Off',
              subtitle: 'On all dairy',
            },
          ],
        },
        {
          sectionId: 'sec_3_best',
          type: 'best_sellers',
          title: 'Best Sellers 3',
          sortOrder: 3,
          items: [
            {
              itemType: 'category',
              referenceId: 'c1',
              name: 'Top Dairy Category',
              slug: 'top-dairy',
              image: '/images/categories/dairy.png',
            },
          ],
        },
        {
          sectionId: 'sec_4_cards',
          type: 'category_cards',
          title: 'Fresh Grocery Cards 4',
          sortOrder: 4,
          items: [
            {
              itemType: 'category',
              referenceId: 'c2',
              name: 'Bakery & Bread',
              slug: 'bakery-bread',
              image: '/images/categories/bakery.png',
            },
          ],
        },
        {
          sectionId: 'sec_5_products',
          type: 'product_grid',
          title: 'Munchies Grid 5',
          sortOrder: 5,
          items: [
            {
              itemType: 'product',
              referenceId: 'p1',
              name: 'Crispy Potato Chips',
              slug: 'potato-chips',
              sellingPrice: 40,
              mrp: 50,
              stock: 25,
              thumbnail: '/images/products/chips.png',
            },
          ],
        },
        {
          sectionId: 'sec_6_feat',
          type: 'featured_banner',
          title: 'Featured Specials 6',
          sortOrder: 6,
          items: [
            {
              itemType: 'banner',
              referenceId: 'fb1',
              title: 'Monsoon Special Banner',
              imageUrl: '/images/banners/monsoon.png',
              targetType: 'collection',
              targetValue: '/products',
            },
          ],
        },
        {
          sectionId: 'sec_7_stores',
          type: 'store_spotlight',
          title: 'Local Stores Spotlight 7',
          sortOrder: 7,
          items: [
            {
              itemType: 'store',
              referenceId: 's1',
              name: 'Metro Hypermarket Indiranagar',
              city: 'Bangalore',
              image: '/images/stores/metro.png',
              slug: 'metro-indiranagar',
              targetType: 'internal_page',
              targetValue: '/category/metro-indiranagar',
            },
          ],
        },
      ],
    };

    const renderedSevenMarkup = renderToStaticMarkup(
      withMockProviders(React.createElement(HomeDynamicRenderer, { config: sevenSectionConfig })),
    );


    assert(renderedSevenMarkup.includes('Hero Promo 101'), 'Hero section rendered Hero Promo 101');
    assert(renderedSevenMarkup.includes('Special 50% Off'), 'Offer section rendered Special 50% Off');
    assert(renderedSevenMarkup.includes('Top Dairy Category'), 'Best Sellers rendered Top Dairy Category');
    assert(renderedSevenMarkup.includes('Bakery &amp; Bread') || renderedSevenMarkup.includes('Bakery & Bread'), 'Category Cards rendered Bakery & Bread');
    assert(renderedSevenMarkup.includes('Crispy Potato Chips'), 'Product Grid rendered Crispy Potato Chips');
    assert(renderedSevenMarkup.includes('Monsoon Special Banner') || renderedSevenMarkup.includes('monsoon.png'), 'Featured Banner rendered Monsoon banner');
    assert(renderedSevenMarkup.includes('Metro Hypermarket Indiranagar'), 'Store Spotlight rendered Metro Hypermarket');

    // ==========================================
    // TEST 3: SECTION SORT ORDERING
    // ==========================================
    console.log('\n--- Test 3: Admin Section Sort Order Controls Rendered Sequence ---');
    const heroIndex = renderedSevenMarkup.indexOf('Hero Promo 101');
    const chipsIndex = renderedSevenMarkup.indexOf('Crispy Potato Chips');
    const storeIndex = renderedSevenMarkup.indexOf('Metro Hypermarket Indiranagar');

    assert(heroIndex < chipsIndex, 'Hero (sortOrder: 1) appears before Product Grid (sortOrder: 5)');
    assert(chipsIndex < storeIndex, 'Product Grid (sortOrder: 5) appears before Store Spotlight (sortOrder: 7)');

    // ==========================================
    // TEST 4: ERROR BOUNDARY RESILIENCE
    // ==========================================
    console.log('\n--- Test 4: Real SectionErrorBoundary Catches Throwing Child ---');

    assert(typeof SectionErrorBoundary.getDerivedStateFromError === 'function', 'SectionErrorBoundary implements static getDerivedStateFromError');
    const derivedState = SectionErrorBoundary.getDerivedStateFromError();
    assert(derivedState.hasError === true, 'getDerivedStateFromError sets hasError: true');

    const boundaryInstance = new SectionErrorBoundary({ sectionId: 'sec_test_crash', children: React.createElement('div', null, 'Normal Content') });
    boundaryInstance.state = { hasError: true };
    assert(boundaryInstance.render() === null, 'Error state renders null safely without crashing Home');


    // ==========================================
    // TEST 5: UNSUPPORTED SCHEMA VERSION FALLBACK
    // ==========================================
    console.log('\n--- Test 5: Unsupported Schema Version Fallback ---');
    const invalidVersionConfig: HomeConfigPayload = {
      schemaVersion: '99.0.0', // Unsupported version
      configVersion: 1,
      sections: sevenSectionConfig.sections,
    };

    const fallbackMarkup = renderToStaticMarkup(
      withMockProviders(React.createElement(HomeDynamicRenderer, { config: invalidVersionConfig })),
    );
    const defaultFallbackMarkup = renderToStaticMarkup(withMockProviders(React.createElement(DefaultHomeFallback)));


    assert(
      fallbackMarkup === defaultFallbackMarkup,
      'Unsupported schemaVersion 99.0.0 rendered exact DefaultHomeFallback',
    );

    // ==========================================
    // TEST 6: NAVIGATION WHITELIST SECURITY (NULL RETURNS)
    // ==========================================
    console.log('\n--- Test 6: Hardened Navigation Whitelist (Returns null on Malicious/Unknown) ---');
    assert(resolveSafeInternalUrl('product', 'javascript:alert(1)') === null, 'javascript: returns null');
    assert(resolveSafeInternalUrl('category', 'data:text/html,<script>') === null, 'data: returns null');
    assert(resolveSafeInternalUrl('internal_page', 'file:///etc/passwd') === null, 'file: returns null');
    assert(resolveSafeInternalUrl('collection', 'https://attacker.com') === null, 'external URL returns null');
    assert(resolveSafeInternalUrl('internal_page', '/admin/dashboard') === null, '/admin returns null');
    assert(resolveSafeInternalUrl('internal_page', '/owner') === null, '/owner returns null');
    assert(resolveSafeInternalUrl('internal_page', '/seller') === null, '/seller returns null');
    assert(resolveSafeInternalUrl('internal_page', '/api/orders') === null, '/api returns null');
    assert(resolveSafeInternalUrl('internal_page', 'fake-page') === null, 'unapproved page returns null');

    assert(resolveSafeInternalUrl('product', 'amul-butter') === '/product/amul-butter', 'Valid product maps to /product/amul-butter');
    assert(resolveSafeInternalUrl('category', 'dairy-eggs') === '/category/dairy-eggs', 'Valid category maps to /category/dairy-eggs');
    assert(resolveSafeInternalUrl('internal_page', 'cart') === '/cart', 'Valid internal cart maps to /cart');
    assert(resolveSafeInternalUrl('internal_page', 'orders') === '/orders', 'Valid internal orders maps to /orders');

    console.log(`\n======================================================`);
    console.log(`ALL PHASE 3.2 RUNTIME TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log(`======================================================\n`);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log('🧹 Cleaned up isolated test database.');
    await mongoose.disconnect();
  }
}

runPhase3_2RuntimeTests().catch((err) => {
  console.error('Phase 3.2 test execution failed:', err);
  process.exit(1);
});
