import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Reception from '../models/Reception.model.js';
import { createHash } from './hash.util.js';
import { receptionSeed } from './receptionSeed.js';

dotenv.config();

const superUser = {
  email: 'barriosarom@gmail.com',
  name: 'Arom Aguilar',
  password: '26398322',
  role: 'SUPER_ADMIN',
};

export async function seedDatabase() {
  const count = await User.countDocuments({ email: superUser.email });
  if (!count) {
    const password = await createHash(superUser.password);
    await User.create({ ...superUser, password });
    console.log('Seeded super user');
  }

  if (!(await Reception.countDocuments())) {
    await Reception.insertMany(receptionSeed);
    console.log('Seeded reception');
  }
}

if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
