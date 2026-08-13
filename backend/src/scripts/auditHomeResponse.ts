import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_MONGO_URI = process.env.MONGODB_URI;
const TEST_DB_NAME = process.env.DB_NAME;

import { getHomeData } from '../services/home.service';

async function run() {
  console.log('Connecting to database:', TEST_DB_NAME);
  if (!TEST_MONGO_URI) {
    throw new Error('MONGODB_URI not found in env.');
  }
  await mongoose.connect(TEST_MONGO_URI, { dbName: TEST_DB_NAME });

  const homeData = await getHomeData(undefined, undefined);
  console.log('Resolved Home Data config:');
  if (homeData.config) {
    console.log(`Version: v${homeData.config.configVersion}`);
    console.log(`Sections count: ${homeData.config.sections.length}`);
    homeData.config.sections.forEach((sec: any, idx: number) => {
      console.log(`Section [${idx + 1}] ID: ${sec.sectionId}, Type: ${sec.type}, Title: "${sec.title}"`);
      console.log(`  Items count: ${sec.items ? sec.items.length : 0}`);
      if (sec.items && sec.items.length > 0) {
        sec.items.forEach((item: any, itemIdx: number) => {
          console.log(`    - Item [${itemIdx + 1}] Type: ${item.itemType}, RefId: ${item.referenceId}, Name/Title: "${item.name || item.title || ''}"`);
        });
      }
    });
  } else {
    console.log('No homeData.config found!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
