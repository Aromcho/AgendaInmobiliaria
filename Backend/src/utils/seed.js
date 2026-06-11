import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './db.js';
import User from '../models/User.model.js';
import { createHash } from './hash.util.js';

dotenv.config();

const users = [
  {
    email: 'barriosarom@gmail.com',
    name: 'Arom Aguilar',
    password: '26398322',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'garciaafaa@gmail.com',
    name: 'Fabiana',
    password: 'Fabi1234',
    role: 'USER',
  },
  {
    email: 'martinoanacecilia@gmail.com',
    name: 'Cecilia',
    password: 'Ceci1234',
    role: 'USER',
  },
];

export async function seedDatabase() {
  for (const userData of users) {
    const count = await User.countDocuments({ email: userData.email });
    if (!count) {
      const password = await createHash(userData.password);
      await User.create({ ...userData, password });
      console.log(`Seeded user ${userData.email}`);
    }
  }
}

if (process.argv[1]?.includes('seed.js')) {
  connectDB()
    .then(() => seedDatabase())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
