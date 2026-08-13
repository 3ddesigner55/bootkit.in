import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import HomeConfig, { type HomeConfigSection } from '../models/homeConfig.model';
import Category from '../models/category.model';
import HomeConfigAudit from '../models/homeConfigAudit.model';
import fs from 'fs';

const EXPECTED_MAPPINGS = {
  grocery_kitchen: { name: 'Grocery & Kitchen', slug: 'grocery-kitchen', level: 1 },
  snacks_drinks: { name: 'Snacks & Drinks', slug: 'snacks-drinks', level: 1 },
  household_essentials: { name: 'Household Essentials', slug: 'household-essentials', level: 1 },
  beauty_personal_care: { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', level: 1 },
  sweet_tooth: { name: 'Chocolates & Candies', slug: 'chocolates-candies', level: 3 },
};

async function getCategoryBySlugAndLevel(slug: string, expectedLevel: number): Promise<any> {
  const cat = await Category.findOne({ slug, active: true, deletedAt: null }).populate('parentCategory');
  if (!cat) {
    return null;
  }

  // Calculate level
  let level = 1;
  if (cat.parentCategory) {
    level = 2;
    const parent = await Category.findOne({ _id: (cat.parentCategory as any)._id || cat.parentCategory, deletedAt: null });
    if (parent && parent.parentCategory) {
      level = 3;
      const grandParent = await Category.findOne({ _id: parent.parentCategory, deletedAt: null });
      if (grandParent && grandParent.parentCategory) {
        level = 4;
      }
    }
  }

  if (level !== expectedLevel) {
    console.warn(`[WARNING] Category "${cat.name}" matches slug "${slug}" but is Level ${level} instead of expected Level ${expectedLevel}`);
    return null;
  }

  return cat;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: 'keshavmeena7424_db_user' });

  console.log('=== VERSION-SAFE HOME CONFIG DRAFT RECOVERY SCRIPT (DRY RUN) ===');

  const draft = await HomeConfig.findOne({ status: 'DRAFT', scopeType: 'GLOBAL' });
  if (!draft) {
    console.log('No DRAFT configuration found in database.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Current DRAFT ID: ${draft._id.toString()} | Version: ${draft.configVersion}`);

  // Resolve target categories
  const resolvedTargets: Record<string, any> = {};
  for (const [sectionKey, meta] of Object.entries(EXPECTED_MAPPINGS)) {
    const cat = await getCategoryBySlugAndLevel(meta.slug, meta.level);
    if (cat) {
      resolvedTargets[sectionKey] = cat;
      console.log(`Resolved target for "${sectionKey}": ${cat.name} (${cat._id.toString()})`);
    } else {
      console.log(`[MISSING] Target category slug "${meta.slug}" not found or level mismatch in DB.`);
    }
  }

  const proposedSections: HomeConfigSection[] = [];
  const diffs: string[] = [];

  // Update existing sections
  for (const section of draft.sections) {
    const mapping = EXPECTED_MAPPINGS[section.sectionId as keyof typeof EXPECTED_MAPPINGS];
    if (mapping) {
      const targetCat = resolvedTargets[section.sectionId];
      const oldVal = section.sourceCategoryId ? section.sourceCategoryId.toString() : 'null';
      const newVal = targetCat ? targetCat._id.toString() : 'null';

      if (oldVal !== newVal) {
        diffs.push(`Section "${section.sectionId}": sourceCategoryId changed from ${oldVal} to ${newVal} (${mapping.name})`);
        section.sourceCategoryId = targetCat ? targetCat._id : null;
      }
    }
    proposedSections.push(section);
  }

  // Check for missing sections
  const requiredMissing = [
    {
      sectionId: 'offer_section',
      type: 'offer',
      title: 'Offers',
      subtitle: '',
      active: false,
      sortOrder: 1,
      items: [],
      itemMode: 'MANUAL',
    },
    {
      sectionId: 'dry_food_masala',
      type: 'category_cards',
      title: 'Dry Food & Masala',
      subtitle: '',
      active: false,
      sortOrder: 4,
      items: [],
      itemMode: 'MANUAL',
    }
  ];

  for (const missing of requiredMissing) {
    const exists = draft.sections.some((s: any) => s.sectionId === missing.sectionId);
    if (!exists) {
      diffs.push(`Add new section "${missing.sectionId}" (type: "${missing.type}", title: "${missing.title}", active: false)`);
      proposedSections.push(missing as any);
    }
  }

  console.log('\n=== PROPOSED DRAFT DIFFS ===');
  if (diffs.length === 0) {
    console.log('No changes proposed. Draft is already correct.');
  } else {
    for (const d of diffs) {
      console.log(`  + ${d}`);
    }
  }

  const execute = process.argv.includes('--execute');
  if (execute) {
    console.log('\nExecution flag --execute passed. Creating backup and updating Draft...');
    
    // Create backup directory outside committed repo
    const backupDir = '/Users/3ddesigner/.gemini/antigravity/antigravity_backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `homeconfigs_draft_backup_${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(draft.toObject(), null, 2));
    console.log(`Backup saved to: ${backupPath}`);

    draft.sections = proposedSections;
    await draft.save();

    await HomeConfigAudit.create({
      configId: draft._id,
      version: draft.configVersion,
      action: 'DRAFT_UPDATED',
      actor: new mongoose.Types.ObjectId('600000000000000000000001'), // generic Admin ID for script
      actorRole: 'ADMIN',
      metadata: {
        timestamp: new Date(),
        reason: 'Migration recovery script update',
        diffs,
      }
    });

    console.log('Draft configuration updated successfully inside database.');
  } else {
    console.log('\n[DRY RUN] No writes performed to primary database. Pass --execute to execute update.');
  }

  await mongoose.disconnect();
}

main().catch(console.error);
