import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// Mismos colores que CAL.EVENT_TYPES / RECEP.STATUS en el frontend (Frontend/src/lib/data.js, recepcionData.js)
export const TASK_EVENT_COLORS = {
  reserva: '#15784f',
  visita: '#2563eb',
  tarea: '#7257c9',
  vencimiento: '#d8504a',
  mantenimiento: '#0e8a8a',
};

export const RECEPTION_STATUS_COLORS = {
  negro: '#1f2a24',
  rojo: '#d8504a',
  celeste: '#2389c4',
  pausa: '#8a978f',
};

export async function notifyUser({ userId, type, title, message, tab, refId, color }) {
  if (!userId) return null;
  return Notification.create({
    userId,
    type: type || 'system',
    title,
    message: message || '',
    tab: tab || '',
    refId: refId || '',
    color: color || '',
  });
}

export async function notifyManagers(payload, excludeUserId) {
  const managers = await User.find({
    role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
    _id: { $ne: excludeUserId },
  }).select('_id').lean();
  return Promise.all(managers.map((m) => notifyUser({ ...payload, userId: m._id.toString() })));
}
