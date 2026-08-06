import { model, models, Schema, type Types } from 'mongoose';

export type ProductDocument = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: Types.ObjectId;
  brand?: Types.ObjectId;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  discountPercent: number;
  sku: string;
  barcode: string;
  stock: number;
  minStock: number;
  trackInventory: boolean;
  thumbnail: string;
  gallery: string[];
  featured: boolean;
  active: boolean;
  showOnHome: boolean;
  homeSection: string;
  displayOrder: number;
  weight: number;
  unit: string;
  metaTitle: string;
  metaDescription: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    shortDescription: { type: String, default: '', trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    mrp: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: '', trim: true },
    barcode: { type: String, default: '', trim: true },
    stock: { type: Number, required: true, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    trackInventory: { type: Boolean, default: true },
    thumbnail: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    homeSection: { type: String, default: '', trim: true },
    displayOrder: { type: Number, default: 0 },
    weight: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: '', trim: true },
    metaTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ showOnHome: 1 });
productSchema.index({ displayOrder: 1 });

const Product =
  models.Product || model<ProductDocument>('Product', productSchema);

export default Product;
