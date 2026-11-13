import Event from '../models/Event.model.js';
import { getCrmBookingEvents, isCrmEventId } from '../utils/crmBookings.util.js';

const CRM_READONLY = { message: 'Es una reserva del CRM: se cambia desde Alquileres temporarios del CRM.' };

// Los eventos propios de la Agenda + la capa de reservas del CRM (A4). ?crm=0 la saca.
export async function getEvents(req, res, next) {
  try {
    const events = await Event.find().sort({ start: 1 }).lean();
    if (req.query.crm === '0') return res.json(events);
    let crm = [];
    try {
      crm = await getCrmBookingEvents();
    } catch (err) {
      console.error('[agenda] No se pudieron leer las reservas del CRM', err.message);
    }
    return res.json([...events, ...crm].sort((a, b) => String(a.start).localeCompare(String(b.start))));
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
    if (isCrmEventId(req.params.id)) return res.status(409).json(CRM_READONLY);
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    if (isCrmEventId(req.params.id)) return res.status(409).json(CRM_READONLY);
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
}
