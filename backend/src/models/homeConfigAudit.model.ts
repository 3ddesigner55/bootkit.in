import { model, models, Schema, type Document, type Types } from 'mongoose';

export type HomeConfigAuditAction =
  | 'DRAFT_CREATED'
  | 'DRAFT_UPDATED'
  | 'SECTIONS_REORDERED'
  | 'CONFIG_PUBLISHED'
  | 'CONFIG_ARCHIVED';

export type HomeConfigAuditDocument = Document & {
  configId: Types.ObjectId;
  version: number;
  action: HomeConfigAuditAction;
  actor: Types.ObjectId;
  actorRole: string;
  metadata?: Record<string, any>;
  createdAt: Date;
};

const homeConfigAuditSchema = new Schema<HomeConfigAuditDocument>(
  {
    configId: { type: Schema.Types.ObjectId, ref: 'HomeConfig', required: true, index: true },
    version: { type: Number, required: true },
    action: {
      type: String,
      enum: [
        'DRAFT_CREATED',
        'DRAFT_UPDATED',
        'SECTIONS_REORDERED',
        'CONFIG_PUBLISHED',
        'CONFIG_ARCHIVED',
      ],
      required: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

homeConfigAuditSchema.index({ configId: 1, createdAt: -1 });

const HomeConfigAudit =
  models.HomeConfigAudit ||
  model<HomeConfigAuditDocument>('HomeConfigAudit', homeConfigAuditSchema);

export default HomeConfigAudit;
