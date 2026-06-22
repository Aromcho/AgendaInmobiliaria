import { Schema, model } from 'mongoose';

const eventSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    propertyId: { type: String, default: null, index: true },
    agentId: { type: String, default: null, index: true },
    start: { type: String, required: true, index: true },
    end: { type: String, required: true, index: true },
    allDay: { type: Boolean, default: false, index: true },
    status: { type: String, default: 'pendiente', index: true },
    done: { type: Boolean, default: false, index: true },
    client: {
      name: String,
      phone: String,
      people: Number,
    },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: '', index: true },
    createdByName: { type: String, default: '' },
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model('Event', eventSchema);
