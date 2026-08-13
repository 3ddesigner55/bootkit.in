import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import HomeConfig from '../models/homeConfig.model';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("No MONGODB_URI found.");
    return;
  }
  await mongoose.connect(mongoUri, { dbName: 'keshavmeena7424_db_user' });
  try {
    const config = await HomeConfig.findOne({ status: 'PUBLISHED' }).lean();
    if (config) {
      const section = config.sections.find((s: any) => s.sectionId === 'best_sellers_home');
      console.log("BEST SELLERS HOME SECTION:", JSON.stringify(section, null, 2));
    } else {
      console.log("NO PUBLISHED CONFIG FOUND!");
    }
  } finally {
    await mongoose.disconnect();
  }
}

main();
