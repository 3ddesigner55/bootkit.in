import mongoose, {
  Schema,
  type InferSchemaType,
} from 'mongoose';

const headerNavigationItemSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const headerNavigationSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'customer-header',
    },
    items: {
      type: [headerNavigationItemSchema],
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

export type HeaderNavigationItem =
  InferSchemaType<typeof headerNavigationItemSchema>;

export type HeaderNavigationDocument =
  InferSchemaType<typeof headerNavigationSchema>;

const HeaderNavigation =
  mongoose.models.HeaderNavigation ||
  mongoose.model(
    'HeaderNavigation',
    headerNavigationSchema,
  );

export default HeaderNavigation;