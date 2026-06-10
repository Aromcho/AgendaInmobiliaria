import express from 'express';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../controllers/events.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getEvents);
router.post('/', isAuth, createEvent);
router.put('/:id', isAuth, updateEvent);
router.delete('/:id', isAuth, deleteEvent);

export default router;
