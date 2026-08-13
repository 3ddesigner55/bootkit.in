import { model, models, Schema, type Document, type Types } from 'mongoose';

export type SectionType =
  | 'hero_banner'
  | 'hero_carousel'
  | 'offer'
  | 'offer_section'
  | 'best_sellers'
  | 'best_seller_grid'
  | 'grocery_kitchen'
  | 'dry_food_masala'
  | 'household_essentials'
  | 'sweet_tooth'
  | 'featured_banner'
  | 'featured_this_week'
  | 'snacks_drinks'
  | 'beauty_personal_care'
  | 'store_spotlight'
  | 'category_cards'
  | 'product_grid'
  | 'category_grid';


export type ItemTargetType =
  | 'product'
  | 'category'
  | 'collection'
  | 'search'
  | 'offer'
  | 'internal_page';

export type ItemType =
  | 'product'
  | 'category'
  | 'banner'
  | 'offer'
  | 'collection'
  | 'store';

export type ItemMode = 'MANUAL' | 'BEST_SELLING' | 'CATEGORY' | 'RECENT';

export type HomeConfigItem = {
  itemType: ItemType;
  referenceId: Types.ObjectId;
  sortOrder: number;
  active: boolean;
  targetType?: ItemTargetType;
  targetValue?: string;
  displayProductIds?: Types.ObjectId[];
};

export type LayoutKey = 'CATEGORY_GRID_4' | 'PRODUCT_GRID_3X2' | 'BEST_SELLERS_3X2';
export type SelectionMode = 'AUTOMATIC' | 'MANUAL';

export type HomeConfigSection = {
  sectionId: string;
  type: SectionType;
  active: boolean;
  sortOrder: number;
  title?: string;
  subtitle?: string;
  itemMode?: ItemMode;
  items: HomeConfigItem[];
  sourceCategoryId?: Types.ObjectId | null;
  startAt?: Date | null;
  endAt?: Date | null;
  layoutKey?: LayoutKey | null;
  selectionMode?: SelectionMode | null;
  rowCount?: number | null;
};

export type HomeConfigDocument = Document & {
  schemaVersion: string;
  configVersion: number;
  scopeType: 'GLOBAL' | 'CITY' | 'STORE';
  scopeId?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sections: HomeConfigSection[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const homeConfigItemSchema = new Schema<HomeConfigItem>(
  {
    itemType: {
      type: String,
      enum: ['product', 'category', 'banner', 'offer', 'collection', 'store'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    targetType: {
      type: String,
      enum: ['product', 'category', 'collection', 'search', 'offer', 'internal_page'],
      default: 'category',
    },
    targetValue: { type: String, trim: true, default: '' },
    displayProductIds: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
  },
  { _id: false },
);

const homeConfigSectionSchema = new Schema<HomeConfigSection>(
  {
    sectionId: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
    },

    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    itemMode: {
      type: String,
      enum: ['MANUAL', 'BEST_SELLING', 'CATEGORY', 'RECENT'],
      default: 'MANUAL',
    },
    items: { type: [homeConfigItemSchema], default: [] },
    sourceCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    layoutKey: {
      type: String,
      enum: ['CATEGORY_GRID_4', 'PRODUCT_GRID_3X2', 'BEST_SELLERS_3X2'],
      default: null,
    },
    selectionMode: {
      type: String,
      enum: ['AUTOMATIC', 'MANUAL'],
      default: null,
    },
    rowCount: { type: Number, default: null },
  },
  { _id: false },
);

const homeConfigSchema = new Schema<HomeConfigDocument>(
  {
    schemaVersion: { type: String, default: '1.0.0', required: true },
    configVersion: { type: Number, required: true, default: 1 },
    scopeType: {
      type: String,
      enum: ['GLOBAL', 'CITY', 'STORE'],
      default: 'GLOBAL',
      required: true,
    },
    scopeId: { type: String, default: null },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    sections: { type: [homeConfigSectionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

homeConfigSchema.index({ status: 1, scopeType: 1, configVersion: -1 });
homeConfigSchema.index({ scopeType: 1, scopeId: 1 });
homeConfigSchema.index(
  { scopeType: 1, scopeId: 1, status: 1 },
  {
    name: 'uniq_published_scope_config',
    unique: true,
    partialFilterExpression: { status: 'PUBLISHED' },
  },
);

const HomeConfig =
  models.HomeConfig ||
  model<HomeConfigDocument>('HomeConfig', homeConfigSchema);

export default HomeConfig;

