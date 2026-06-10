import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String },
    photo: { type: String },
    role: { type: String, default: 'USER', index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('User', userSchema);
