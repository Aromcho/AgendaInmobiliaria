import Event from '../models/Event.model.js';
import { notifyUser, TASK_EVENT_COLORS } from './notification.util.js';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

// Los eventos se guardan con la hora local de Buenos Aires sin zona («2026-11-20T10:00»). Antes se
// comparaban contra la hora UTC del servidor y el recordatorio salía corrido 3 horas (A4).
// Argentina no tiene horario de verano: UTC-3 fijo.
const BA_OFFSET_MS = 3 * 60 * 60 * 1000;
const baLocal = (d) => new Date(d.getTime() - BA_OFFSET_MS).toISOString().slice(0, 16);

function fmtWhen(start) {
  const [date, time] = String(start).split('T');
  const [, m, d] = date.split('-');
  return time ? `${d}/${m} ${time.slice(0, 5)} h` : `${d}/${m}`;
}

export async function sendUpcomingEventReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const events = await Event.find({
    reminderSentAt: null,
    start: { $gte: baLocal(now), $lte: baLocal(horizon) },
    $or: [{ createdBy: { $nin: ['', null] } }, { agentId: { $nin: ['', null] } }],
  });

  for (const ev of events) {
    // Al responsable del evento (y también a quien lo creó, si es otra persona)
    const recipients = [...new Set([ev.agentId, ev.createdBy].filter(Boolean).map(String))];
    for (const userId of recipients) {
      await notifyUser({
        userId,
        type: 'event',
        title: userId === String(ev.agentId) ? 'Tenés un evento a cargo' : 'Evento próximo',
        message: `${ev.title} — ${fmtWhen(ev.start)}`,
        tab: 'calendario',
        refId: ev._id.toString(),
        color: TASK_EVENT_COLORS[ev.type] || TASK_EVENT_COLORS.reserva,
      });
    }
    ev.reminderSentAt = now;
    await ev.save();
  }
}
