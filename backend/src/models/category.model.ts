import { model, models, Schema, type Types } from 'mongoose';

export type CategoryHomeLayout = 'grid' | 'slider';

export type CategoryDocument = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  background: string;
  image: string;
  banner: string;
  featured: boolean;
  active: boolean;
  showOnHome: boolean;
  displayOrder: number;
  sortOrder: number;
  homeLayout: CategoryHomeLayout;
  collectionHub?: string | null;
  /**
   * @deprecated Merchandising has moved to HomeConfig. Retained strictly for legacy fallback.
   */
  homeSection?: string | null;
  parentCategory?: Types.ObjectId | null;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    background: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    banner: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    homeLayout: { type: String, enum: ['grid', 'slider'], default: 'grid' },
    collectionHub: {
      type: String,
      enum: [
        'beauty',
        'electronics',
        'pharmacy',
        'decor',
        'kids',
        'gifting',
        null,
      ],
      default: null,
    },
    homeSection: {
      type: String,
      enum: [
        'groceryKitchen',
        'householdEssentials',
        'snacksDrinks',
        'beautyPersonalCare',
        null,
      ],
      default: null,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ showOnHome: 1 });
categorySchema.index({ parentCategory: 1 });

const Category =
  models.Category || model<CategoryDocument>('Category', categorySchema);

export default Category;
