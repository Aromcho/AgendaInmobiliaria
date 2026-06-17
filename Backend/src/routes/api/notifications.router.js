import express from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../controllers/notifications.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getNotifications);
router.put('/read-all', isAuth, markAllNotificationsRead);
router.put('/:id/read', isAuth, markNotificationRead);

export default router;
