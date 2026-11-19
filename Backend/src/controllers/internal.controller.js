import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import Event from '../models/Event.model.js';
import Task from '../models/Task.model.js';
import Reception from '../models/Reception.model.js';
import Client from '../models/Client.model.js';
import User from '../models/User.model.js';
import {
  baDay, baLocal, bump, emptySeries, parseLimit, parseRange, sortUpcoming, today, totalsOf,
} from '../utils/internal.util.js';

// Módulo /internal de la Agenda (panel central). Solo lectura.
// Contrato: GET /internal/health · /internal/metrics?desde=&hasta= · /internal/upcoming?limite=
const SERVICE = 'agenda';
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

// Contadores de la serie diaria
const COUNTERS = ['eventos', 'muestras', 'tasaciones', 'tareas', 'tareasVencen', 'recepciones', 'clientes'];
// Qué contadores propios alimentan cada contador común del panel. La Agenda no tiene
// publicaciones, consultas, ventas ni visitas web: sus números se cruzan por fecha con los del CRM.
const COMMON = { publicaciones: [], consultas: [], ventas: [], visitas: [] };

const STEP_LABELS = { tasacion: 'tasación', autorizacion: 'autorización', cartel: 'cartel', fotos: 'fotos', descripcion: 'descripción' };

// Pasos de una captación que siguen en «Falta». Sirve tanto si el paso se guardó como texto
// ('missing' | 'done' | 'na') como si quedó el objeto { text, state } de alguna versión vieja.
function missingSteps(reception) {
  return Object.keys(STEP_LABELS).filter((key) => {
    const step = reception.steps?.[key];
    return (typeof step === 'string' ? step : step?.state) === 'missing';
  });
}

// «Todo OK» (negro) y «En pausa» no cuentan como pendientes de publicar
const isPendingReception = (r) => r.status !== 'negro' && r.status !== 'pausa' && missingSteps(r).length > 0;

export function health(_req, res) {
  const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.json({ ok: db === 'up', service: SERVICE, version, uptime: Math.round(process.uptime()), db, now: new Date().toISOString() });
}

export async function metrics(req, res, next) {
  try {
    const range = parseRange(req.query);
    const created = { createdAt: { $gte: range.from, $lt: range.to } };
    // start y due se guardan como texto con la hora local de Buenos Aires («2026-11-20T10:00»,
    // «2026-11-20»): el rango se compara como texto, igual que en eventReminder.util.js
    const [events, tasksCreated, tasksDue, receptions, clients] = await Promise.all([
      Event.find({ start: { $gte: range.desde, $lt: range.hastaNext } }, { type: 1, start: 1, done: 1, status: 1 }).lean(),
      Task.find(created, { createdAt: 1 }).lean(),
      Task.find({ due: { $gte: range.desde, $lt: range.hastaNext } }, { due: 1 }).lean(),
      Reception.find(created, { createdAt: 1, status: 1 }).lean(),
      Client.find(created, { createdAt: 1 }).lean(),
    ]);

    const series = emptySeries(range, COUNTERS);
    const eventosPorTipo = {};
    let eventosHechos = 0;
    let eventosCancelados = 0;
    for (const ev of events) {
      if (ev.status === 'cancelada') { eventosCancelados += 1; continue; }
      const day = String(ev.start).slice(0, 10);
      bump(series, day, 'eventos');
      if (ev.type === 'visita') bump(series, day, 'muestras');
      if (ev.type === 'tasacion') bump(series, day, 'tasaciones');
      eventosPorTipo[ev.type] = (eventosPorTipo[ev.type] || 0) + 1;
      if (ev.done) eventosHechos += 1;
    }
    tasksCreated.forEach((t) => bump(series, baDay(t.createdAt), 'tareas'));
    tasksDue.forEach((t) => bump(series, String(t.due).slice(0, 10), 'tareasVencen'));
    receptions.forEach((r) => bump(series, baDay(r.createdAt), 'recepciones'));
    clients.forEach((c) => bump(series, baDay(c.createdAt), 'clientes'));

    res.json({
      service: SERVICE,
      desde: range.desde,
      hasta: range.hasta,
      totals: {
        ...totalsOf(series, COUNTERS),
        eventosPorTipo,
        eventosHechos,
        eventosCancelados,
        recepcionesListas: receptions.filter((r) => r.status === 'negro').length,
      },
      common: COMMON,
      series: [...series.values()],
      // Los eventos de la Agenda usan sus propias propiedades (nombre, tipo, zona), no el id del
      // CRM: no hay cruce por propiedad, solo por fecha.
      byProperty: [],
    });
  } catch (error) {
    next(error);
  }
}

export async function upcoming(req, res, next) {
  try {
    const limite = parseLimit(req.query);
    const now = baLocal(Date.now());
    const hoy = today();
    const [events, tasks, receptions, users] = await Promise.all([
      // Solo eventos propios: las entradas y salidas de temporada las informa el CRM
      Event.find({
        done: { $ne: true },
        status: { $ne: 'cancelada' },
        $or: [{ start: { $gte: now } }, { allDay: true, start: { $gte: hoy } }],
      }).sort({ start: 1 }).limit(limite).lean(),
      Task.find({ due: { $gte: hoy }, listId: { $ne: 'done' } }).sort({ due: 1 }).limit(limite).lean(),
      Reception.find({ status: { $nin: ['negro', 'pausa'] } }).sort({ createdAt: 1 }).lean(),
      User.find({}, { name: 1 }).lean(),
    ]);
    const userName = new Map(users.map((u) => [String(u._id), u.name]));

    const items = [
      ...events.map((ev) => ({
        kind: ev.type,
        title: ev.title,
        date: ev.allDay ? String(ev.start).slice(0, 10) : String(ev.start).slice(0, 16),
        pending: false,
        who: userName.get(String(ev.agentId)) || ev.createdByName || '',
        status: ev.status || '',
        propertyId: null,
        ref: String(ev._id),
      })),
      ...tasks.map((t) => ({
        kind: 'tarea',
        title: t.title,
        date: String(t.due).slice(0, 10),
        pending: false,
        who: t.createdByName || '',
        status: t.tag || '',
        propertyId: null,
        ref: String(t._id),
      })),
      // Captaciones con pasos en «Falta»: propiedades que todavía no se pueden publicar
      ...receptions.filter(isPendingReception).slice(0, limite).map((r) => ({
        kind: 'por_publicar',
        title: r.propiedad,
        date: baDay(r.createdAt),
        pending: true,
        who: r.responsable || r.createdByName || '',
        status: `Falta: ${missingSteps(r).map((key) => STEP_LABELS[key]).join(', ')}`,
        propertyId: null,
        ref: `#${r.num}`,
      })),
    ];

    const dated = sortUpcoming(items.filter((i) => !i.pending)).slice(0, limite);
    res.json({
      service: SERVICE,
      generatedAt: new Date().toISOString(),
      items: [...dated, ...items.filter((i) => i.pending)],
    });
  } catch (error) {
    next(error);
  }
}
