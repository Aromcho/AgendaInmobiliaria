'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { CAL } from '@/lib/data';
import { RECEP } from '@/lib/recepcionData';
import Icons from '../Icons/Icons';
import './UI.css';
/* Componentes compartidos -> window.UI
   Avatar, TypeDot, StatusBadge, MiniCalendar, FiltersPopover,
   CalendarToolbar, AgendaToolbar, TareasToolbar, TabBar */

  const e = React.createElement;
  const { useState, useRef, useEffect } = React;
  const C = CAL;
  const I = Icons;

  const TYPE_ICON = {
    reserva: I.Bed, visita: I.Eye, tarea: I.Tag, tasacion: I.Coins, vencimiento: I.Alert, mantenimiento: I.Wrench,
  };

  // ---------- Confetti (celebración, por portal directo al <body>) ----------
  const CONFETTI_COLORS = ['#15784f', '#2563eb', '#b8791b', '#7257c9', '#0e8a8a'];
  const CONFETTI_EMOJIS = ['🎉', '✨', '🥳', '⭐'];
  function makeConfetti(n = 34) {
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n + (Math.random() * 0.6 - 0.3);
      const dist = 220 + Math.random() * 340; // explota muy por fuera del elemento de origen
      const isEmoji = i % 3 === 0;
      const size = isEmoji ? 18 + Math.round(Math.random() * 10) : 6 + Math.round(Math.random() * 5);
      return {
        id: i,
        emoji: isEmoji ? CONFETTI_EMOJIS[(i / 3) % CONFETTI_EMOJIS.length] : null,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: `${size}px`,
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist - 18}px`,
        rot: `${Math.round(Math.random() * 720 - 360)}deg`,
        delay: `${(Math.random() * 0.12).toFixed(2)}s`,
      };
    });
  }
  // x,y: coordenadas de pantalla (viewport) donde debe explotar
  function Confetti({ x, y, onDone }) {
    const piecesRef = useRef(null);
    if (!piecesRef.current) piecesRef.current = makeConfetti();
    useEffect(() => {
      const t = setTimeout(onDone, 1350);
      return () => clearTimeout(t);
    }, [onDone]);
    if (typeof document === "undefined") return null;
    return createPortal(
      e("div", { className: "confetti-burst", style: { position: "fixed", left: x, top: y } },
        piecesRef.current.map((p) => e("span", {
          key: p.id,
          className: "confetti-piece" + (p.emoji ? " emoji" : ""),
          style: {
            "--c-color": p.color, "--c-tx": p.tx, "--c-ty": p.ty, "--c-rot": p.rot,
            "--c-delay": p.delay, "--c-size": p.size,
          },
        }, p.emoji)),
      ),
      document.body,
    );
  }

  // ---------- Avatar con foto real (carpeta /public/avatar, nombrada por email) ----------
  const AVATAR_PALETTE = ['#15784f', '#2563eb', '#b8791b', '#7257c9', '#0e8a8a', '#d8504a', '#c2861a', '#0a5e5e', '#9d4edd', '#e85d75'];
  const AVATAR_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
  function initialsOf(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  function colorOf(str) {
    const s = String(str || '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  }
  // Prueba la foto en /avatar/<email>.<ext>, probando extensiones; si ninguna existe, cae a iniciales animadas
  function PhotoAvatar({ email, name, initials, color, size }) {
    const [extIdx, setExtIdx] = useState(0);
    const [failed, setFailed] = useState(!email);
    const ini = initials || initialsOf(name);
    const bg = color || colorOf(email || name);
    if (failed || !email) {
      return e("span", { className: "avatar avatar-pop", title: name || email,
        style: { width: size, height: size, background: bg, fontSize: size * 0.36 } }, ini);
    }
    return e("img", {
      className: "avatar avatar-photo avatar-pop", title: name || email, alt: ini,
      src: `/avatar/${email}.${AVATAR_EXTS[extIdx]}`,
      style: { width: size, height: size },
      onError: () => {
        if (extIdx < AVATAR_EXTS.length - 1) setExtIdx(extIdx + 1);
        else setFailed(true);
      },
    });
  }
  function Avatar({ agent, size = 28 }) {
    if (!agent) return null;
    return e(PhotoAvatar, { email: agent.email, name: agent.name, initials: agent.initials, color: agent.color, size });
  }
  // Avatar del usuario logueado (sesión), por email — para el header y vistas de usuarios
  function ProfileAvatar({ email, name, size = 32 }) {
    return e(PhotoAvatar, { email, name, size });
  }

  // ---------- Punto de tipo ----------
  function TypeDot({ type, size = 9 }) {
    const t = C.EVENT_TYPES[type];
    return e("span", { className: "type-dot", style: { width: size, height: size, background: t.color } });
  }

  // ---------- Badge de estado ----------
  function StatusBadge({ status }) {
    const s = C.STATUS[status];
    if (!s) return null;
    return e("span", { className: "status-badge", style: { color: s.color, background: s.bg } }, s.label);
  }

  // ---------- Tarjetas de datos para modales de detalle ----------
  // Mini-tarjeta (grilla superior, ej. 2-3 por fila): ícono + texto, con emoji que aparece al hover
  function InfoChip({ icon, emoji, label, value, tint }) {
    if (!value) return null;
    return e("div", { className: "detail-chip" },
      e("span", { className: "dc-ico", style: tint ? { color: tint.color, background: tint.bg } : null }, icon),
      e("div", { className: "dc-text" },
        e("div", { className: "dc-label" }, label),
        e("div", { className: "dc-val" }, value),
      ),
      emoji ? e("span", { className: "dc-emoji" }, emoji) : null,
    );
  }

  // Tarjeta ancha (ocupa todo el ancho de la grilla): mismo lenguaje visual, para datos más largos
  function InfoCard({ icon, emoji, label, title, sub }) {
    if (!title && !sub) return null;
    return e("div", { className: "detail-chip full" },
      e("span", { className: "dc-ico" }, icon),
      e("div", { className: "dc-text" },
        e("div", { className: "dc-label" }, label),
        title ? e("div", { className: "dc-val" }, title) : null,
        sub ? e("div", { className: "dc-sub" }, sub) : null,
      ),
      emoji ? e("span", { className: "dc-emoji" }, emoji) : null,
    );
  }

  // ---------- Mini calendario ----------
  function MiniCalendar({ cursor, onPick, onMonth }) {
    const first = C.startOfMonth(cursor);
    const gridStart = C.startOfWeek(first);
    const cells = [];
    for (let i = 0; i < 42; i++) cells.push(C.addDays(gridStart, i));
    return e("div", { className: "mini-cal" },
      e("div", { className: "mini-head" },
        e("button", { className: "mini-nav", onClick: () => onMonth(-1) }, e(I.ChevronLeft, { width: 15, height: 15 })),
        e("span", { className: "mini-title" }, C.fmtMonthYear(cursor)),
        e("button", { className: "mini-nav", onClick: () => onMonth(1) }, e(I.Chevron, { width: 15, height: 15 })),
      ),
      e("div", { className: "mini-grid" },
        C.DAYS_SHORT.map((d) => e("span", { key: d, className: "mini-dow" }, d[0])),
        cells.map((dt, i) => {
          const inMonth = C.isSameMonth(dt, first);
          const isToday = C.isSameDay(dt, C.TODAY);
          const isSel = C.isSameDay(dt, cursor);
          return e("button", {
            key: i,
            className: "mini-day" + (inMonth ? "" : " out") + (isToday ? " today" : "") + (isSel ? " sel" : ""),
            onClick: () => onPick(dt),
          }, dt.getDate());
        }),
      ),
    );
  }

  // ---------- Popover de filtros ----------
  function FiltersPopover({ cursor, setCursor, typeFilter, toggleType, agentFilter, toggleAgent, counts, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
      const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [onClose]);
    return e("div", { className: "filters-pop", ref },
      e(MiniCalendar, { cursor, onPick: setCursor, onMonth: (n) => setCursor(C.addMonths(cursor, n)) }),
      e("div", { className: "fp-section" },
        e("div", { className: "fp-label" }, "Tipos de evento"),
        Object.values(C.EVENT_TYPES).map((t) => {
          const Ico = TYPE_ICON[t.key]; const on = typeFilter[t.key];
          return e("button", { key: t.key, className: "filter-row" + (on ? "" : " off"), onClick: () => toggleType(t.key) },
            e("span", { className: "fr-check", style: { background: on ? t.color : "transparent", borderColor: t.color } },
              on ? e(I.Check, { width: 11, height: 11, strokeWidth: 3 }) : null),
            e("span", { className: "fr-ico", style: { color: t.color } }, e(Ico, { width: 15, height: 15 })),
            e("span", { className: "fr-label" }, t.label),
            e("span", { className: "fr-count" }, counts.byType[t.key] || 0),
          );
        }),
      ),
      e("div", { className: "fp-section" },
        e("div", { className: "fp-label" }, "Equipo"),
        C.AGENTS.map((a) => {
          const on = agentFilter[a.id];
          return e("button", { key: a.id, className: "filter-row" + (on ? "" : " off"), onClick: () => toggleAgent(a.id) },
            e("span", { className: "fr-check", style: { background: on ? a.color : "transparent", borderColor: a.color } },
              on ? e(I.Check, { width: 11, height: 11, strokeWidth: 3 }) : null),
            e(Avatar, { agent: a, size: 22 }),
            e("span", { className: "fr-label" }, a.name),
          );
        }),
      ),
    );
  }

  // ---------- Search box ----------
  function Search({ query, setQuery }) {
    return e("div", { className: "search" },
      e(I.Search, { width: 16, height: 16 }),
      e("input", { value: query, onChange: (ev) => setQuery(ev.target.value), placeholder: "Buscar…" }),
      query ? e("button", { className: "search-clear", onClick: () => setQuery("") }, e(I.Close, { width: 14, height: 14 })) : null,
    );
  }

  const CAL_VIEWS = [
    { key: "month", label: "Mes", icon: I.Grid },
    { key: "week", label: "Semana", icon: I.Columns },
    { key: "day", label: "Día", icon: I.Layout },
  ];

  const RANGE_VIEWS = [
    { key: "quarter", label: "3 meses" },
    { key: "half", label: "6 meses" },
    { key: "year", label: "12 meses" },
  ];

  // ---------- Selector de rango (3/6/12 meses) ----------
  function RangeMenu({ view, setView }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const active = RANGE_VIEWS.find((v) => v.key === view);

    useEffect(() => {
      if (!open) return;
      const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [open]);

    return e("div", { className: "range-wrap", ref },
      e("button", { className: "range-btn" + (active ? " active" : ""), onClick: () => setOpen((o) => !o) },
        e(I.Calendar, { width: 15, height: 15 }),
        e("span", null, active ? active.label : "Más vistas"),
        e(I.ChevronDown, { width: 14, height: 14 }),
      ),
      open ? e("div", { className: "range-pop" },
        RANGE_VIEWS.map((v) => e("button", {
          key: v.key,
          className: "range-opt" + (view === v.key ? " on" : ""),
          onClick: () => { setView(v.key); setOpen(false); },
        }, v.label)),
      ) : null,
    );
  }

  // ---------- Toolbar Calendario ----------
  function CalendarToolbar(p) {
    const [openF, setOpenF] = useState(false);
    const anyOff = Object.values(p.typeFilter).some((v) => !v) || Object.values(p.agentFilter).some((v) => !v);
    return e("div", { className: "toolbar" },
      e("div", { className: "tb-left" },
        e("button", { className: "today-btn", onClick: p.onToday }, "Hoy"),
        e("div", { className: "nav-arrows" },
          e("button", { className: "nav-arrow", onClick: p.onPrev }, e(I.ChevronLeft, { width: 18, height: 18 })),
          e("button", { className: "nav-arrow", onClick: p.onNext }, e(I.Chevron, { width: 18, height: 18 })),
        ),
        e("h1", { className: "tb-title" }, p.title),
      ),
      e("div", { className: "tb-right" },
        e(Search, { query: p.query, setQuery: p.setQuery }),
        e("div", { className: "view-switch" },
          CAL_VIEWS.map((v) => e("button", { key: v.key, className: "vs-btn" + (p.view === v.key ? " active" : ""), onClick: () => p.setView(v.key) },
            e(v.icon, { width: 15, height: 15 }), e("span", null, v.label))),
        ),
        e(RangeMenu, { view: p.view, setView: p.setView }),
        e("div", { className: "filter-wrap" },
          e("button", { className: "icon-btn" + (anyOff ? " on" : ""), onClick: () => setOpenF((o) => !o), title: "Filtros" },
            e(I.Filter, { width: 17, height: 17 }), anyOff ? e("span", { className: "icon-dot" }) : null),
          openF ? e(FiltersPopover, Object.assign({}, p, { onClose: () => setOpenF(false) })) : null,
        ),
        e("button", { className: "new-btn", onClick: () => window.__openNew && window.__openNew(p.cursor) },
          e(I.Plus, { width: 17, height: 17 }), "Nuevo"),
      ),
    );
  }

  // ---------- Toolbar Agenda ----------
  function AgendaToolbar(p) {
    return e("div", { className: "toolbar" },
      e("div", { className: "tb-left" },
        e("button", { className: "today-btn", onClick: p.onToday }, "Hoy"),
        e("div", { className: "nav-arrows" },
          e("button", { className: "nav-arrow", onClick: p.onPrev }, e(I.ChevronLeft, { width: 18, height: 18 })),
          e("button", { className: "nav-arrow", onClick: p.onNext }, e(I.Chevron, { width: 18, height: 18 })),
        ),
        e("h1", { className: "tb-title" }, p.title),
      ),
      e("div", { className: "tb-right" },
        e(Search, { query: p.query, setQuery: p.setQuery }),
        e("button", { className: "new-btn", onClick: () => window.__openNew && window.__openNew(p.cursor) },
          e(I.Plus, { width: 17, height: 17 }), "Nuevo"),
      ),
    );
  }

  // ---------- Toolbar Tareas ----------
  function TareasToolbar(p) {
    const teamUsers = p.teamUsers || [];
    return e("div", { className: "toolbar" },
      e("div", { className: "tb-left" },
        e("h1", { className: "tb-title" }, "Tareas del equipo"),
        e("span", { className: "tb-sub" }, "Organizá el trabajo por estado"),
      ),
      e("div", { className: "tb-right" },
        p.canManageTasks ? e("div", { className: "owner-switch" },
          e("button", { className: "owner-chip" + (!p.taskOwner ? " on" : ""), onClick: () => p.setTaskOwner(null) }, "Mis tareas"),
          teamUsers.map((u) => e("button", {
            key: u._id, className: "owner-chip" + (p.taskOwner === u._id ? " on" : ""),
            onClick: () => p.setTaskOwner(u._id),
          }, u.name)),
        ) : null,
        e(Search, { query: p.query, setQuery: p.setQuery }),
      ),
    );
  }

  // ---------- Toolbar Recepción ----------
  function RecepcionToolbar(p) {
    const R = RECEP;
    const items = p.items || [];
    const counts = {};
    items.forEach((it) => { counts[it.status] = (counts[it.status] || 0) + 1; });
    return e("div", { className: "toolbar recep-toolbar" },
      e("div", { className: "tb-left" },
        e("h1", { className: "tb-title" }, "Recepción de propiedades"),
        e("span", { className: "tb-count-pill" }, items.length + " captaciones"),
      ),
      e("div", { className: "tb-right" },
        e(Search, { query: p.query, setQuery: p.setQuery }),
        e("button", { className: "new-btn", onClick: p.onNew },
          e(I.Plus, { width: 17, height: 17 }), "Nueva propiedad"),
        e("div", { className: "status-chips-bar" },
          Object.values(R.STATUS).map((s) => {
            const on = p.statusFilter[s.key];
            return e("button", { key: s.key, className: "st-chip" + (on ? "" : " off"), onClick: () => p.toggleStatus(s.key), title: s.desc },
              e("span", { className: "st-chip-dot", style: { background: s.dot } }),
              e("span", { className: "st-chip-label" }, s.label),
              e("span", { className: "st-chip-count", style: on ? { color: s.color } : null }, counts[s.key] || 0),
            );
          }),
        ),
        e("select", { className: "resp-select", value: p.respFilter, onChange: (ev) => p.setRespFilter(ev.target.value) },
          e("option", { value: "__all" }, "Todo el equipo"),
          R.TEAM.map((t) => e("option", { key: t.name, value: t.name }, t.name)),
        ),
      ),
    );
  }

  // ---------- Tab bar (blanco sólido, flotante) ----------
  const TABS = [
    { key: "calendario", label: "Calendario", icon: I.Calendar },
    { key: "tareas", label: "Tareas", icon: I.Grid },
    { key: "recepcion", label: "Recepción", icon: I.Inbox },
    { key: "agenda", label: "Agenda", icon: I.List },
  ];
  const ADMIN_TAB = { key: "usuarios", label: "Usuarios", icon: I.User };
  function TabBar({ tab, setTab, isSuperAdmin, isMobile, onNew }) {
    const tabs = isSuperAdmin ? [...TABS, ADMIN_TAB] : TABS;
    const renderTab = (t) => e("button", { key: t.key, className: "tab" + (tab === t.key ? " active" : ""), onClick: () => setTab(t.key) },
      e(t.icon, { width: 17, height: 17 }), e("span", null, t.label));
    if (!isMobile || !onNew) {
      return e("nav", { className: "tabbar" }, tabs.map(renderTab));
    }
    const mid = Math.ceil(tabs.length / 2);
    return e("nav", { className: "tabbar" },
      tabs.slice(0, mid).map(renderTab),
      e("button", { className: "tab-fab", onClick: onNew, title: "Nuevo" }, e(I.Plus, { width: 24, height: 24, strokeWidth: 2.5 })),
      tabs.slice(mid).map(renderTab),
    );
  }

  export { Avatar, ProfileAvatar, TypeDot, StatusBadge, InfoChip, InfoCard, Confetti, MiniCalendar, FiltersPopover, Search,
    CalendarToolbar, AgendaToolbar, TareasToolbar, RecepcionToolbar, TabBar, TYPE_ICON };

