import User from '../models/User.model.js';
import { createHash } from '../utils/hash.util.js';

export async function getUsers(_req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

// Directorio de personas activas para pintar avatares/selects (calendario, recepción, clientes).
// Abierto a cualquier usuario logueado -> a diferencia de getUsers/getTeamUsers no requiere admin
// ni excluye al propio usuario, porque acá se necesita el equipo completo.
export async function getRoster(_req, res, next) {
  try {
    const users = await User.find({ active: true })
      .select('name email role photo')
      .sort({ name: 1 })
      .lean();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

export async function getTeamUsers(req, res, next) {
  try {
    const users = await User.find({ active: true, _id: { $ne: req.user?.id } })
      .select('name email role')
      .sort({ name: 1 })
      .lean();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await createHash(payload.password);
    }
    const user = await User.create(payload);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.uid).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await createHash(payload.password);
    }
    const user = await User.findByIdAndUpdate(req.params.uid, payload, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.uid);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}
