import { randomUUID } from 'crypto';
import Task from '../models/Task.model.js';
import TaskList from '../models/TaskList.model.js';
import User from '../models/User.model.js';
import { isTaskManager } from '../middelwares/isAdmin.mid.js';
import { extractFirstUrl, fetchLinkPreview } from '../utils/linkPreview.util.js';
import { notifyUser, TASK_EVENT_COLORS } from '../utils/notification.util.js';

const DEFAULT_COLUMNS = [
  { _id: 'todo', title: 'Lista de tareas', accent: '#b8791b', position: 0 },
  { _id: 'doing', title: 'En proceso', accent: '#2563eb', position: 1 },
  { _id: 'done', title: 'Hecho', accent: '#15784f', position: 2 },
];

function selfId(user) {
  return user?.id || user?.email || '';
}

async function buildTaskFields(body) {
  const fields = {
    listId: body.listId,
    title: body.title,
    description: body.description || '',
    type: body.type || 'tarea',
    due: body.due || '',
    tag: body.tag || '',
  };
  const url = extractFirstUrl(fields.description);
  fields.linkPreview = url ? await fetchLinkPreview(url).catch(() => null) : null;
  return fields;
}

async function ensureLists() {
  // Garantiza que las 3 columnas fijas existan siempre, sin tocar las extras del usuario
  for (const col of DEFAULT_COLUMNS) {
    const exists = await TaskList.findById(col._id).lean();
    if (!exists) await TaskList.create(col);
  }
  return TaskList.find().sort({ position: 1 }).lean();
}

export async function getTaskLists(req, res, next) {
  try {
    const manager = isTaskManager(req.user?.role);
    const ownerId = manager && req.query.userId ? req.query.userId : selfId(req.user);
    const lists = await ensureLists();
    const tasks = await Task.find({ createdBy: ownerId }).sort({ position: 1 }).lean();
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
    const manager = isTaskManager(req.user?.role);
    let ownerId = selfId(req.user);
    let ownerName = req.user?.name || '';

    if (manager && req.body.ownerId && req.body.ownerId !== ownerId) {
      const owner = await User.findById(req.body.ownerId).lean();
      if (owner) {
        ownerId = owner._id.toString();
        ownerName = owner.name;
      }
    }

    const fields = await buildTaskFields(req.body);
    const position = await Task.countDocuments({ listId: fields.listId });
    const task = await Task.create({
      ...fields,
      position,
      agentId: req.body.agentId || 'a1',
      createdBy: ownerId,
      createdByName: ownerName,
    });

    if (manager && ownerId !== selfId(req.user)) {
      await notifyUser({
        userId: ownerId,
        type: 'task',
        title: 'Te asignaron una tarea',
        message: task.title,
        tab: 'tareas',
        refId: task._id.toString(),
        color: TASK_EVENT_COLORS[task.type] || TASK_EVENT_COLORS.tarea,
      });
    }

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const manager = isTaskManager(req.user?.role);
    if (!manager && existing.createdBy !== selfId(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.body.title !== undefined || req.body.description !== undefined) {
      const fields = await buildTaskFields({
        listId: existing.listId,
        title: req.body.title !== undefined ? req.body.title : existing.title,
        description: req.body.description !== undefined ? req.body.description : existing.description,
        type: existing.type,
        due: existing.due,
        tag: existing.tag,
      });
      Object.assign(existing, fields);
    }
    if (req.body.listId !== undefined) existing.listId = req.body.listId;
    if (req.body.position !== undefined) existing.position = req.body.position;
    if (req.body.due !== undefined) existing.due = req.body.due;
    if (req.body.tag !== undefined) existing.tag = req.body.tag;
    if (req.body.type !== undefined) existing.type = req.body.type;

    await existing.save();

    if (manager && existing.createdBy !== selfId(req.user)) {
      await notifyUser({
        userId: existing.createdBy,
        type: 'task',
        title: 'Actualizaron tu tarea',
        message: existing.title,
        tab: 'tareas',
        refId: existing._id.toString(),
        color: TASK_EVENT_COLORS[existing.type] || TASK_EVENT_COLORS.tarea,
      });
    }

    return res.json(existing);
  } catch (error) {
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const manager = isTaskManager(req.user?.role);
    if (!manager && existing.createdBy !== selfId(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await existing.deleteOne();
    return res.json(existing);
  } catch (error) {
    return next(error);
  }
}
