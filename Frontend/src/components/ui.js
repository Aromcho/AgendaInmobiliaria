'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import { RECEP } from '@/lib/recepcionData';
import Icons from './Icons';
/* Componentes compartidos -> window.UI
   Avatar, TypeDot, StatusBadge, MiniCalendar, FiltersPopover,
   CalendarToolbar, AgendaToolbar, TareasToolbar, TabBar */

  const e = React.createElement;
  const { useState, useRef, useEffect } = React;
  const C = CAL;
  const I = Icons;

  const TYPE_ICON = {
    reserva: I.Bed, visita: I.Eye, tarea: I.Tag, vencimiento: I.Alert, mantenimiento: I.Wrench,
  };

  // ---------- Avatar ----------
  function Avatar({ agent, size = 28 }) {
    if (!agent) return null;
    return e("span", { className: "avatar", title: agent.name,
      style: { width: size, height: size, background: agent.color, fontSize: size * 0.36 } }, agent.initials);
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
    return e("div", { className: "toolbar" },
      e("div", { className: "tb-left" },
        e("h1", { className: "tb-title" }, "Tareas del equipo"),
        e("span", { className: "tb-sub" }, "Organizá el trabajo por estado"),
      ),
      e("div", { className: "tb-right" },
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
  function TabBar({ tab, setTab, isSuperAdmin }) {
    const tabs = isSuperAdmin ? [...TABS, ADMIN_TAB] : TABS;
    return e("nav", { className: "tabbar" },
      tabs.map((t) => e("button", { key: t.key, className: "tab" + (tab === t.key ? " active" : ""), onClick: () => setTab(t.key) },
        e(t.icon, { width: 17, height: 17 }), e("span", null, t.label))),
    );
  }

  export { Avatar, TypeDot, StatusBadge, MiniCalendar, FiltersPopover, Search,
    CalendarToolbar, AgendaToolbar, TareasToolbar, RecepcionToolbar, TabBar, TYPE_ICON };

