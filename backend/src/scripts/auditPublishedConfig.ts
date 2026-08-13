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

  const HomeConfig = mongoose.model('HomeConfig', new mongoose.Schema({}, { strict: false }), 'homeconfigs');

  const configs: any[] = await HomeConfig.find({ status: 'PUBLISHED' }).lean();
  console.log(`Found ${configs.length} published configs:`);
  for (const config of configs) {
    console.log(`- Scope: ${config.scopeType}, Version: ${config.configVersion}`);
    console.log(`  Sections count: ${config.sections ? config.sections.length : 0}`);
    if (config.sections) {
      config.sections.forEach((sec: any, idx: number) => {
        console.log(`    [${idx + 1}] ID: ${sec.sectionId}, Type: ${sec.type}, Active: ${sec.active}`);
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
