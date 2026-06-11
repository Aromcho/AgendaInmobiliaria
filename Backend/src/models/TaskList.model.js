import { Schema, model } from 'mongoose';

const taskListSchema = new Schema(
  {
    _id: { type: String },
    title: { type: String, required: true },
    accent: { type: String, default: '#7257c9' },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model('TaskList', taskListSchema);
