import jwt from 'jsonwebtoken';

export default function isAuth(req, res, next) {
  const token = req.cookies?.jwt;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(token, process.env.SECRET_JWT);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
