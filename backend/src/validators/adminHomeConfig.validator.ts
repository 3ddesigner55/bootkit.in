import { isValidObjectId } from 'mongoose';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';
import type {
  HomeConfigItem,
  HomeConfigSection,
  ItemMode,
  ItemTargetType,
  ItemType,
  SectionType,
} from '../models/homeConfig.model';

const APPROVED_SECTION_TYPES: SectionType[] = [
  'hero_banner',
  'hero_carousel',
  'offer',
  'offer_section',
  'best_sellers',
  'best_seller_grid',
  'grocery_kitchen',
  'dry_food_masala',
  'household_essentials',
  'sweet_tooth',
  'featured_banner',
  'featured_this_week',
  'snacks_drinks',
  'beauty_personal_care',
  'store_spotlight',
  'category_cards',
  'product_grid',
  'category_grid',
];

const APPROVED_TARGET_TYPES: ItemTargetType[] = [
  'product',
  'category',
  'collection',
  'search',
  'offer',
  'internal_page',
];

const SECTION_ITEM_COMPATIBILITY: Record<SectionType, ItemType[]> = {
  hero_banner: ['banner'],
  hero_carousel: ['banner'],
  featured_banner: ['banner'],
  featured_this_week: ['banner'],
  offer: ['offer'],
  offer_section: ['offer'],
  best_sellers: ['category', 'collection'],
  best_seller_grid: ['category', 'collection'],
  grocery_kitchen: ['category'],
  dry_food_masala: ['product'],
  household_essentials: ['category'],
  sweet_tooth: ['product'],
  snacks_drinks: ['category'],
  beauty_personal_care: ['category'],
  store_spotlight: ['store'],
  category_cards: ['category'],
  product_grid: ['product'],
  category_grid: ['category'],
};

const SECTION_CAPACITY_LIMITS: Record<SectionType, number> = {
  hero_banner: 10,
  hero_carousel: 10,
  featured_banner: 10,
  featured_this_week: 10,
  offer: 10,
  offer_section: 10,
  best_sellers: 12,
  best_seller_grid: 12,
  grocery_kitchen: 24,
  dry_food_masala: 24,
  household_essentials: 24,
  sweet_tooth: 24,
  snacks_drinks: 24,
  beauty_personal_care: 24,
  store_spotlight: 10,
  category_cards: 24,
  product_grid: 24,
  category_grid: 24,
};


const HTML_TAG_REGEX = /<[a-z/][\s\S]*>/i;
const JS_INJECTION_REGEX = /(javascript:|eval\(|<script|onclick|onload)/i;

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

function sanitizeText(value: unknown, fieldName: string): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw validationError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (HTML_TAG_REGEX.test(trimmed) || JS_INJECTION_REGEX.test(trimmed)) {
    throw validationError(
      `Invalid characters or code detected in ${fieldName}. HTML and executable code are prohibited.`,
    );
  }

  return trimmed;
}

export type SaveDraftInput = {
  scopeType: 'GLOBAL' | 'CITY' | 'STORE';
  scopeId: string | null;
  expectedVersion?: number;
  sections: HomeConfigSection[];
};

export function validateHomeConfigSection(section: any, index: number): HomeConfigSection {
  if (!section || typeof section !== 'object') {
    throw validationError(`Section at index ${index} must be an object.`);
  }

  if (typeof section.sectionId !== 'string' || !section.sectionId.trim()) {
    throw validationError(`Section at index ${index} requires a non-empty sectionId.`);
  }

  const sectionId = section.sectionId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(sectionId)) {
    throw validationError(
      `Section ID "${sectionId}" contains invalid characters. Only alphanumeric, dashes and underscores are allowed.`,
    );
  }

  if (!APPROVED_SECTION_TYPES.includes(section.type)) {
    throw validationError(
      `Invalid section type "${section.type}" at index ${index}. Approved types are: ${APPROVED_SECTION_TYPES.join(', ')}`,
    );
  }

  const allowedItemTypes = SECTION_ITEM_COMPATIBILITY[section.type as SectionType];
  const maxCapacity = SECTION_CAPACITY_LIMITS[section.type as SectionType];

  const itemMode: ItemMode = ['MANUAL', 'BEST_SELLING', 'CATEGORY', 'RECENT'].includes(section.itemMode)
    ? section.itemMode
    : 'MANUAL';

  if (itemMode === 'BEST_SELLING' && !['best_sellers', 'product_grid'].includes(section.type)) {
    throw validationError(`BEST_SELLING mode is not allowed for section type "${section.type}".`);
  }

  if (itemMode === 'RECENT' && section.type !== 'product_grid') {
    throw validationError(`RECENT mode is only allowed for "product_grid" sections.`);
  }

  // Date validation
  let startAt: Date | null = null;
  let endAt: Date | null = null;
  if (section.startAt) {
    startAt = new Date(section.startAt);
    if (isNaN(startAt.getTime())) throw validationError(`Invalid startAt date in section "${sectionId}".`);
  }
  if (section.endAt) {
    endAt = new Date(section.endAt);
    if (isNaN(endAt.getTime())) throw validationError(`Invalid endAt date in section "${sectionId}".`);
  }
  if (startAt && endAt && startAt >= endAt) {
    throw validationError(`startAt must be strictly earlier than endAt in section "${sectionId}".`);
  }

  const seenReferenceIds = new Set<string>();
  const validatedItems: HomeConfigItem[] = [];

  if (Array.isArray(section.items)) {
    if (section.items.length > maxCapacity) {
      throw validationError(
        `Section "${sectionId}" exceeds maximum capacity of ${maxCapacity} items (provided: ${section.items.length}).`,
      );
    }

    section.items.forEach((item: any, itemIdx: number) => {
      if (!item || typeof item !== 'object') {
        throw validationError(`Item at index ${itemIdx} in section "${sectionId}" must be an object.`);
      }

      if (!allowedItemTypes.includes(item.itemType)) {
        throw validationError(
          `Incompatible itemType "${item.itemType}" in section "${sectionId}" of type "${section.type}". Allowed item types: ${allowedItemTypes.join(', ')}`,
        );
      }

      if (!item.referenceId || !isValidObjectId(item.referenceId)) {
        throw validationError(
          `Invalid or missing referenceId in section "${sectionId}" item ${itemIdx}. Must be a valid MongoDB ObjectId.`,
        );
      }

      const refIdStr = item.referenceId.toString();
      if (seenReferenceIds.has(refIdStr)) {
        throw validationError(
          `Duplicate referenceId "${refIdStr}" detected in section "${sectionId}". Items within a section must be unique.`,
        );
      }
      seenReferenceIds.add(refIdStr);

      const targetType: ItemTargetType = APPROVED_TARGET_TYPES.includes(item.targetType)
        ? item.targetType
        : 'category';

      const targetValue = sanitizeText(item.targetValue, `items[${itemIdx}].targetValue in section ${sectionId}`);

      validatedItems.push({
        itemType: item.itemType,
        referenceId: item.referenceId,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : itemIdx + 1,
        active: item.active !== false,
        targetType,
        targetValue,
      });
    });
  }

  let sourceCategoryId: any = null;
  if (section.sourceCategoryId) {
    if (!isValidObjectId(section.sourceCategoryId)) {
      throw validationError(`Invalid sourceCategoryId in section "${sectionId}".`);
    }
    sourceCategoryId = section.sourceCategoryId;
  }

  const layoutKey = ['CATEGORY_GRID_4', 'PRODUCT_GRID_3X2', 'BEST_SELLERS_3X2'].includes(section.layoutKey)
    ? section.layoutKey
    : null;

  const selectionMode = ['AUTOMATIC', 'MANUAL'].includes(section.selectionMode)
    ? section.selectionMode
    : null;

  const rowCount = typeof section.rowCount === 'number' ? section.rowCount : null;

  return {
    sectionId,
    type: section.type,
    active: section.active !== false,
    sortOrder: typeof section.sortOrder === 'number' ? section.sortOrder : index + 1,
    title: sanitizeText(section.title, `title in section ${sectionId}`),
    subtitle: sanitizeText(section.subtitle, `subtitle in section ${sectionId}`),
    itemMode,
    items: validatedItems,
    sourceCategoryId,
    startAt,
    endAt,
    layoutKey,
    selectionMode,
    rowCount,
  };
}

export function validateSaveDraftInput(input: unknown): SaveDraftInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  const body = input as Record<string, any>;
  const scopeType = body.scopeType || 'GLOBAL';
  if (!['GLOBAL', 'CITY', 'STORE'].includes(scopeType)) {
    throw validationError('scopeType must be GLOBAL, CITY, or STORE.');
  }

  let scopeId: string | null = null;
  if (scopeType === 'GLOBAL') {
    if (body.scopeId && body.scopeId !== 'null' && body.scopeId !== '') {
      throw validationError('GLOBAL scope requires scopeId to be null.');
    }
    scopeId = null;
  } else if (scopeType === 'STORE') {
    if (!body.scopeId || !isValidObjectId(body.scopeId)) {
      throw validationError('STORE scope requires a valid MongoDB Store ObjectId.');
    }
    scopeId = body.scopeId.trim();
  } else if (scopeType === 'CITY') {
    if (!body.scopeId || typeof body.scopeId !== 'string' || !body.scopeId.trim()) {
      throw validationError('CITY scope requires a non-empty city/delivery area identifier.');
    }
    scopeId = body.scopeId.trim();
  }

  if (!Array.isArray(body.sections)) {
    throw validationError('sections must be an array.');
  }

  const seenSectionIds = new Set<string>();
  const validatedSections: HomeConfigSection[] = body.sections.map(
    (sec: any, idx: number) => {
      const validated = validateHomeConfigSection(sec, idx);
      if (seenSectionIds.has(validated.sectionId)) {
        throw validationError(`Duplicate sectionId "${validated.sectionId}" found. Every sectionId must be unique.`);
      }
      seenSectionIds.add(validated.sectionId);
      return validated;
    },
  );

  return {
    scopeType,
    scopeId,
    expectedVersion: typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined,
    sections: validatedSections,
  };
}
