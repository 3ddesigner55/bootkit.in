import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import HomeConfig from '../models/homeConfig.model';
import {
  saveDraftConfig,
  validateConfiguration,
  previewConfiguration,
  publishConfiguration,
} from '../services/adminHomeConfig.service';

const USER_ID = '6a761c550bce0980f88c258a'; // OWNER
const USER_ROLE = 'OWNER';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri!, { dbName: 'keshavmeena7424_db_user' });
  try {
    console.log('=== STEP 1: Fetch Current Draft ===');
    let draft = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
    if (!draft) {
      console.log('No draft found, creating from published...');
      const published = await HomeConfig.findOne({ status: 'PUBLISHED', scopeType: 'GLOBAL' }).lean();
      if (published) {
        draft = new HomeConfig({
          ...published,
          _id: new mongoose.Types.ObjectId(),
          status: 'DRAFT',
          configVersion: published.configVersion + 1,
        });
        await draft.save();
      } else {
        console.error('No published or draft config found!');
        return;
      }
    }

    console.log(`Current Draft ID: ${draft._id} | Version: ${draft.configVersion}`);

    console.log('=== STEP 2: Modify Sections in Draft ===');
    const sections = draft.sections.map(s => s.toObject ? s.toObject() : s);

    // Find or create grocery_kitchen
    let gk = sections.find(s => s.sectionId === 'grocery_kitchen');
    if (!gk) {
      console.log('Creating grocery_kitchen section...');
      gk = {
        sectionId: 'grocery_kitchen',
        type: 'category_cards',
        active: true,
        title: 'Grocery & Kitchen',
        subtitle: '',
        itemMode: 'CATEGORY',
        items: [],
        sourceCategoryId: null,
      };
      sections.push(gk);
    } else {
      gk.active = true;
      gk.type = 'category_cards';
      gk.title = 'Grocery & Kitchen';
      gk.sourceCategoryId = null;
    }

    // Find or create household_essentials
    let he = sections.find(s => s.sectionId === 'household_essentials');
    if (!he) {
      console.log('Creating household_essentials section...');
      he = {
        sectionId: 'household_essentials',
        type: 'category_cards',
        active: true,
        title: 'Household Essentials',
        subtitle: '',
        itemMode: 'CATEGORY',
        items: [],
        sourceCategoryId: null,
      };
      sections.push(he);
    } else {
      he.active = true;
      he.type = 'category_cards';
      he.title = 'Household Essentials';
      he.sourceCategoryId = null;
    }

    const bs = sections.find(s => s.sectionId === 'best_sellers_home');
    if (bs) {
      bs.sortOrder = 1;
      bs.active = true;
    }
    gk.sortOrder = 2;
    he.sortOrder = 3;

    let otherOrder = 4;
    sections.forEach(s => {
      if (s.sectionId !== 'best_sellers_home' && s.sectionId !== 'grocery_kitchen' && s.sectionId !== 'household_essentials') {
        s.sortOrder = otherOrder++;
      }
    });

    console.log('Proposed Sections layout:');
    sections.sort((a, b) => a.sortOrder - b.sortOrder).forEach(s => {
      console.log(`- Section "${s.sectionId}" (type: "${s.type}", active: ${s.active}, sortOrder: ${s.sortOrder})`);
    });

    console.log('=== STEP 3: Save Draft ===');
    const savedDraft = await saveDraftConfig(
      USER_ID,
      USER_ROLE,
      {
        scopeType: 'GLOBAL',
        scopeId: null,
        expectedVersion: draft.configVersion,
        sections,
      }
    );
    console.log('Draft saved successfully!');

    console.log('=== STEP 4: Validate Configuration ===');
    const validation = await validateConfiguration(savedDraft);
    console.log('Validation result:', JSON.stringify(validation, null, 2));
    if (!validation.isValid) {
      console.error('Validation failed! Cannot publish.');
      return;
    }

    console.log('=== STEP 5: Preview Configuration ===');
    const preview = await previewConfiguration('GLOBAL', null);
    console.log('Preview successfully generated. Total sections:', preview.sections.length);

    console.log('=== STEP 6: Publish Configuration ===');
    const published = await publishConfiguration(USER_ID, USER_ROLE, 'GLOBAL', null);
    console.log(`Configuration version ${published.configVersion} published successfully!`);

  } catch (error) {
    console.error('Error during save & publish:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
