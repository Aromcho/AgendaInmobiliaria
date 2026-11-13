import mongoose from 'mongoose';
import User from '../models/User.model.js';

// Capa de reservas del CRM en el calendario de la Agenda (A4 / X4). Las reservas de temporada viven
// en el CRM (Property.temporaryRental.bookings); antes había que cargarlas otra vez a mano acá.
// Se leen directo de la base del CRM (mismo servidor de Mongo) y se devuelven como eventos de solo
// lectura: una entrada (14 h) y una salida (10 h) por reserva, tipo «reserva», con huésped y casa.
const CRM_DB = process.env.CRM_DB_NAME || 'crm_inmobiliaria';
const CACHE_MS = 60 * 1000;
const PAST_DAYS = 30;
let cache = { at: 0, events: [] };

const day = (d) => new Date(d).toISOString().slice(0, 10);

export function isCrmEventId(id) {
  return typeof id === 'string' && id.startsWith('crm-');
}

export async function getCrmBookingEvents() {
  if (Date.now() - cache.at < CACHE_MS) return cache.events;
  const db = mongoose.connection.useDb(CRM_DB, { useCache: true });
  const props = await db.collection('properties').find(
    { 'temporaryRental.bookings.0': { $exists: true } },
    { projection: { id: 1, address: 1, publication_title: 1, 'temporaryRental.bookings': 1, 'temporaryRental.localidad': 1 } },
  ).toArray();

  // Responsable de cada reserva = el usuario de la Agenda con el mismo email (o nombre) que quien la
  // cargó en el CRM. Sin dato, queda a cargo del primer administrador. El calendario filtra por
  // responsable, así que todo evento necesita uno.
  const [crmUsers, agendaUsers] = await Promise.all([
    db.collection('users').find({}, { projection: { email: 1, name: 1 } }).toArray(),
    User.find({ active: true }).select('name email role').sort({ createdAt: 1 }).lean(),
  ]);
  const norm = (s) => String(s || '').trim().toLowerCase();
  const byEmail = new Map(agendaUsers.map((u) => [norm(u.email), String(u._id)]));
  const byName = new Map(agendaUsers.map((u) => [norm(u.name), String(u._id)]));
  const crmById = new Map(crmUsers.map((u) => [String(u._id), u]));
  const fallback = String((agendaUsers.find((u) => /SUPER_ADMIN/.test(u.role)) || agendaUsers.find((u) => /ADMIN/.test(u.role)) || agendaUsers[0] || {})._id || '') || null;
  const agentFor = (b) => {
    const cu = b.createdById ? crmById.get(String(b.createdById)) : null;
    return (cu && (byEmail.get(norm(cu.email)) || byName.get(norm(cu.name)))) || byName.get(norm(b.createdByName)) || fallback;
  };

  const since = day(Date.now() - PAST_DAYS * 86400000);
  const today = day(Date.now() - 3 * 3600000); // hoy en Buenos Aires
  const events = [];
  for (const p of props) {
    const house = p.address || p.publication_title || `#${p.id}`;
    for (const b of p.temporaryRental?.bookings || []) {
      if (!b.startDate || !b.endDate) continue;
      const s = day(b.startDate);
      const e = day(b.endDate);
      if (e < since) continue;
      const blocked = b.status === 'bloqueado';
      const who = blocked ? 'Bloqueo' : (b.guestName || 'Reserva');
      const base = {
        type: 'reserva',
        propertyId: String(p.id),
        agentId: agentFor(b),
        allDay: false,
        status: 'pendiente',
        client: { name: blocked ? '' : (b.guestName || ''), phone: blocked ? '' : (b.guestPhone || ''), people: b.guests || null },
        notes: [b.notes, p.temporaryRental?.localidad].filter(Boolean).join(' · '),
        createdByName: b.createdByName || 'CRM',
        source: 'crm',
        readOnly: true,
      };
      events.push({
        ...base, _id: `crm-${b._id}-in`, title: `Entrada: ${who} · ${house}`,
        start: `${s}T14:00`, end: `${s}T15:00`, done: s < today,
      });
      events.push({
        ...base, _id: `crm-${b._id}-out`, title: `Salida: ${who} · ${house}`,
        start: `${e}T10:00`, end: `${e}T11:00`, done: e < today,
      });
    }
  }
  cache = { at: Date.now(), events };
  return events;
}
