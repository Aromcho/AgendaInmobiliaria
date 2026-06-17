import Notification from '../models/Notification.model.js';

function selfId(user) {
  return user?.id || user?.email || '';
}

export async function getNotifications(req, res, next) {
  try {
    const userId = selfId(req.user);
    const [items, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);
    return res.json({ items, unreadCount });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const userId = selfId(req.user);
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Notification not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = selfId(req.user);
    await Notification.updateMany({ userId, read: false }, { read: true });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}
