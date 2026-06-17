import Reception from '../models/Reception.model.js';
import { notifyManagers, notifyUser, RECEPTION_STATUS_COLORS } from '../utils/notification.util.js';

export async function getReception(_req, res, next) {
  try {
    const reception = await Reception.find().sort({ num: -1 }).lean();
    return res.json(reception);
  } catch (error) {
    return next(error);
  }
}

export async function createReception(req, res, next) {
  try {
    const userName = req.user?.name || '';
    const userId = req.user?.id || req.user?.email || '';
    const initials = userName ? userName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : 'A';
    const item = await Reception.create({
      responsable: userName,
      respInit: initials,
      respColor: '#15784f',
      ...req.body,
      createdBy: userId,
      createdByName: userName,
    });

    await notifyManagers({
      type: 'reception',
      title: 'Nueva propiedad recibida',
      message: item.propiedad || `Captación #${item.num}`,
      tab: 'recepcion',
      refId: item.num?.toString() || '',
      color: RECEPTION_STATUS_COLORS[item.status] || RECEPTION_STATUS_COLORS.celeste,
    }, userId);

    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updateReception(req, res, next) {
  try {
    const existing = await Reception.findOne({ num: Number(req.params.id) }).lean();
    if (!existing) return res.status(404).json({ message: 'Reception item not found' });

    const item = await Reception.findOneAndUpdate({ num: Number(req.params.id) }, req.body, { new: true });

    const requesterId = req.user?.id || req.user?.email || '';
    if (req.body.status !== undefined && req.body.status !== existing.status && existing.createdBy && existing.createdBy !== requesterId) {
      await notifyUser({
        userId: existing.createdBy,
        type: 'reception',
        title: 'Actualizaron tu propiedad',
        message: item.propiedad || `Captación #${item.num}`,
        tab: 'recepcion',
        refId: item.num?.toString() || '',
        color: RECEPTION_STATUS_COLORS[item.status] || RECEPTION_STATUS_COLORS.celeste,
      });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deleteReception(req, res, next) {
  try {
    const item = await Reception.findOneAndDelete({ num: Number(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Reception item not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}
