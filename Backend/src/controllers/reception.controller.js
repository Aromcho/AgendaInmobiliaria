import Reception from '../models/Reception.model.js';

export async function getReception(_req, res, next) {
  try {
    const reception = await Reception.find().sort({ num: -1 }).lean();
    return res.json(reception);
  } catch (error) {
    return next(error);
  }
}

export async function createReception(req, res, next) {
  try {
    const item = await Reception.create(req.body);
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updateReception(req, res, next) {
  try {
    const item = await Reception.findOneAndUpdate({ num: Number(req.params.id) }, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Reception item not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deleteReception(req, res, next) {
  try {
    const item = await Reception.findOneAndDelete({ num: Number(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Reception item not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}
