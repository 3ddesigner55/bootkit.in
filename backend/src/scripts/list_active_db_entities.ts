import 'dotenv/config';
import mongoose from 'mongoose';

async function listActiveEntities() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri!, { dbName: 'keshavmeena7424_db_user' });

  const categories = await mongoose.connection.db!.collection('categories').find({
    active: true,
    deletedAt: null
  }).toArray();

  const brands = await mongoose.connection.db!.collection('brands').find({
    active: true,
    deletedAt: null
  }).toArray();

  const stores = await mongoose.connection.db!.collection('stores').find({
    active: true,
    deletedAt: null
  }).toArray();

  console.log('=== ACTIVE CATEGORIES ===');
  console.log(JSON.stringify(categories.map(c => ({
    name: c.name,
    slug: c.slug,
    collectionHub: c.collectionHub || null,
    displayOrder: c.displayOrder ?? 0,
  })), null, 2));

  console.log('=== ACTIVE BRANDS ===');
  console.log(JSON.stringify(brands.map(b => ({
    name: b.name,
    slug: b.slug,
  })), null, 2));

  console.log('=== ACTIVE STORES ===');
  console.log(JSON.stringify(stores.map(s => ({
    name: s.name,
    slug: s.slug,
    isDefault: s.isDefault ?? false,
    _id: s._id.toString(),
  })), null, 2));

  const homeConfigs = await mongoose.connection.db!.collection('homeconfigs').find({}).toArray();

  console.log('=== HOMECONFIGS ===');
  console.log(JSON.stringify(homeConfigs.map(hc => ({
    _id: hc._id.toString(),
    status: hc.status,
    scopeType: hc.scopeType,
    configVersion: hc.configVersion,
    sectionsCount: hc.sections?.length || 0,
  })), null, 2));

  console.log('=== TOTALS ===');
  console.log(`Active Categories: ${categories.length}`);
  console.log(`Active Brands: ${brands.length}`);
  console.log(`Active Stores: ${stores.length}`);
  console.log(`HomeConfigs: ${homeConfigs.length}`);

  await mongoose.disconnect();
}

listActiveEntities().catch(console.error);
