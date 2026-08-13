import { model, models, Schema, type Types } from 'mongoose';

export type TicketType =
  | 'MISSING_ITEM'
  | 'WRONG_ITEM'
  | 'DAMAGED_ITEM'
  | 'QUALITY_ISSUE'
  | 'LEAKED_PACKAGE'
  | 'DELIVERY_ISSUE'
  | 'OTHER';

export type TicketStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TicketDocument = {
  ticketNumber: string;
  order: Types.ObjectId;
  customer: Types.ObjectId;
  store: Types.ObjectId;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  affectedItems: Array<{
    product: Types.ObjectId;
    quantity: number;
  }>;
  photos: string[];
  assignedStaff?: Types.ObjectId | null;
  resolution?: string;
  resolvedAt?: Date | null;
  resolvedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

const ticketSchema = new Schema<TicketDocument>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    type: {
      type: String,
      enum: [
        'MISSING_ITEM',
        'WRONG_ITEM',
        'DAMAGED_ITEM',
        'QUALITY_ISSUE',
        'LEAKED_PACKAGE',
        'DELIVERY_ISSUE',
        'OTHER',
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    description: { type: String, required: true, trim: true },
    affectedItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    photos: { type: [String], default: [] },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolution: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

const Ticket = models.Ticket || model<TicketDocument>('Ticket', ticketSchema);

export default Ticket;
