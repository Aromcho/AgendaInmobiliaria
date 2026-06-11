import express from 'express';
import { createTask, createTaskList, deleteTask, deleteTaskList, getTaskLists, updateTask } from '../../controllers/tasks.controller.js';
import isAuth from '../../middelwares/isAuth.mid.js';

const router = express.Router();

router.get('/', isAuth, getTaskLists);
router.get('/board', isAuth, getTaskLists);
router.post('/lists', isAuth, createTaskList);
router.delete('/lists/:id', isAuth, deleteTaskList);
router.post('/', isAuth, createTask);
router.put('/:id', isAuth, updateTask);
router.delete('/:id', isAuth, deleteTask);

export default router;
