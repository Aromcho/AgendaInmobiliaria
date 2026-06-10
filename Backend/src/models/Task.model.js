import { Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    listId: { type: String, required: true, index: true },
    text: { type: String, required: true, index: true },
    type: { type: String, default: 'tarea', index: true },
    agentId: { type: String, default: 'a1', index: true },
    due: { type: String, default: '' },
    tag: { type: String, default: '' },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model('Task', taskSchema);
