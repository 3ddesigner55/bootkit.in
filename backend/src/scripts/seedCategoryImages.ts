import dotenv from 'dotenv';
dotenv.config({ path: '/Users/3ddesigner/Desktop/Bootkit/.env.local' });
dotenv.config({ path: '/Users/3ddesigner/Desktop/Bootkit/backend/.env' });

import { connectDatabase } from '../config/database';
import mongoose from 'mongoose';
import Category from '../models/category.model';
import cloudinary from '../config/cloudinary';

// High-quality, reliable, curated ecommerce category image map keyed by category slug
export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // --- 25 TOP-LEVEL CATEGORIES ---
  'dairy-bread-eggs':
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  'fruits-vegetables':
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
  'chips-namkeen':
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
  'sweets-chocolates':
    'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
  'drinks-juices':
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  'tea-coffee-milk-drinks':
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  'instant-food':
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  'sauces-spreads':
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  'ice-cream-more':
    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80',
  'oil-ghee-masala':
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'atta-rice':
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  'bakery-biscuits':
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'dry-fruits-cream':
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
  'chicken-meat-fish':
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
  'bath-body':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'hair-care':
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
  'skin-face':
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'beauty-cosmetics':
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
  'feminine-hygiene':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'baby-care':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
  'health-pharmacy':
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'home-lifestyle':
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
  'cleaners-repellents':
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  electronics:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'stationery-games':
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',

  // --- CHILD CATEGORIES ---
  // Dairy, Bread & Eggs
  milk: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
  'curd-yogurt':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
  'butter-ghee':
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  cheese:
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80',
  'paneer-tofu':
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  bread:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'buns-pav':
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',

  // Fruits & Vegetables
  'fresh-vegetables':
    'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80',
  'leafy-vegetables':
    'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
  'root-vegetables':
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
  'onions-potatoes':
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  tomatoes:
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  'fresh-fruits':
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
  'seasonal-fruits':
    'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
  'exotic-fruits':
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',

  // Chips & Namkeen
  'potato-chips':
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
  namkeen:
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  bhujia:
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  popcorn:
    'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
  snacks:
    'https://images.unsplash.com/photo-1621996346565-e3d5d62810ef?auto=format&fit=crop&w=600&q=80',

  // Sweets & Chocolates
  chocolates:
    'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
  'indian-sweets':
    'https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&w=600&q=80',
  candy:
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
  toffee:
    'https://images.unsplash.com/photo-1575224300306-1b8da36134ce?auto=format&fit=crop&w=600&q=80',
  'gift-packs':
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80',

  // Drinks & Juices
  'soft-drinks':
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'fruit-juices':
    'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  'energy-drinks':
    'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80',
  soda: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
  'cold-beverages':
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',

  // Tea, Coffee & Milk Drinks
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  'green-tea':
    'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80',
  coffee:
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  'hot-chocolate':
    'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
  'milk-drinks':
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',

  // Instant Food
  'instant-noodles':
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  pasta:
    'https://images.unsplash.com/photo-1621996346565-e3d5d62810ef?auto=format&fit=crop&w=600&q=80',
  'ready-to-eat':
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'instant-mixes':
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',

  // Sauces & Spreads
  ketchup:
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
  mayonnaise:
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  'pasta-sauces':
    'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80',
  chutney:
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  'peanut-butter':
    'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
  jam: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',

  // Ice Cream & More
  'ice-cream':
    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80',
  kulfi:
    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
  'frozen-desserts':
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
  'frozen-snacks':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',

  // Oil, Ghee & Masala
  'cooking-oil':
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  ghee: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  spices:
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  masala:
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
  'salt-sugar':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',

  // Atta & Rice
  atta: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'multigrain-atta':
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  'basmati-rice':
    'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80',
  'poha-grains':
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',

  // Bakery & Biscuits
  biscuits:
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  cookies:
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
  cakes:
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  rusks:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'bakery-snacks':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',

  // Dry Fruits & Cream
  almonds:
    'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
  cashews:
    'https://images.unsplash.com/photo-1569420066914-1e03a95bfca5?auto=format&fit=crop&w=600&q=80',
  raisins:
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
  'mixed-dry-fruits':
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
  seeds:
    'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80',
  'cream-dessert-toppings':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',

  // Chicken, Meat & Fish
  chicken:
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
  mutton:
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  fish: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
  'ready-to-cook-meat':
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80',

  // Bath & Body
  'bath-soaps':
    'https://images.unsplash.com/photo-1607006314170-0708f3a388f8?auto=format&fit=crop&w=600&q=80',
  'body-wash':
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'hand-wash':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  deodorants:
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'body-care':
    'https://images.unsplash.com/photo-1608248597359-2ff4458f4a1a?auto=format&fit=crop&w=600&q=80',

  // Hair Care
  shampoo:
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
  conditioner:
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80',
  'hair-oil':
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=600&q=80',
  'hair-color':
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
  'hair-styling':
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',

  // Skin & Face
  'face-wash':
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  moisturizer:
    'https://images.unsplash.com/photo-1556228722-d0b630449495?auto=format&fit=crop&w=600&q=80',
  sunscreen:
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
  'face-cream':
    'https://images.unsplash.com/photo-1512290900672-1f486d3570eb?auto=format&fit=crop&w=600&q=80',
  'skin-care':
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',

  // Beauty & Cosmetics
  makeup:
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
  'lip-care':
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
  'nail-care':
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  fragrance:
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80',
  'beauty-accessories':
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80',

  // Feminine Hygiene
  'sanitary-pads':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'panty-liners':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'feminine-care':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',

  // Baby Care
  diapers:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
  'baby-food':
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
  'baby-wipes':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'baby-bath':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
  'baby-care-products':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',

  // Health & Pharmacy
  'personal-care':
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'first-aid':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'health-essentials':
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  'otc-products':
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',

  // Home & Lifestyle
  'kitchen-essentials':
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  storage:
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
  'home-utility':
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'bathroom-essentials':
    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
  'lifestyle-products':
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80',

  // Cleaners & Repellents
  'floor-cleaners':
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  'toilet-cleaners':
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  dishwash:
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
  laundry:
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
  'mosquito-repellents':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'insect-repellents':
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',

  // Electronics
  batteries:
    'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80',
  'chargers-cables':
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  'bulbs-lights':
    'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80',
  'small-electronics':
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
  'mobile-accessories':
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80',

  // Stationery & Games
  'pens-pencils':
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
  notebooks:
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'school-supplies':
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
  'art-craft':
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
  games:
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
};

export async function uploadToCloudinary(
  sourceUrl: string,
  slug: string,
): Promise<string> {
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder: 'bootkit/categories',
    public_id: `cat_${slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}

export async function runCategorySeeder(options: {
  topLevelOnly: boolean;
  dryRun: boolean;
  overwrite: boolean;
}) {
  const { topLevelOnly, dryRun, overwrite } = options;

  console.log('==================================================');
  console.log('🌱 BOOTKIT CATEGORY IMAGE SEEDER');
  console.log('==================================================');
  console.log(
    `Mode:      ${topLevelOnly ? 'Top-Level Categories Only (25)' : 'All Categories (Top-Level + Children)'}`,
  );
  console.log(
    `Dry Run:   ${dryRun ? 'YES (No Cloudinary or DB writes)' : 'NO (Live Upload & DB Update)'}`,
  );
  console.log(
    `Overwrite: ${overwrite ? 'YES (Replace existing images)' : 'NO (Only populate blank images)'}`,
  );
  console.log('--------------------------------------------------\n');

  await connectDatabase();
  console.log('✅ Connected to MongoDB Atlas.\n');

  // Filter categories based on mode
  const query: Record<string, unknown> = { deletedAt: null };
  if (topLevelOnly) {
    query.parentCategory = null;
  }

  const categories = await Category.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  let totalScanned = 0;
  let alreadyHadImage = 0;
  let successfullyUpdated = 0;
  let skipped = 0;
  let failed = 0;
  const missingMappings: string[] = [];

  for (const cat of categories) {
    totalScanned++;
    const slug = cat.slug;
    const currentImage = cat.image?.trim() || '';
    const hasImage = Boolean(currentImage);

    if (hasImage && !overwrite) {
      console.log(
        `[SKIPPED - HAS IMAGE] "${cat.name}" (${slug}) -> ${currentImage}`,
      );
      alreadyHadImage++;
      skipped++;
      continue;
    }

    const sourceImageUrl = CATEGORY_IMAGE_MAP[slug];
    if (!sourceImageUrl) {
      console.warn(`[MISSING MAPPING] "${cat.name}" (${slug})`);
      missingMappings.push(slug);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would update "${cat.name}" (${slug}):`);
      console.log(`  Source: ${sourceImageUrl}`);
      console.log(
        `  Target: Cloudinary (folder: bootkit/categories, public_id: cat_${slug})`,
      );
      successfullyUpdated++;
      continue;
    }

    // Live Execution
    try {
      console.log(`[UPLOADING] "${cat.name}" (${slug})...`);
      const secureUrl = await uploadToCloudinary(sourceImageUrl, slug);

      await Category.updateOne(
        { _id: cat._id },
        { $set: { image: secureUrl } },
      );

      console.log(`✅ [UPDATED] "${cat.name}" (${slug}) -> ${secureUrl}`);
      successfullyUpdated++;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [FAILED] "${cat.name}" (${slug}):`, errorMsg);
      failed++;
    }
  }

  console.log('\n==================================================');
  console.log('📊 CATEGORY IMAGE SEEDING SUMMARY');
  console.log('==================================================');
  console.log(`Total categories scanned: ${totalScanned}`);
  console.log(`Already had image:        ${alreadyHadImage}`);
  console.log(`Successfully updated:     ${successfullyUpdated}`);
  console.log(`Skipped:                  ${skipped}`);
  console.log(`Failed:                   ${failed}`);
  console.log(
    `Missing mappings:         ${missingMappings.length} ${missingMappings.length > 0 ? `(${missingMappings.join(', ')})` : ''}`,
  );
  console.log('==================================================\n');

  await mongoose.disconnect();
}

async function main() {
  const args = process.argv.slice(2);
  const topLevelOnly = args.includes('--top-level') || !args.includes('--all');
  const dryRun = args.includes('--dry-run');
  const overwrite = args.includes('--overwrite');

  await runCategorySeeder({
    topLevelOnly,
    dryRun,
    overwrite,
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error running category image seeder:', err);
    process.exit(1);
  });
}
