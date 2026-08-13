import { model, models, Schema, type Types } from 'mongoose';

export type HomeSectionItem = {
  category: Types.ObjectId;
  productMode: 'auto' | 'manual';
  manualProductIds?: Types.ObjectId[];
  active: boolean;
  sortOrder: number;
};

export type HomeSectionDocument = {
  key: string;
  title: string;
  active: boolean;
  displayType: string;
  items: HomeSectionItem[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
};

const homeSectionItemSchema = new Schema<HomeSectionItem>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    productMode: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
      required: true,
    },
    manualProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const homeSectionSchema = new Schema<HomeSectionDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    active: { type: Boolean, default: true },
    displayType: { type: String, default: 'categoryCards' },
    items: [homeSectionItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const HomeSection =
  models.HomeSection ||
  model<HomeSectionDocument>('HomeSection', homeSectionSchema);

export default HomeSection;
