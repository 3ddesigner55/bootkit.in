import mongoose, {
  Schema,
  type InferSchemaType,
} from 'mongoose';

export const HEADER_HUB_SLUGS = [
  'beauty',
  'electronics',
  'pharmacy',
  'decor',
  'kids',
  'gifting',
] as const;

const headerHubConfigSchema = new Schema(
  {
    hub: {
      type: String,
      required: true,
      unique: true,
      enum: HEADER_HUB_SLUGS,
      lowercase: true,
      trim: true,
    },

    // इसमें Main और Subcategories दोनों ordered IDs रहेंगी।
    categoryIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
      default: [],
    },

    // Admin द्वारा manually selected products.
    productIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      default: [],
    },

    brandIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Brand',
        },
      ],
      default: [],
    },

    bannerIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'HeroBanner',
        },
      ],
      default: [],
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type HeaderHubSlug =
  (typeof HEADER_HUB_SLUGS)[number];

export type HeaderHubConfigDocument =
  InferSchemaType<typeof headerHubConfigSchema>;

const HeaderHubConfig =
  mongoose.models.HeaderHubConfig ||
  mongoose.model(
    'HeaderHubConfig',
    headerHubConfigSchema,
  );

export default HeaderHubConfig;