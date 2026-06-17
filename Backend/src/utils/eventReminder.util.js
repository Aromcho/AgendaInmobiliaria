import Event from '../models/Event.model.js';
import { notifyUser, TASK_EVENT_COLORS } from './notification.util.js';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function sendUpcomingEventReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
  const nowStr = now.toISOString().slice(0, 19);
  const horizonStr = horizon.toISOString().slice(0, 19);

  const events = await Event.find({
    reminderSentAt: null,
    createdBy: { $nin: ['', null] },
    start: { $gte: nowStr, $lte: horizonStr },
  });

  for (const ev of events) {
    await notifyUser({
      userId: ev.createdBy,
      type: 'event',
      title: 'Evento próximo',
      message: `${ev.title} — ${ev.start}`,
      tab: 'calendario',
      refId: ev._id.toString(),
      color: TASK_EVENT_COLORS[ev.type] || TASK_EVENT_COLORS.reserva,
    });
    ev.reminderSentAt = now;
    await ev.save();
  }
}
