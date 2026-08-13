import { model, models, Schema, type Types } from 'mongoose';

export type CatalogAuditDocument = {
  actor: Types.ObjectId;
  role: string;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId | string | null;
  beforeValue?: any;
  afterValue?: any;
  reason?: string;
  timestamp: Date;
};

const catalogAuditSchema = new Schema<CatalogAuditDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.Mixed, default: null },
    beforeValue: { type: Schema.Types.Mixed },
    afterValue: { type: Schema.Types.Mixed },
    reason: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } },
);

const CatalogAudit =
  models.CatalogAudit ||
  model<CatalogAuditDocument>('CatalogAudit', catalogAuditSchema);

export default CatalogAudit;
