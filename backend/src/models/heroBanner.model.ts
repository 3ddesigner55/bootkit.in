import { model, models, Schema, type Types } from 'mongoose';

export type HeroBannerDocument = {
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  showOnHome: boolean;
  collectionHub?:
    'beauty' | 'electronics' | 'pharmacy' | 'decor' | 'kids' | 'gifting' | null;
  placement?: 'hero' | 'featuredThisWeek';
  startDate?: Date | null;
  endDate?: Date | null;
  active: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
};

const heroBannerSchema = new Schema<HeroBannerDocument>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    desktopImage: { type: String, required: true, trim: true },
    mobileImage: { type: String, default: '', trim: true },
    buttonText: { type: String, default: '', trim: true },
    buttonLink: { type: String, default: '', trim: true },
    displayOrder: { type: Number, required: true },
    showOnHome: { type: Boolean, default: false },
    placement: {
      type: String,
      enum: ['hero', 'featuredThisWeek'],
      default: 'hero',
    },
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
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

heroBannerSchema.index({ displayOrder: 1 });
heroBannerSchema.index({ showOnHome: 1 });
heroBannerSchema.index({ active: 1 });
heroBannerSchema.index({ startDate: 1 });
heroBannerSchema.index({ endDate: 1 });

const HeroBanner =
  models.HeroBanner ||
  model<HeroBannerDocument>('HeroBanner', heroBannerSchema);

export default HeroBanner;
