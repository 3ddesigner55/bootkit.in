import { model, models, Schema, type Types } from 'mongoose';

export type BrandDocument = {
  name: string;
  slug: string;
  description: string;
  logo: string;
  website: string;
  featured: boolean;
  active: boolean;
  displayOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const brandSchema = new Schema<BrandDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    logo: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ displayOrder: 1 });
brandSchema.index({ featured: 1 });

const Brand = models.Brand || model<BrandDocument>('Brand', brandSchema);

export default Brand;
