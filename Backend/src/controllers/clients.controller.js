import Client from '../models/Client.model.js';

export async function getClients(_req, res, next) {
  try {
    const clients = await Client.find().sort({ createdAt: -1 }).lean();
    return res.json(clients);
  } catch (error) {
    return next(error);
  }
}

export async function createClient(req, res, next) {
  try {
    const userName = req.user?.name || '';
    const userId = req.user?.id || req.user?.email || '';
    const client = await Client.create({
      ...req.body,
      createdBy: userId,
      createdByName: userName,
    });
    return res.status(201).json(client);
  } catch (error) {
    return next(error);
  }
}

export async function updateClient(req, res, next) {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    return res.json(client);
  } catch (error) {
    return next(error);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    return res.json(client);
  } catch (error) {
    return next(error);
  }
}
