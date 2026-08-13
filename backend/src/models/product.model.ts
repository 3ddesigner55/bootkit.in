import { model, models, Schema, type Types } from 'mongoose';

export type ProductVariantDocument = {
  name: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight?: string;
  image?: string;
  images?: string[];
  attributes?: Record<string, string>;
  unit: {
    label: string;
    value: string;
  };
  mrp: number;
  price: number;
  stock: number;
  active: boolean;
};

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
  variants?: ProductVariantDocument[];
  tags?: string[];
  fallbackIcon?: string;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
  showOnHome: boolean;
  homeSection: string;
  displayOrder: number;
  weight: number;
  unit: string;
  deliveryMinutes?: number;
  rating: number;
  metaTitle: string;
  metaDescription: string;
  attributes?: { label: string; value: string }[];
  highlights?: string[];
  videoUrl?: string;
  ingredients?: string;
  storageInstructions?: string;
  usageInstructions?: string;
  replacementPolicy?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const productVariantSchema = new Schema<ProductVariantDocument>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  barcode: { type: String, trim: true },
  color: { type: String, trim: true },
  size: { type: String, trim: true },
  weight: { type: String, trim: true },
  image: { type: String, trim: true },
  images: { type: [String], default: undefined },
  attributes: { type: Schema.Types.Mixed },
  unit: {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  mrp: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  active: { type: Boolean, required: true },
});

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
    variants: { type: [productVariantSchema], default: undefined },
    tags: { type: [String], default: undefined },
    fallbackIcon: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    homeSection: { type: String, default: '', trim: true },
    displayOrder: { type: Number, default: 0 },
    weight: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: '', trim: true },
    deliveryMinutes: { type: Number, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    metaTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    attributes: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: undefined,
    },
    highlights: { type: [String], default: undefined },
    videoUrl: { type: String, default: '', trim: true },
    ingredients: { type: String, default: '', trim: true },
    storageInstructions: { type: String, default: '', trim: true },
    usageInstructions: { type: String, default: '', trim: true },
    replacementPolicy: { type: String, default: '', trim: true },
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
productSchema.index({ bestseller: 1 });
productSchema.index({ showOnHome: 1 });
productSchema.index({ displayOrder: 1 });

const Product =
  models.Product || model<ProductDocument>('Product', productSchema);

export default Product;
