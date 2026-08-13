import { model, models, Schema, type Document, type Types } from 'mongoose';

export type StoreAuditAction = 'DEFAULT_STORE_CHANGED';

export type StoreAuditDocument = Document & {
  action: StoreAuditAction;
  actor: Types.ObjectId;
  actorRole: string;
  oldStoreId?: Types.ObjectId | null;
  newStoreId: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
};

const storeAuditSchema = new Schema<StoreAuditDocument>(
  {
    action: {
      type: String,
      enum: ['DEFAULT_STORE_CHANGED'],
      required: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    oldStoreId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    newStoreId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

storeAuditSchema.index({ newStoreId: 1, createdAt: -1 });

const StoreAudit = models.StoreAudit || model<StoreAuditDocument>('StoreAudit', storeAuditSchema);

export default StoreAudit;
