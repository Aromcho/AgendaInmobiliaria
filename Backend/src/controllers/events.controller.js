import Event from '../models/Event.model.js';

export async function getEvents(_req, res, next) {
  try {
    const events = await Event.find().sort({ start: 1 }).lean();
    return res.json(events);
  } catch (error) {
    return next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user?.id || req.user?.email || '',
      createdByName: req.user?.name || '',
    });
    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
}
