import bcrypt from 'bcryptjs';

export function createHash(password) {
  return bcrypt.hash(password, 10);
}

export function verifyHash(password, hash) {
  return bcrypt.compare(password, hash);
}
