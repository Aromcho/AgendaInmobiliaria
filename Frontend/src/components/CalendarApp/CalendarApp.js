'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import { RECEP } from '@/lib/recepcionData';
import { useIsMobile } from '@/lib/useIsMobile';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import * as Views from '../Views/Views';
import * as Modals from '../Modals/Modals';
import * as TareasNS from '../Tareas/Tareas';
import * as RecepNS from '../Recepcion/Recepcion';
import { UsuariosView } from '../Users/Users';
import { NotificationBell } from '../Notifications/Notifications';
import './CalendarApp.css';
import { createResource, deleteResource, fetchCollection, logout as apiLogout, updateResource } from '@/services/api';
/* App principal — shell con pestañas (calendario / tareas / recepción / agenda) */

const e = React.createElement;
const { useState, useMemo, useEffect, useCallback } = React;
const C = CAL;
const I = Icons;
const { CalendarToolbar, AgendaToolbar, TareasToolbar, RecepcionToolbar, TabBar, ProfileAvatar } = UI;
const { MonthView, MultiMonthView, WeekView, DayView, AgendaView, DayEventList, MobileMonth } = Views;
const MONTHS_BY_VIEW = { quarter: 3, half: 6, year: 12 };
const { EventDetail, EventForm, OverdueModal } = Modals;
const { Board, TaskForm } = TareasNS;
const { RecepView, RecepDetail, RecepForm } = RecepNS;

const MOBILE_TITLES = { calendario: "Calendario", tareas: "Tareas del equipo", recepcion: "Recepción", agenda: "Agenda", usuarios: "Usuarios" };

function initFilter(keys) { const o = {}; keys.forEach((k) => (o[k] = true)); return o; }

// Mini barra de navegación de fecha (mobile): ‹ Hoy/título ›
function MobileDateNav({ title, onPrev, onNext, onToday }) {
  return e("div", { className: "mob-cal-nav" },
    e("button", { className: "mob-nav-btn", onClick: onPrev }, e(I.ChevronLeft, { width: 16, height: 16 })),
    onToday ? e("button", { className: "mob-cal-today", onClick: onToday }, "Hoy") : null,
    e("span", { className: "mob-cal-title" }, title),
    e("button", { className: "mob-nav-btn", onClick: onNext }, e(I.Chevron, { width: 16, height: 16 })),
  );
}

function App({ onLogout, session }) {
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';
  const canManageTasks = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN';
  const isMobile = useIsMobile();
  const [mobileDay, setMobileDay] = useState(C.TODAY);
  const [tab, setTab] = useState("tareas");           // calendario | tareas | recepcion | agenda
  const [view, setView] = useState("month");          // sub-vista del calendario
  const [cursor, setCursor] = useState(C.TODAY);
  const [events, setEvents] = useState(() => C.EVENTS.map((x) => ({ ...x })));
  const [taskLists, setTaskLists] = useState([]);
  const [cardAnim, setCardAnim] = useState({});       // { [cardId]: 'create' | 'progress' | 'done' }
  const [taskOwner, setTaskOwner] = useState(null);   // null = mis tareas; id = tareas de otro usuario (admin)
  const [teamUsers, setTeamUsers] = useState([]);
  const [taskForm, setTaskForm] = useState(null);     // { listId, card } al editar una tarjeta
  const [reception, setReception] = useState([]);
  const [typeFilter, setTypeFilter] = useState(() => initFilter(Object.keys(C.EVENT_TYPES)));
  const [agentFilter, setAgentFilter] = useState(() => initFilter(C.AGENTS.map((a) => a.id)));
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [overdueQueue, setOverdueQueue] = useState(null); // null = todavía no se calculó; [] = sin pendientes
  // recepción
  const [recepStatus, setRecepStatus] = useState(() => initFilter(Object.keys(RECEP.STATUS)));
  const [recepResp, setRecepResp] = useState("__all");
  const [recepDetail, setRecepDetail] = useState(null);
  const [recepForm, setRecepForm] = useState(null); // null cerrado; { initial } abierto (initial=null si es alta)
  const toggleStatus = (k) => setRecepStatus((o) => ({ ...o, [k]: !o[k] }));

  const toggleType = (k) => setTypeFilter((o) => ({ ...o, [k]: !o[k] }));
  const toggleAgent = (k) => setAgentFilter((o) => ({ ...o, [k]: !o[k] }));

  // ---- carga inicial de eventos desde el backend (datos semilla como respaldo) ----
  useEffect(() => {
    let active = true;
    fetchCollection('events').then((remote) => {
      if (!active || !remote?.length) return;
      setEvents(remote.map((x) => ({ ...x, id: x.id || x._id })));
    });
    return () => { active = false; };
  }, []);

  // ---- agendas que ya vencieron sin resolverse: se detectan una sola vez por sesión ----
  useEffect(() => {
    if (overdueQueue !== null || !events.length) return;
    setOverdueQueue(events.filter((ev) => C.eventDueState(ev) === "past").map((ev) => ev.id));
  }, [events, overdueQueue]);

  const overdueEvents = useMemo(
    () => (overdueQueue || []).map((id) => events.find((x) => x.id === id)).filter(Boolean),
    [overdueQueue, events]
  );
  const currentOverdue = overdueEvents[0] || null;
  const dismissOverdue = (id) => setOverdueQueue((q) => (q || []).filter((x) => x !== id));
  const onOverdueDone = async (ev) => {
    const updated = await updateResource('events', ev.id, { done: true });
    if (updated) setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, done: true } : x)));
    dismissOverdue(ev.id);
  };
  const onOverduePostpone = async (ev, newStart, newEnd) => {
    const updated = await updateResource('events', ev.id, { start: newStart, end: newEnd, done: false });
    if (updated) setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, start: newStart, end: newEnd, done: false } : x)));
    dismissOverdue(ev.id);
  };

  // ---- carga del tablero de tareas (3 columnas fijas del backend) ----
  useEffect(() => {
    let active = true;
    fetchCollection('tasks', taskOwner ? { userId: taskOwner } : undefined).then((remote) => {
      if (!active || !remote) return;
      setTaskLists(remote.map((col) => ({ ...col, cards: (col.cards || []).map((c) => ({ ...c, id: c.id || c._id })) })));
    });
    return () => { active = false; };
  }, [taskOwner]);

  // ---- equipo disponible para que un ADMIN/SUPER_ADMIN vea tareas de otros ----
  useEffect(() => {
    if (!canManageTasks) { setTeamUsers([]); return; }
    let active = true;
    fetchCollection('users/team').then((list) => {
      if (active && list) setTeamUsers(list);
    });
    return () => { active = false; };
  }, [canManageTasks]);

  // ---- carga inicial de recepción de propiedades ----
  useEffect(() => {
    let active = true;
    fetchCollection('reception').then((remote) => {
      if (!active || !remote) return;
      setReception(remote.map((x) => ({ ...x, id: x.id || x._id })));
    });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (!typeFilter[ev.type]) return false;
      if (!agentFilter[ev.agentId]) return false;
      if (q) {
        const prop = C.propById(ev.propertyId);
        const hay = [ev.title, ev.client && ev.client.name, prop && prop.name, ev.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, typeFilter, agentFilter, query]);

  const counts = useMemo(() => {
    const byType = {};
    events.forEach((ev) => { byType[ev.type] = (byType[ev.type] || 0) + 1; });
    return { byType };
  }, [events]);

  const onPrev = () => setCursor((c) => view === "week" ? C.addDays(c, -7) : view === "day" ? C.addDays(c, -1) : C.addMonths(c, -(MONTHS_BY_VIEW[view] || 1)));
  const onNext = () => setCursor((c) => view === "week" ? C.addDays(c, 7) : view === "day" ? C.addDays(c, 1) : C.addMonths(c, MONTHS_BY_VIEW[view] || 1));
  const onPrevMonth = () => setCursor((c) => C.addMonths(c, -1));
  const onNextMonth = () => setCursor((c) => C.addMonths(c, 1));
  const onToday = () => setCursor(C.TODAY);
  const goDay = (d) => { setCursor(d); setView("day"); };

  const calTitle = useMemo(() => {
    if (view === "day") { const x = C.parse(cursor); return `${C.DAYS[(x.getDay()+6)%7]} ${x.getDate()} de ${C.MONTHS[x.getMonth()]}`; }
    if (view === "week") {
      const ws = C.startOfWeek(cursor), we = C.addDays(ws, 6);
      if (ws.getMonth() === we.getMonth()) return `${ws.getDate()} – ${we.getDate()} ${C.MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;
      return `${ws.getDate()} ${C.MONTHS_SHORT[ws.getMonth()]} – ${we.getDate()} ${C.MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (MONTHS_BY_VIEW[view]) {
      const start = C.startOfMonth(cursor);
      const end = C.addMonths(start, MONTHS_BY_VIEW[view] - 1);
      const cap = (s) => s.replace(/^./, (m) => m.toUpperCase());
      if (start.getFullYear() === end.getFullYear()) {
        return `${cap(C.MONTHS_SHORT[start.getMonth()])} – ${cap(C.MONTHS_SHORT[end.getMonth()])} ${end.getFullYear()}`;
      }
      return `${cap(C.MONTHS_SHORT[start.getMonth()])} ${start.getFullYear()} – ${cap(C.MONTHS_SHORT[end.getMonth()])} ${end.getFullYear()}`;
    }
    return C.fmtMonthYear(cursor).replace(/^./, (m) => m.toUpperCase());
  }, [view, cursor]);

  const agendaTitle = useMemo(() => C.fmtMonthYear(cursor).replace(/^./, (m) => m.toUpperCase()), [cursor]);

  const openNew = useCallback((date, hour) => {
    const d = date || cursor;
    let initial = { start: C.ymd(d) + "T00:00:00", type: "reserva" };
    if (typeof hour === "number") {
      initial = { type: "visita", start: `${C.ymd(d)}T${String(hour).padStart(2,"0")}:00:00`,
        end: `${C.ymd(d)}T${String(hour+1).padStart(2,"0")}:00:00`, allDay: false };
    }
    setDetail(null); setForm({ initial });
  }, [cursor]);
  useEffect(() => { window.__openNew = openNew; }, [openNew]);

  const onSave = async (ev) => {
    const originalId = form?.initial?.id;
    const payload = { ...ev };
    delete payload.id;
    if (originalId) {
      await updateResource('events', originalId, payload);
      setEvents((list) => list.map((x) => (x.id === originalId ? { ...ev, id: originalId } : x)));
    } else {
      const created = await createResource('events', payload);
      const id = created?._id || created?.id || ev.id;
      setEvents((list) => [...list, { ...ev, id }]);
    }
    setForm(null);
  };
  const onDelete = async (ev) => {
    await deleteResource('events', ev.id);
    setEvents((l) => l.filter((x) => x.id !== ev.id));
    setDetail(null);
  };
  const onEdit = (ev) => { setDetail(null); setForm({ initial: ev }); };

  const handleLogout = async () => {
    await apiLogout();
    onLogout && onLogout();
  };

  // ---- tablero de tareas ----
  const addTaskCard = async (listId, fields) => {
    const payload = { listId, title: fields.title, description: fields.description || '' };
    if (canManageTasks && taskOwner) payload.ownerId = taskOwner;
    const created = await createResource('tasks', payload);
    if (!created) return;
    const card = { ...created, id: created.id || created._id };
    setTaskLists((lists) => lists.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, card] } : l)));
    setCardAnim((m) => ({ ...m, [card.id]: 'create' }));
  };
  const onCardAnimEnd = useCallback((cardId) => {
    setCardAnim((m) => {
      if (!(cardId in m)) return m;
      const next = { ...m };
      delete next[cardId];
      return next;
    });
  }, []);
  const editTaskCard = async (fields) => {
    const updated = await updateResource('tasks', fields.id, {
      title: fields.title, description: fields.description, color: fields.color, emoji: fields.emoji, image: fields.image,
    });
    if (!updated) return;
    setTaskLists((lists) => lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === fields.id ? { ...c, ...updated, id: updated.id || updated._id } : c)),
    })));
    setTaskForm(null);
  };
  const deleteTaskCard = async (listId, cardId) => {
    await deleteResource('tasks', cardId);
    setTaskLists((lists) => lists.map((l) => (l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l)));
  };
  const setCardField = (field) => async (listId, cardId, value) => {
    setTaskLists((lists) => lists.map((l) => (l.id !== listId ? l : {
      ...l, cards: l.cards.map((c) => (c.id === cardId ? { ...c, [field]: value } : c)),
    })));
    await updateResource('tasks', cardId, { [field]: value });
  };
  const colorTaskCard = setCardField('color');
  const emojiTaskCard = setCardField('emoji');
  const imageTaskCard = setCardField('image');
  const moveTaskCard = async (next, updates, moveInfo) => {
    setTaskLists(next);
    if (moveInfo && moveInfo.toListId !== moveInfo.fromListId) {
      const animType = moveInfo.toListId === 'doing' ? 'progress' : moveInfo.toListId === 'done' ? 'done' : null;
      if (animType) setCardAnim((m) => ({ ...m, [moveInfo.cardId]: animType }));
    }
    await Promise.all(updates.map((u) => updateResource('tasks', u.id, { listId: u.listId, position: u.position })));
  };
  // ---- recepción de propiedades ----
  const addReception = async (payload) => {
    const created = await createResource('reception', payload);
    if (!created) return;
    setReception((list) => [{ ...created, id: created.id || created._id }, ...list]);
    setRecepForm(null);
  };
  const editReception = async (payload) => {
    const updated = await updateResource('reception', payload.num, payload);
    if (!updated) return;
    setReception((list) => list.map((it) => (it.num === payload.num ? { ...it, ...updated, id: updated.id || updated._id } : it)));
    setRecepForm(null);
  };
  const deleteReception = async (item) => {
    await deleteResource('reception', item.num);
    setReception((list) => list.filter((it) => it.num !== item.num));
    setRecepDetail(null);
  };

  const addTaskList = async (title) => {
    const created = await createResource('tasks/lists', { title });
    if (!created) return;
    setTaskLists((lists) => [...lists, { ...created, cards: created.cards || [] }]);
  };

  // ---- toolbar + contenido por pestaña ----
  let toolbar, content;
  let mobileFab = null;
  if (tab === "calendario") {
    toolbar = e(CalendarToolbar, { view, setView, cursor, setCursor, title: calTitle, onPrev, onNext, onToday,
      query, setQuery, typeFilter, toggleType, agentFilter, toggleAgent, counts });
    const props = { cursor, events: visible, onOpen: setDetail, onNew: openNew };
    if (isMobile) {
      content = e(React.Fragment, null,
        e("div", { className: "view-card mobile-month-card" },
          e(MobileDateNav, { title: calTitle, onPrev, onNext, onToday }),
          e(MobileMonth, { cursor, events: visible, selectedDay: mobileDay, onDayTap: setMobileDay })),
        e("div", { className: "view-card day-card-wrap" },
          e(DayEventList, { day: mobileDay, events: visible, onOpen: setDetail })),
      );
      mobileFab = () => openNew(mobileDay);
    } else {
      const inner = view === "month" ? e(MonthView, Object.assign({}, props, { goDay }))
        : view === "week" ? e(WeekView, props)
        : view === "day" ? e(DayView, props)
        : MONTHS_BY_VIEW[view] ? e(MultiMonthView, Object.assign({}, props, { goDay, months: MONTHS_BY_VIEW[view] }))
        : e(DayView, props);
      content = e("div", { className: "view-card", "data-view": view }, inner);
    }
  } else if (tab === "agenda") {
    toolbar = e(AgendaToolbar, { cursor, title: agendaTitle, onPrev: onPrevMonth, onNext: onNextMonth, onToday, query, setQuery });
    if (isMobile) {
      content = e("div", { className: "view-card agenda-card" },
        e(MobileDateNav, { title: agendaTitle, onPrev: onPrevMonth, onNext: onNextMonth }),
        e(AgendaView, { cursor, events: visible, onOpen: setDetail }));
    } else {
      content = e("div", { className: "view-card agenda-card" }, e(AgendaView, { cursor, events: visible, onOpen: setDetail }));
    }
  } else if (tab === "recepcion") {
    toolbar = e(RecepcionToolbar, { items: reception, query, setQuery, statusFilter: recepStatus, toggleStatus, respFilter: recepResp, setRespFilter: setRecepResp, onNew: () => setRecepForm({ initial: null }) });
    if (isMobile) {
      content = e("div", { className: "view-card recep-card" },
        e("div", { className: "mob-status-row" },
          Object.values(RECEP.STATUS).map((s) => e("button", {
            key: s.key, className: "st-chip" + (recepStatus[s.key] ? "" : " off"), onClick: () => toggleStatus(s.key),
          }, e("span", { className: "st-chip-dot", style: { background: s.dot } }), s.label))),
        e(RecepView, { items: reception, query, statusFilter: recepStatus, respFilter: recepResp, onOpen: setRecepDetail, isMobile }));
      mobileFab = () => setRecepForm({ initial: null });
    } else {
      content = e("div", { className: "view-card recep-card" },
        e(RecepView, { items: reception, query, statusFilter: recepStatus, respFilter: recepResp, onOpen: setRecepDetail, isMobile }));
    }
  } else if (tab === "usuarios") {
    toolbar = e("div", { className: "toolbar" },
      e("div", { className: "tb-left" }, e("h1", { className: "tb-title" }, "Usuarios")));
    content = e(UsuariosView, null);
  } else {
    toolbar = e(TareasToolbar, { query, setQuery, canManageTasks, teamUsers, taskOwner, setTaskOwner });
    const board = e(Board, {
      lists: taskLists, query, onAddCard: addTaskCard, onDelCard: deleteTaskCard,
      onEditCard: (listId, card) => setTaskForm({ listId, card }), onColorCard: colorTaskCard, onEmojiCard: emojiTaskCard, onImageCard: imageTaskCard,
      onMoveCard: moveTaskCard, onAddList: addTaskList, currentUserId: session?.id,
      cardAnim, onAnimEnd: onCardAnimEnd,
    });
    content = isMobile && canManageTasks
      ? e(React.Fragment, null,
          e("div", { className: "mob-owner-row" },
            e("button", { className: "owner-chip" + (!taskOwner ? " on" : ""), onClick: () => setTaskOwner(null) }, "Mis tareas"),
            teamUsers.map((u) => e("button", {
              key: u._id, className: "owner-chip" + (taskOwner === u._id ? " on" : ""), onClick: () => setTaskOwner(u._id),
            }, u.name)),
          ),
          board,
        )
      : board;
  }

  return e("div", { className: "app" },
    e("div", { className: "beach-bg" }),
    e("div", { className: "beach-veil" }),
    e("div", { className: "shell" },
      e("div", { className: "shell-top" },
        e("div", { className: "brand-mini" }, e("img", { src: "/logo.webp", alt: "Silvia Fernández" })),
        isMobile ? e("h1", { className: "mobile-tab-title" }, MOBILE_TITLES[tab] || "") : toolbar,
        e(NotificationBell, { onNavigate: setTab }),
        e("div", { className: "profile-mini" },
          e(ProfileAvatar, { email: session?.email, name: session?.name, size: 34 }),
          e("span", { className: "profile-mini-name" }, session?.name),
        ),
        e("button", { className: "today-btn" + (isMobile ? " sm" : ""), onClick: handleLogout, title: "Cerrar sesión" }, "Salir"),
      ),
      e("div", { className: "shell-main", "data-tab": tab }, content),
      mobileFab ? e("button", { className: "mobile-fab", onClick: mobileFab, title: "Nuevo" }, e(I.Plus, { width: 22, height: 22 })) : null,
    ),
    e(TabBar, { tab, setTab, isSuperAdmin }),
    detail ? e(EventDetail, { ev: detail, onClose: () => setDetail(null), onEdit, onDelete }) : null,
    form ? e(EventForm, { initial: form.initial, onClose: () => setForm(null), onSave }) : null,
    taskForm ? e(TaskForm, {
      initial: taskForm, onClose: () => setTaskForm(null), onSave: editTaskCard,
      onDelete: (listId, cardId) => { deleteTaskCard(listId, cardId); setTaskForm(null); },
    }) : null,
    recepDetail ? e(RecepDetail, {
      item: recepDetail, onClose: () => setRecepDetail(null),
      onEdit: (item) => { setRecepDetail(null); setRecepForm({ initial: item }); },
      onDelete: deleteReception,
    }) : null,
    recepForm ? e(RecepForm, {
      nextNum: reception.reduce((m, it) => Math.max(m, it.num || 0), 0) + 1,
      initial: recepForm.initial,
      onClose: () => setRecepForm(null),
      onSave: recepForm.initial ? editReception : addReception,
    }) : null,
    (currentOverdue && !detail && !form && !taskForm && !recepDetail && !recepForm) ? e(OverdueModal, {
      ev: currentOverdue, queuePos: 1, queueLen: overdueEvents.length,
      onClose: () => dismissOverdue(currentOverdue.id),
      onDone: onOverdueDone, onPostpone: onOverduePostpone,
    }) : null,
  );
}

export default App;
