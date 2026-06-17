export function isTaskManager(role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export default function isAdmin(req, res, next) {
  if (!isTaskManager(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
}
