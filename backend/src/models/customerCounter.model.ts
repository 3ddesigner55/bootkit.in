import { Schema, model, models } from 'mongoose';

export type CustomerCounterDocument = {
  _id: string;
  seq: number;
};

const customerCounterSchema = new Schema<CustomerCounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 1000 }
});

const CustomerCounter = models.CustomerCounter || model<CustomerCounterDocument>('CustomerCounter', customerCounterSchema);

export default CustomerCounter;
