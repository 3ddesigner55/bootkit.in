import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_MONGO_URI = process.env.MONGODB_URI;
const TEST_DB_NAME = process.env.DB_NAME;

async function run() {
  console.log('Connecting to database:', TEST_DB_NAME);
  if (!TEST_MONGO_URI) {
    throw new Error('MONGODB_URI not found in env.');
  }
  await mongoose.connect(TEST_MONGO_URI, { dbName: TEST_DB_NAME });

  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }), 'categories');

  const rootId = '69c75908e600000000000001';
  const rootCat = await Category.findById(rootId).lean();
  console.log('Root category:', rootCat);

  const subcategories = await Category.find({ parentCategory: rootId }).lean();
  console.log(`Subcategories of ${rootId} count: ${subcategories.length}`);
  subcategories.forEach((cat: any) => {
    console.log(`- ID: ${cat._id}, Name: ${cat.name}, Active: ${cat.active}, Deleted: ${cat.deletedAt}`);
  });

  const allCategories = await Category.find({}).lean();
  console.log(`Total categories in DB: ${allCategories.length}`);
  allCategories.slice(0, 10).forEach((cat: any) => {
    console.log(`- ID: ${cat._id}, Name: ${cat.name}, ParentCategory: ${cat.parentCategory}, Active: ${cat.active}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
