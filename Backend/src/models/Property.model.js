import { Schema, model } from 'mongoose';

const propertySchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    kind: { type: String, default: '', index: true },
    loc: { type: String, default: '' },
    status: { type: String, default: 'active', index: true },
  },
  { timestamps: true }
);

export default model('Property', propertySchema);
