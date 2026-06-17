import { Schema, model } from 'mongoose';

const linkPreviewSchema = new Schema(
  {
    url: { type: String, default: '' },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    listId: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    linkPreview: { type: linkPreviewSchema, default: null },
    type: { type: String, default: 'tarea', index: true },
    agentId: { type: String, default: 'a1', index: true },
    due: { type: String, default: '' },
    tag: { type: String, default: '' },
    position: { type: Number, default: 0 },
    createdBy: { type: String, default: '', index: true },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model('Task', taskSchema);
