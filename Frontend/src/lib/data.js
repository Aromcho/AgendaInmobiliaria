/* ============================================================
   Gestor de Calendario — Inmobiliaria Silvia Fernández
   Configuración (tipos, estados, equipo) + helpers de fecha.
   Propiedades y eventos se cargan desde el backend.
   ============================================================ */


  // ---------- Tipos de evento (categorías) ----------
  const EVENT_TYPES = {
    reserva: {
      key: "reserva",
      label: "Reserva temporario",
      short: "Reserva",
      color: "#15784f",
      bg: "#e7f4ee",
      soft: "#d4ebe0",
      ink: "#0d5237",
    },
    visita: {
      key: "visita",
      label: "Visita / muestra",
      short: "Visita",
      color: "#2563eb",
      bg: "#e8effd",
      soft: "#d4e2fb",
      ink: "#1742a3",
    },
    tarea: {
      key: "tarea",
      label: "Agenda agente",
      short: "Agenda",
      color: "#7257c9",
      bg: "#efeafc",
      soft: "#e0d6f7",
      ink: "#4b3393",
    },
    vencimiento: {
      key: "vencimiento",
      label: "Vencimiento contrato",
      short: "Vencimiento",
      color: "#d8504a",
      bg: "#fbe9e8",
      soft: "#f6d4d2",
      ink: "#9c2e2a",
    },
    mantenimiento: {
      key: "mantenimiento",
      label: "Limpieza / mantenim.",
      short: "Limpieza",
      color: "#0e8a8a",
      bg: "#e1f3f3",
      soft: "#c8e9e9",
      ink: "#0a5e5e",
    },
  };

  const STATUS = {
    confirmada: { key: "confirmada", label: "Confirmada", color: "#15784f", bg: "#e7f4ee" },
    senia: { key: "senia", label: "Con seña", color: "#b8791b", bg: "#fbf0db" },
    pendiente: { key: "pendiente", label: "Pendiente", color: "#5a6b62", bg: "#eef1ef" },
    cancelada: { key: "cancelada", label: "Cancelada", color: "#d8504a", bg: "#fbe9e8" },
  };

  // ---------- Agentes (equipo real) ----------
  const AGENTS = [
    { id: "a1", name: "Silvia Fernández", initials: "SF", color: "#15784f", role: "Titular" },
    { id: "a2", name: "Cecilia", initials: "C", color: "#7257c9", role: "Equipo" },
    { id: "a3", name: "Paul", initials: "P", color: "#0e8a8a", role: "Equipo" },
    { id: "a4", name: "Fabiana", initials: "F", color: "#c2861a", role: "Equipo" },
    { id: "a5", name: "Pablo", initials: "P", color: "#2563eb", role: "Equipo" },
    { id: "a6", name: "Conrado", initials: "C", color: "#15784f", role: "Equipo" },
    { id: "a7", name: "Curly", initials: "C", color: "#b8791b", role: "Equipo" },
  ];

  // ---------- Propiedades (se cargan desde la app) ----------
  const PROPERTIES = [];

  // ---------- Eventos (se cargan desde el backend) ----------
  const EVENTS = [];

  // ============================================================
  //  Helpers de fecha
  // ============================================================
  const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const DAYS = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const DAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  function parse(s) { return s instanceof Date ? s : new Date(s); }
  function startOfDay(dt) { const x = parse(dt); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); }
  function addDays(dt, n) { const x = startOfDay(dt); x.setDate(x.getDate() + n); return x; }
  function addMonths(dt, n) { const x = parse(dt); return new Date(x.getFullYear(), x.getMonth() + n, 1); }
  function startOfMonth(dt) { const x = parse(dt); return new Date(x.getFullYear(), x.getMonth(), 1); }
  // semana arranca lunes
  function startOfWeek(dt) {
    const x = startOfDay(dt);
    const wd = (x.getDay() + 6) % 7; // lunes=0
    return addDays(x, -wd);
  }
  function isSameDay(a, b) {
    const x = parse(a), y = parse(b);
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  }
  function isSameMonth(a, b) {
    const x = parse(a), y = parse(b);
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
  }
  function dayDiff(a, b) { // días enteros b - a
    return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
  }
  function ymd(dt) {
    const x = parse(dt);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  }
  function fmtTime(dt) {
    const x = parse(dt);
    const h = x.getHours(), m = x.getMinutes();
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  function fmtMonthYear(dt) { const x = parse(dt); return `${MONTHS[x.getMonth()]} ${x.getFullYear()}`; }
  function minutesOfDay(dt) { const x = parse(dt); return x.getHours()*60 + x.getMinutes(); }
  function nights(ev) { return Math.max(1, dayDiff(ev.start, ev.end)); }

  export const CAL = {
    EVENT_TYPES, STATUS, AGENTS, PROPERTIES, EVENTS, TODAY: startOfDay(new Date()),
    MONTHS, MONTHS_SHORT, DAYS, DAYS_SHORT,
    parse, startOfDay, addDays, addMonths, startOfMonth, startOfWeek,
    isSameDay, isSameMonth, dayDiff, ymd, fmtTime, fmtMonthYear, minutesOfDay, nights,
    propById: (id) => PROPERTIES.find(p => p.id === id) || null,
    agentById: (id) => AGENTS.find(a => a.id === id) || null,
  };

