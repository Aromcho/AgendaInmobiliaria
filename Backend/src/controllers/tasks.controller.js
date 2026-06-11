import { randomUUID } from 'crypto';
import Task from '../models/Task.model.js';
import TaskList from '../models/TaskList.model.js';

const DEFAULT_COLUMNS = [
  { _id: 'todo', title: 'Lista de tareas', accent: '#b8791b', position: 0 },
  { _id: 'doing', title: 'En proceso', accent: '#2563eb', position: 1 },
  { _id: 'done', title: 'Hecho', accent: '#15784f', position: 2 },
];

async function ensureLists() {
  const count = await TaskList.countDocuments();
  if (!count) {
    await TaskList.insertMany(DEFAULT_COLUMNS);
  }
  return TaskList.find().sort({ position: 1 }).lean();
}

export async function getTaskLists(_req, res, next) {
  try {
    const lists = await ensureLists();
    const tasks = await Task.find().sort({ position: 1 }).lean();
    return res.json(lists.map((list) => ({
      id: list._id,
      title: list.title,
      accent: list.accent,
      cards: tasks
        .filter((task) => task.listId === list._id)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    })));
  } catch (error) {
    return next(error);
  }
}

export async function createTaskList(req, res, next) {
  try {
    const count = await TaskList.countDocuments();
    const list = await TaskList.create({
      _id: randomUUID(),
      title: req.body.title,
      accent: req.body.accent || '#7257c9',
      position: count,
    });
    return res.status(201).json({ id: list._id, title: list.title, accent: list.accent, cards: [] });
  } catch (error) {
    return next(error);
  }
}

export async function deleteTaskList(req, res, next) {
  try {
    const list = await TaskList.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    await Task.deleteMany({ listId: req.params.id });
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const position = await Task.countDocuments({ listId: req.body.listId });
    const task = await Task.create({
      ...req.body,
      position,
      createdBy: req.user?.id || req.user?.email || '',
      createdByName: req.user?.name || '',
      agentId: req.body.agentId || req.user?.id || 'a1',
    });
    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (error) {
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (error) {
    return next(error);
  }
}
