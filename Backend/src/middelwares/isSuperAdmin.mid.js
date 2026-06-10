export default function isSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
}
