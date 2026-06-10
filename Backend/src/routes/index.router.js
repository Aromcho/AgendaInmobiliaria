import express from 'express';
import sessionRouter from './api/session.router.js';
import userRouter from './api/user.router.js';
import eventRouter from './api/events.router.js';
import taskRouter from './api/tasks.router.js';
import receptionRouter from './api/reception.router.js';
import propertyRouter from './api/properties.router.js';

const router = express.Router();

router.use('/sessions', sessionRouter);
router.use('/users', userRouter);
router.use('/events', eventRouter);
router.use('/task-lists', taskRouter);
router.use('/tasks', taskRouter);
router.use('/reception', receptionRouter);
router.use('/properties', propertyRouter);

export default router;
