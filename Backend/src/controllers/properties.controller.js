import Property from '../models/Property.model.js';

export async function getProperties(_req, res, next) {
  try {
    const properties = await Property.find().sort({ createdAt: -1 }).lean();
    return res.json(properties);
  } catch (error) {
    return next(error);
  }
}

export async function createProperty(req, res, next) {
  try {
    const property = await Property.create(req.body);
    return res.status(201).json(property);
  } catch (error) {
    return next(error);
  }
}

export async function updateProperty(req, res, next) {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    return res.json(property);
  } catch (error) {
    return next(error);
  }
}

export async function deleteProperty(req, res, next) {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    return res.json(property);
  } catch (error) {
    return next(error);
  }
}
