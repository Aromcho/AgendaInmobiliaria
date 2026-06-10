import Task from '../models/Task.model.js';

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'Lista de tareas', accent: '#b8791b' },
  { id: 'doing', title: 'En proceso', accent: '#2563eb' },
  { id: 'done', title: 'Hecho', accent: '#15784f' },
];

function groupTasks(tasks) {
  return DEFAULT_COLUMNS.map((column) => ({
    ...column,
    cards: tasks.filter((task) => task.listId === column.id).sort((a, b) => (a.position || 0) - (b.position || 0)),
  }));
}

export async function getTaskLists(_req, res, next) {
  try {
    const tasks = await Task.find().sort({ position: 1 }).lean();
    return res.json(groupTasks(tasks));
  } catch (error) {
    return next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const position = await Task.countDocuments({ listId: req.body.listId });
    const task = await Task.create({ ...req.body, position });
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
