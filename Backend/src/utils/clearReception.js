import dotenv from 'dotenv';
import connectDB from './db.js';
import Reception from '../models/Reception.model.js';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
  await connectDB();
  const result = await Reception.deleteMany({});
  console.log(`Deleted ${result.deletedCount} reception records`);
  await mongoose.disconnect();
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
