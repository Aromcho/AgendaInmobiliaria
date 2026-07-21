/* Datos de Recepción de Propiedades -> equipo, estados y pasos. Los items se cargan desde el backend. */
import { CAL } from './data';

export const RECEP = {
  STATUS: {
    negro:   { key:"negro",   label:"Todo OK",          desc:"Lista para vender",        color:"#1f2a24", bg:"#e8ebe9", dot:"#1f2a24" },
    rojo:    { key:"rojo",    label:"Algo falta",        desc:"Faltan pasos por cerrar",  color:"#d8504a", bg:"#fbe9e8", dot:"#d8504a" },
    celeste: { key:"celeste", label:"Venta sin confirmar", desc:"El dueño no confirmó",    color:"#2389c4", bg:"#e4f2fa", dot:"#2389c4" },
    pausa:   { key:"pausa",   label:"En pausa",          desc:"Suspendida / en espera",   color:"#8a978f", bg:"#eef1ef", dot:"#8a978f" },
  },
  STEPS: [
    { key:"tasacion",     label:"Tasación",     short:"Tasac." },
    { key:"autorizacion", label:"Autorización", short:"Autoriz." },
    { key:"cartel",       label:"Cartel",       short:"Cartel" },
    { key:"fotos",        label:"Fotos",        short:"Fotos" },
    { key:"descripcion",  label:"Descripción",  short:"Descrip." },
  ],
};

// TEAM se recalcula en cada lectura desde CAL.AGENTS (getter), en vez de copiarse una vez al
// importar el módulo -> si el roster de agentes se actualiza (llega gente nueva desde el
// backend), Recepción lo ve sin tocar este archivo. Sin filtrar por rol: cualquier usuario
// activo (Titular, Equipo, Super admin) puede ser responsable de una recepción.
Object.defineProperty(RECEP, 'TEAM', {
  enumerable: true,
  get() {
    return CAL.AGENTS.map((a) => ({ name: a.name, color: a.color, init: a.initials }));
  },
});
