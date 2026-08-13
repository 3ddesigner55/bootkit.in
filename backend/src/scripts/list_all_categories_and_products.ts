import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri!, { dbName: process.env.DB_NAME });

  const categories = await mongoose.connection.db!.collection('categories').find({}).toArray();
  const products = await mongoose.connection.db!.collection('products').find({}).toArray();

  console.log('=== CATEGORIES ===');
  categories.forEach(c => {
    console.log(`- ${c.name} (${c.slug}) id: ${c._id.toString()} parent: ${c.parentCategory ? c.parentCategory.toString() : 'None'}`);
  });

  console.log('\n=== PRODUCTS (first 15) ===');
  products.slice(0, 15).forEach(p => {
    console.log(`- ${p.name} (${p.slug}) category: ${p.category ? p.category.toString() : 'None'}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
