import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';

// Define schemas inline to avoid importing models
const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  active: Boolean,
  deletedAt: Date
});

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  active: Boolean,
  deletedAt: Date,
  thumbnail: String,
  gallery: [String],
  image: String
});

const StoreSchema = new mongoose.Schema({
  name: String,
  isDefault: Boolean,
  active: Boolean,
  deletedAt: Date
});

const StoreInventorySchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  active: Boolean,
  deletedAt: Date,
  stock: Number
});

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
const StoreInventory = mongoose.models.StoreInventory || mongoose.model('StoreInventory', StoreInventorySchema);

async function getCategoryAndDescendants(categoryId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const list = [categoryId];
  const subcats = await Category.find({ parentCategory: categoryId, active: true, deletedAt: null }).select('_id').lean();
  for (const s of subcats) {
    const subList = await getCategoryAndDescendants(s._id as any);
    list.push(...subList);
  }
  return list;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri!, { dbName: process.env.DB_NAME });
  console.log('Connected to database.');

  const targetSlugs = [
    'dairy-bread-eggs',
    'fruits-vegetables',
    'sweets-chocolates',
    'snacks-drinks',
    'sweets-desserts',
    'chocolates-candies',
  ];

  const defaultStore = await Store.findOne({ isDefault: true, active: true, deletedAt: null }).lean();
  if (!defaultStore) {
    console.error('No default store found');
    await mongoose.disconnect();
    return;
  }
  console.log(`Default Store: "${defaultStore.name}" (${defaultStore._id})`);

  for (const slug of targetSlugs) {
    const cat = await Category.findOne({ slug, active: true, deletedAt: null }).lean();
    if (!cat) {
      console.log(`Category "${slug}" not found in database.`);
      continue;
    }

    const descendants = await getCategoryAndDescendants(cat._id as any);
    const totalProducts = await Product.countDocuments({ category: { $in: descendants }, active: true, deletedAt: null });
    const productsWithImages = await Product.countDocuments({
      category: { $in: descendants },
      active: true,
      deletedAt: null,
      $or: [
        { thumbnail: { $nin: [null, ''] } },
        { gallery: { $not: { $size: 0 } } },
        { image: { $nin: [null, ''] } },
      ]
    });

    const productIds = (await Product.find({ category: { $in: descendants }, active: true, deletedAt: null }).select('_id').lean()).map(p => p._id);
    const inventoriesCount = await StoreInventory.countDocuments({
      store: defaultStore._id,
      product: { $in: productIds },
      active: true,
      deletedAt: null
    });

    console.log(`\nCategory: "${cat.name}" (${slug})`);
    console.log(`- Descendant Categories Count: ${descendants.length}`);
    console.log(`- Total Active Products: ${totalProducts}`);
    console.log(`- Products with Images: ${productsWithImages}`);
    console.log(`- Active StoreInventory records for default store: ${inventoriesCount}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
