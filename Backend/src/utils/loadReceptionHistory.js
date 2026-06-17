import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './db.js';
import Reception from '../models/Reception.model.js';
import { receptionSeed } from './receptionSeed.js';

dotenv.config();

/* Carga el historial de "Recepción de propiedades.docx" a la base de datos.
   Pensado para correrse una sola vez al pasar a producción (es idempotente:
   si un N° ya existe en la base, no lo vuelve a crear ni lo pisa). */

const TEAM = {
  cecilia: { color: '#7257c9', init: 'C' },
  paul: { color: '#0e8a8a', init: 'P' },
  fabiana: { color: '#c2861a', init: 'F' },
  pablo: { color: '#2563eb', init: 'P' },
  conrado: { color: '#15784f', init: 'C' },
  curly: { color: '#b8791b', init: 'C' },
};

const NA_RE = /(no corresponde|no aplica|no hace falta|no hay exclusividad|no se pone|no se hace|no llevan|no lleva|no quiere|no quieren|no se va a hacer)/;
const PARTIAL_RE = /(en proceso|pendiente|a la espera|esperando|evalú|falta sacar|aún no|todavía no|tiene que|hay que|no aun)/;

function stepState(raw) {
  const text = String(raw || '').trim();
  if (!text) return 'missing';
  const low = text.toLowerCase();
  if (NA_RE.test(low)) return 'na';
  if (PARTIAL_RE.test(low)) return 'partial';
  if (/^no\b/.test(low) || /\bfalta\b/.test(low)) return 'missing';
  // Cualquier otro texto no vacío (p.ej. "Silvia", "Faby", "a cargo de Silvia")
  // se interpreta como el paso ya realizado, aunque no diga "sí" explícitamente.
  return 'done';
}

function overallStatus(rec) {
  if (rec.pausa) return 'pausa';
  const states = ['tasacion', 'autorizacion', 'cartel', 'fotos', 'descripcion'].map((k) => stepState(rec[k]));
  if (states.some((s) => s === 'missing')) return 'rojo';
  const auth = stepState(rec.autorizacion);
  if (auth === 'partial' || auth === 'na') return 'celeste';
  return 'negro';
}

function teamLookup(responsable) {
  const key = String(responsable || '').trim().toLowerCase();
  return TEAM[key] || { color: '#8a978f', init: key ? key[0].toUpperCase() : '·' };
}

function buildRecord(raw) {
  const team = teamLookup(raw.responsable);
  return {
    num: raw.num,
    responsable: raw.responsable || '',
    respColor: team.color,
    respInit: team.init,
    owner: raw.owner || '',
    phone: raw.phone || '',
    fecha: raw.fecha || '',
    propiedad: raw.propiedad,
    valor: raw.valor || '',
    superficie: raw.superficie || '',
    idPublicacion: raw.idPublicacion || '',
    tasacion: raw.tasacion || '',
    autorizacion: raw.autorizacion || '',
    cartel: raw.cartel || '',
    fotos: raw.fotos || '',
    descripcion: raw.descripcion || '',
    notas: raw.notas || '',
    link: raw.link || '',
    status: overallStatus(raw),
    steps: {
      tasacion: stepState(raw.tasacion),
      autorizacion: stepState(raw.autorizacion),
      cartel: stepState(raw.cartel),
      fotos: stepState(raw.fotos),
      descripcion: stepState(raw.descripcion),
    },
    createdByName: 'Migración inicial',
  };
}

async function run() {
  await connectDB();
  let created = 0;
  let skipped = 0;
  for (const raw of receptionSeed) {
    const exists = await Reception.findOne({ num: raw.num }).lean();
    if (exists) { skipped++; continue; }
    await Reception.create(buildRecord(raw));
    created++;
  }
  console.log(`Historial de recepción: ${created} cargados, ${skipped} ya existían.`);
  await mongoose.disconnect();
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
