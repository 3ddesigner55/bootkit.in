import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { ObjectId } = mongoose.Types;
import HomeConfig from '../models/homeConfig.model';
import HomeConfigAudit from '../models/homeConfigAudit.model';
import {
  saveDraftConfig,
  createDefaultDraft,
  publishConfiguration,
  removeSectionFromDraft
} from '../services/adminHomeConfig.service';

const TEST_MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const TEST_DB_NAME = 'bootkit_test_partial_overwrite';

async function runTest() {
  console.log(`Connecting to isolated test database: ${TEST_DB_NAME}...`);
  await mongoose.connect(TEST_MONGO_URI, { dbName: TEST_DB_NAME });
  
  // Clean collections in the isolated test database
  await HomeConfig.deleteMany({});
  await HomeConfigAudit.deleteMany({});

  console.log('Creating initial DRAFT configuration with 9 sections...');
  const userId = new ObjectId().toString();
  const userRole = 'ADMIN';
  
  const draft = await createDefaultDraft(userId, userRole, 'GLOBAL', null);
  console.log(`Initial draft created with version: v${draft.configVersion}, sections count: ${draft.sections.length}`);
  
  if (draft.sections.length !== 9) {
    throw new Error(`Expected 9 sections initially, but got ${draft.sections.length}`);
  }

  // Preserve the byte-for-byte state of other 8 sections
  const initialSectionsJson = JSON.stringify(draft.sections);
  const originalSections = JSON.parse(initialSectionsJson);
  
  // Find the Grocery kitchen section
  const grocerySection = originalSections.find((s: any) => s.sectionId === 'grocery_kitchen');
  if (!grocerySection) {
    throw new Error('Grocery Kitchen section not found in initial draft.');
  }

  console.log('Editing Grocery section...');
  grocerySection.title = 'Updated Grocery & Kitchen';
  grocerySection.subtitle = 'New Fresh Arrivals';

  // Construct Save Payload containing the updated Grocery section alongside the unmodified 8 sections
  const savePayload = {
    scopeType: 'GLOBAL' as const,
    scopeId: null,
    expectedVersion: draft.configVersion,
    sections: originalSections,
  };

  console.log('Saving draft...');
  const savedDraft = await saveDraftConfig(userId, userRole, savePayload);
  
  console.log(`Draft saved. New sections count: ${savedDraft.sections.length}`);
  if (savedDraft.sections.length !== 9) {
    throw new Error(`Expected 9 sections after save, but got ${savedDraft.sections.length}`);
  }

  // Verify other 8 sections remain byte-for-byte unchanged
  const savedSectionsJson = JSON.parse(JSON.stringify(savedDraft.sections));
  for (const originalSec of originalSections) {
    const savedSec = savedSectionsJson.find((s: any) => s.sectionId === originalSec.sectionId);
    if (!savedSec) {
      throw new Error(`Section ${originalSec.sectionId} missing after save.`);
    }
    
    if (originalSec.sectionId === 'grocery_kitchen') {
      if (savedSec.title !== 'Updated Grocery & Kitchen' || savedSec.subtitle !== 'New Fresh Arrivals') {
        throw new Error('Grocery section was not updated successfully.');
      }
    } else {
      // Byte-for-byte validation of other 8 sections
      if (JSON.stringify(originalSec) !== JSON.stringify(savedSec)) {
        console.error('Mismatch found in:', originalSec.sectionId);
        console.error('Original:', originalSec);
        console.error('Saved:', savedSec);
        throw new Error(`Section ${originalSec.sectionId} was modified unexpectedly.`);
      }
    }
  }
  console.log('✅ Verification passed: Other 8 sections remain byte-for-byte unchanged!');

  // Test reject accidental partial replacements
  console.log('Testing rejection of accidental partial replacements...');
  const partialSections = originalSections.slice(0, 5); // Only 5 sections
  const partialPayload = {
    scopeType: 'GLOBAL' as const,
    scopeId: null,
    expectedVersion: savedDraft.configVersion,
    sections: partialSections,
  };

  try {
    await saveDraftConfig(userId, userRole, partialPayload);
    throw new Error('Expected backend to reject partial save request, but it succeeded.');
  } catch (err: any) {
    if (err.message.includes('Accidental partial replacement detected')) {
      console.log('✅ Verification passed: Backend successfully rejected partial save request!');
    } else {
      throw err;
    }
  }

  // Test publish configuration
  console.log('Publishing configuration...');
  const publishResult = await publishConfiguration(userId, userRole, 'GLOBAL', null);
  const publishedConfig = publishResult.published;
  console.log(`Published version: v${publishedConfig.configVersion}, sections count: ${publishedConfig.sections.length}`);
  
  if (publishedConfig.configVersion !== 1) {
    throw new Error(`Expected published version to be v1, got v${publishedConfig.configVersion}`);
  }
  if (publishedConfig.sections.length !== 9) {
    throw new Error(`Expected published config to have 9 sections, got ${publishedConfig.sections.length}`);
  }
  console.log('✅ Verification passed: Published config contains exactly 9 sections!');

  // Test monotonic version increase
  console.log('Creating new draft and publishing again to test monotonic versioning...');
  const draft2 = await createDefaultDraft(userId, userRole, 'GLOBAL', null);
  const publishResult2 = await publishConfiguration(userId, userRole, 'GLOBAL', null);
  const publishedConfig2 = publishResult2.published;
  console.log(`Published second configuration. Version is now: v${publishedConfig2.configVersion}`);
  
  if (publishedConfig2.configVersion !== 2) {
    throw new Error(`Expected version v2 on second publish, got v${publishedConfig2.configVersion}`);
  }
  console.log('✅ Verification passed: Config version increased monotonically (v1 -> v2)!');

  // Test explicit remove action
  console.log('Testing explicit remove section action...');
  const draft3 = await createDefaultDraft(userId, userRole, 'GLOBAL', null);
  const sectionIdToRemove = 'store_spotlight';
  
  console.log(`Removing section "${sectionIdToRemove}" explicitly...`);
  const removedDraft = await removeSectionFromDraft(userId, userRole, 'GLOBAL', null, sectionIdToRemove);
  
  console.log(`New sections count after remove: ${removedDraft.sections.length}`);
  if (removedDraft.sections.length !== 8) {
    throw new Error(`Expected 8 sections after explicit removal, got ${removedDraft.sections.length}`);
  }
  
  const hasRemoved = removedDraft.sections.some((s: any) => s.sectionId === sectionIdToRemove);
  if (hasRemoved) {
    throw new Error(`Section ${sectionIdToRemove} is still present in draft.`);
  }
  console.log('✅ Verification passed: Explicit remove section action works correctly!');

  await mongoose.disconnect();
  console.log('All tests passed successfully!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
