import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, default: 'system', index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    tab: { type: String, default: '' },
    refId: { type: String, default: '' },
    color: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default model('Notification', notificationSchema);
