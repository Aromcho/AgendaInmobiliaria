import jwt from 'jsonwebtoken';
import { createHash, verifyHash } from '../utils/hash.util.js';
import User from '../models/User.model.js';

function isHttps(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function tokenPayload(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email, active: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await verifyHash(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(tokenPayload(user), process.env.SECRET_JWT, { expiresIn: '24h' });
    const secure = isHttps(req);
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: secure ? 'none' : 'lax',
      secure,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ online: true, token, user: tokenPayload(user) });
  } catch (error) {
    return next(error);
  }
}

export async function online(req, res, next) {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return res.json({ online: false });
    }

    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.json({ online: false });
    }

    return res.json({ online: true, user: tokenPayload(user) });
  } catch (error) {
    return res.json({ online: false });
  }
}

export async function logout(req, res) {
  const secure = isHttps(req);
  res.clearCookie('jwt', { httpOnly: true, sameSite: secure ? 'none' : 'lax', secure });
  return res.json({ message: 'Logged out' });
}

export async function register(req, res, next) {
  try {
    const { email, password, name, role = 'USER', phoneNumber, photo } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashed = await createHash(password);
    const user = await User.create({ email, password: hashed, name, role, phoneNumber, photo });
    return res.status(201).json(tokenPayload(user));
  } catch (error) {
    return next(error);
  }
}
