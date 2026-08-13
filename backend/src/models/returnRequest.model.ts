import { model, models, Schema, type Types } from 'mongoose';

export type ReturnRequestDocument = {
  order: Types.ObjectId;
  customer: Types.ObjectId;
  store: Types.ObjectId;
  items: Array<{
    product: Types.ObjectId;
    quantity: number;
    disposition: 'RESTOCK' | 'DAMAGED' | 'DO_NOT_RESTOCK';
  }>;
  reason: string;
  description?: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  resolution?: string;
  createdBy: Types.ObjectId;
  resolvedAt?: Date | null;
  resolvedBy?: Types.ObjectId;
};

const returnRequestSchema = new Schema<ReturnRequestDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        disposition: {
          type: String,
          enum: ['RESTOCK', 'DAMAGED', 'DO_NOT_RESTOCK'],
          default: 'RESTOCK',
        },
      },
    ],
    reason: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
      default: 'REQUESTED',
    },
    resolution: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

const ReturnRequest =
  models.ReturnRequest ||
  model<ReturnRequestDocument>('ReturnRequest', returnRequestSchema);

export default ReturnRequest;
