import Client from '../models/Client.model.js';
import { fetchLinkPreview, resolvePropertyUrl } from '../utils/linkPreview.util.js';

// Cada ítem de "ofreci" puede traer su propia propiedad anclada (link o ID).
// Si ya tiene una vista previa resuelta (guardada de antes), no se vuelve a pedir.
async function buildOfferItem(item) {
  if (!item || typeof item !== 'object') return item; // texto suelto viejo, sin propiedad anclada
  const ref = item.propertyRef || '';
  if (!ref) return { text: item.text || '', propertyRef: '', propertyPreview: null };
  if (item.propertyPreview) return item;
  const url = resolvePropertyUrl(ref);
  const propertyPreview = url ? await fetchLinkPreview(url).catch(() => null) : null;
  return { text: item.text || '', propertyRef: ref, propertyPreview };
}

async function buildOfreci(list) {
  if (!Array.isArray(list)) return undefined;
  return Promise.all(list.map(buildOfferItem));
}

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
    const ofreci = await buildOfreci(req.body.ofreci);
    const client = await Client.create({
      ...req.body,
      ...(ofreci !== undefined ? { ofreci } : {}),
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
    const update = { ...req.body };
    if (update.ofreci !== undefined) {
      update.ofreci = await buildOfreci(update.ofreci);
    }
    const client = await Client.findByIdAndUpdate(req.params.id, update, { new: true });
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
