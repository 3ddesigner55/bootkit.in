import { model, models, Schema, type Types } from 'mongoose';

export type CustomRoleDocument = {
  name: string;
  description: string;
  permissions: string[];
  active: boolean;
  isSystem: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
};

const customRoleSchema = new Schema<CustomRoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, default: '', trim: true },
    permissions: [{ type: String, required: true }],
    active: { type: Boolean, default: true, index: true },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const CustomRole =
  models.CustomRole || model<CustomRoleDocument>('CustomRole', customRoleSchema);

export default CustomRole;
