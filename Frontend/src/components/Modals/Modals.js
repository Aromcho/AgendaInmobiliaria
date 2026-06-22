'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import './Modals.css';
/* Modales -> window.Modals : EventDetail, EventForm */

  const e = React.createElement;
  const { useState, useRef } = React;
  const C = CAL;
  const I = Icons;
  const { Avatar, TYPE_ICON, InfoChip, InfoCard, Confetti } = UI;

  const STATUS_EMOJI = { confirmada: "✅", senia: "💰", pendiente: "⏳", cancelada: "🚫" };

  // ---------- Detalle de evento ----------
  function EventDetail({ ev, onClose, onEdit, onDelete }) {
    if (!ev) return null;
    const t = C.EVENT_TYPES[ev.type];
    const Ico = TYPE_ICON[ev.type];
    const ag = C.agentById(ev.agentId);
    const prop = C.propById(ev.propertyId);
    const st = C.STATUS[ev.status];
    const dateLine = C.eventDateLine(ev);

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "detail", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "detail-top", style: { background: `linear-gradient(135deg, ${t.color}, ${t.ink})` } },
          e("span", { className: "detail-deco" }),
          e("span", { className: "detail-type" }, e(Ico, { width: 14, height: 14 }), t.label),
          e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "detail-body" },
          e("h2", { className: "detail-title" }, ev.title),
          e("div", { className: "detail-grid" },
            e(InfoChip, {
              icon: ag ? e(Avatar, { agent: ag, size: 30 }) : e(I.User, { width: 15, height: 15 }),
              emoji: "👋", label: "Responsable", value: ag ? ag.name : "Sin asignar",
            }),
            e(InfoChip, {
              icon: e(I.Clock, { width: 15, height: 15 }), emoji: "📅",
              label: ev.allDay ? "Fechas" : "Horario", value: dateLine,
            }),
            st ? e(InfoChip, {
              icon: e(I.Check, { width: 15, height: 15 }), emoji: STATUS_EMOJI[ev.status] || "📌",
              label: "Estado", value: st.label, tint: { color: st.color, bg: st.bg },
            }) : null,
          ),
          prop ? e(InfoCard, {
            icon: e(I.MapPin, { width: 15, height: 15 }), emoji: "🏠", label: prop.kind,
            title: prop.name, sub: prop.loc,
          }) : null,
          ev.client ? e(InfoCard, {
            icon: e(I.User, { width: 15, height: 15 }), emoji: "🙋", label: "Cliente",
            title: e("span", null, ev.client.name, ev.client.people ? e("span", { className: "d-chip" }, `${ev.client.people} pax`) : null),
            sub: ev.client.phone ? e("span", { className: "d-phone" }, e(I.Phone, { width: 13, height: 13 }), ev.client.phone) : null,
          }) : null,
          ev.notes ? e(InfoCard, {
            icon: e(I.Tag, { width: 15, height: 15 }), emoji: "📝", label: "Notas", sub: ev.notes,
          }) : null,
        ),
        e("div", { className: "detail-actions" },
          e("button", { className: "btn ghost danger", onClick: () => onDelete(ev) }, e(I.Trash, { width: 16, height: 16 }), "Eliminar"),
          e("div", { className: "spacer" }),
          e("button", { className: "btn ghost", onClick: onClose }, "Cerrar"),
          e("button", { className: "btn primary", onClick: () => onEdit(ev) }, e(I.Edit, { width: 16, height: 16 }), "Editar"),
        ),
      ),
    );
  }

  // ---------- Formulario ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function toDateInput(dt) { const x = C.parse(dt); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; }
  function fmtDateTime(dt, allDay) {
    const x = C.parse(dt);
    const base = `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
    return allDay ? `${base}T00:00:00` : `${base}T${pad(x.getHours())}:${pad(x.getMinutes())}:00`;
  }

  // ---------- Modal de agenda vencida (decidir: posponer o marcar hecho) ----------
  function quickPostponeOptions(ev) {
    const now = new Date();
    const orig = C.parse(ev.start);
    const withTime = (base) => { const d = new Date(base); if (!ev.allDay) d.setHours(orig.getHours(), orig.getMinutes(), 0, 0); return d; };
    if (ev.allDay) {
      return [
        { label: "Mañana", date: C.addDays(now, 1) },
        { label: "En 3 días", date: C.addDays(now, 3) },
        { label: "La próxima semana", date: C.addDays(now, 7) },
      ];
    }
    return [
      { label: "En 1 hora", date: new Date(now.getTime() + 60 * 60000) },
      { label: "Mañana", date: withTime(C.addDays(now, 1)) },
      { label: "La próxima semana", date: withTime(C.addDays(now, 7)) },
    ];
  }

  function OverdueModal({ ev, queuePos, queueLen, onClose, onDone, onPostpone }) {
    if (!ev) return null;
    const t = C.EVENT_TYPES[ev.type];
    const Ico = TYPE_ICON[ev.type];
    const s0 = C.parse(ev.start), e0 = C.parse(ev.end);
    const durationMs = Math.max(0, e0 - s0);
    const [mode, setMode] = useState("choose"); // choose | postpone | celebrate
    const [date, setDate] = useState(() => toDateInput(C.addDays(new Date(), 1)));
    const [time, setTime] = useState(`${pad(s0.getHours())}:${pad(s0.getMinutes())}`);
    const doneRef = useRef(null);
    const [confettiPos, setConfettiPos] = useState(null);

    function applyPostpone(newStart) {
      const newEnd = new Date(newStart.getTime() + durationMs);
      onPostpone(ev, fmtDateTime(newStart, ev.allDay), fmtDateTime(newEnd, ev.allDay));
    }
    function confirmManual() {
      const newStart = ev.allDay ? C.parse(date + "T00:00:00") : C.parse(`${date}T${time}:00`);
      applyPostpone(newStart);
    }
    function celebrate() {
      if (doneRef.current) {
        const r = doneRef.current.getBoundingClientRect();
        setConfettiPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }
      setMode("celebrate");
      setTimeout(() => onDone(ev), 1200);
    }

    return e("div", { className: "modal-scrim", onMouseDown: mode === "celebrate" ? undefined : onClose },
      e("div", { className: "detail overdue-modal", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "detail-top", style: { background: `linear-gradient(135deg, ${t.color}, ${t.ink})` } },
          e("span", { className: "detail-deco" }),
          e("span", { className: "detail-type" }, "⏰ Quedó pendiente"),
          mode !== "celebrate" ? e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })) : null,
        ),
        e("div", { className: "detail-body" },
          mode === "celebrate"
            ? e("div", { className: "overdue-celebrate" },
                e("span", { className: "overdue-celebrate-ico" }, "🎉"),
                e("p", null, "¡Listo! Quedó marcada como hecha."),
              )
            : e(React.Fragment, null,
                queueLen > 1 ? e("div", { className: "overdue-counter" }, `Agenda ${queuePos} de ${queueLen} que quedaron pendientes`) : null,
                e("h2", { className: "detail-title" }, ev.title),
                e("div", { className: "detail-chip full" },
                  e("span", { className: "dc-ico", style: { color: t.color, background: t.bg } }, e(Ico, { width: 15, height: 15 })),
                  e("div", { className: "dc-text" },
                    e("div", { className: "dc-label" }, t.label),
                    e("div", { className: "dc-val" }, C.eventDateLine(ev)),
                  ),
                  e("span", { className: "dc-emoji" }, "⏰"),
                ),
                mode === "choose"
                  ? e(React.Fragment, null,
                      e("p", { className: "overdue-question" }, "Ya pasó la fecha. ¿Qué hacemos con esta agenda?"),
                      e("div", { className: "overdue-choices" },
                        e("button", { className: "overdue-choice postpone", onClick: () => setMode("postpone") },
                          e("span", { className: "oc-emoji" }, "📅"), e("span", null, "Posponer")),
                        e("button", { className: "overdue-choice done", ref: doneRef, onClick: celebrate },
                          e("span", { className: "oc-emoji" }, "✅"), e("span", null, "Hecho")),
                      ),
                    )
                  : e(React.Fragment, null,
                      e("div", { className: "overdue-quick" },
                        quickPostponeOptions(ev).map((q, i) => e("button", {
                          key: i, type: "button", className: "overdue-quick-btn", onClick: () => applyPostpone(q.date),
                        }, q.label)),
                      ),
                      e("div", { className: "fg-row" },
                        e("div", { className: "fg" }, e("label", null, "Nueva fecha"),
                          e("input", { type: "date", value: date, onChange: (ev2) => setDate(ev2.target.value) })),
                        !ev.allDay ? e("div", { className: "fg sm" }, e("label", null, "Hora"),
                          e("input", { type: "time", value: time, onChange: (ev2) => setTime(ev2.target.value) })) : null,
                      ),
                      e("div", { className: "overdue-postpone-actions" },
                        e("button", { className: "btn ghost", onClick: () => setMode("choose") }, "Volver"),
                        e("button", { className: "btn primary", onClick: confirmManual }, e(I.Check, { width: 16, height: 16 }), "Confirmar"),
                      ),
                    ),
              ),
        ),
      ),
      confettiPos ? e(Confetti, { x: confettiPos.x, y: confettiPos.y, onDone: () => {} }) : null,
    );
  }

  function EventForm({ initial, onClose, onSave }) {
    const isEdit = !!initial.id;
    const [f, setF] = useState(() => {
      const s = C.parse(initial.start || C.TODAY);
      const en = C.parse(initial.end || initial.start || C.TODAY);
      return {
        type: initial.type || "reserva",
        title: initial.title || "",
        propertyId: initial.propertyId || "",
        agentId: initial.agentId || "a1",
        status: initial.status || "pendiente",
        date: toDateInput(s),
        endDate: toDateInput(en),
        startTime: initial.allDay === false ? C.fmtTime(s) : (initial.startTime || "10:00"),
        endTime: initial.allDay === false ? C.fmtTime(en) : (initial.endTime || "11:00"),
        clientName: (initial.client && initial.client.name) || "",
        clientPhone: (initial.client && initial.client.phone) || "",
        notes: initial.notes || "",
      };
    });
    const set = (k) => (ev) => setF((o) => ({ ...o, [k]: ev.target.value }));
    const isAllDay = f.type === "reserva" || f.type === "vencimiento";

    function save() {
      const ev = {
        id: initial.id || "n" + Date.now(),
        type: f.type,
        title: f.title || C.EVENT_TYPES[f.type].label,
        propertyId: f.propertyId || null,
        agentId: f.agentId,
        status: f.status,
        allDay: isAllDay,
        notes: f.notes,
        client: (f.clientName || f.clientPhone) ? { name: f.clientName, phone: f.clientPhone } : null,
      };
      if (isAllDay) {
        ev.start = `${f.date}T00:00:00`;
        ev.end = `${f.type === "reserva" ? f.endDate : f.date}T00:00:00`;
      } else {
        ev.start = `${f.date}T${f.startTime}:00`;
        ev.end = `${f.date}T${f.endTime}:00`;
      }
      onSave(ev);
    }

    const curType = C.EVENT_TYPES[f.type];
    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", style: { "--form-accent": curType.color }, onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "form-head" },
          e("h2", null, isEdit ? "Editar evento" : "Nuevo evento"),
          e("button", { className: "detail-x dark", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "form-body" },
          e("div", { className: "fg" },
            e("label", null, "Tipo de evento"),
            e("div", { className: "type-chips" },
              Object.values(C.EVENT_TYPES).map((t) => {
                const Ico = TYPE_ICON[t.key];
                const on = f.type === t.key;
                return e("button", { key: t.key, type: "button",
                  className: "type-chip" + (on ? " on" : ""),
                  style: on ? { background: t.bg, color: t.ink, borderColor: t.color, boxShadow: `0 4px 14px -4px ${t.color}` } : null,
                  onClick: () => setF((o) => ({ ...o, type: t.key })) },
                  e("span", { className: "tc-ico", style: { color: t.color } }, e(Ico, { width: 14, height: 14 })), t.short);
              }),
            ),
          ),
          e("div", { className: "fg" },
            e("label", null, "Título"),
            e("input", { value: f.title, onChange: set("title"), placeholder: "Ej. Familia Gómez / Visita Casa Los Aromos" }),
          ),
          e("div", { className: "fg-row" },
            e("div", { className: "fg" },
              e("label", null, "Propiedad"),
              e("select", { value: f.propertyId, onChange: set("propertyId") },
                e("option", { value: "" }, "— Sin propiedad —"),
                C.PROPERTIES.map((p) => e("option", { key: p.id, value: p.id }, p.name)),
              ),
            ),
            e("div", { className: "fg" },
              e("label", null, "Responsable"),
              e("select", { value: f.agentId, onChange: set("agentId") },
                C.AGENTS.map((a) => e("option", { key: a.id, value: a.id }, a.name)),
              ),
            ),
          ),
          isAllDay
            ? e("div", { className: "fg-row" },
                e("div", { className: "fg" }, e("label", null, f.type === "reserva" ? "Check-in" : "Fecha"),
                  e("input", { type: "date", value: f.date, onChange: set("date") })),
                f.type === "reserva"
                  ? e("div", { className: "fg" }, e("label", null, "Check-out"),
                      e("input", { type: "date", value: f.endDate, onChange: set("endDate") }))
                  : null,
              )
            : e("div", { className: "fg-row" },
                e("div", { className: "fg" }, e("label", null, "Fecha"),
                  e("input", { type: "date", value: f.date, onChange: set("date") })),
                e("div", { className: "fg sm" }, e("label", null, "Desde"),
                  e("input", { type: "time", value: f.startTime, onChange: set("startTime") })),
                e("div", { className: "fg sm" }, e("label", null, "Hasta"),
                  e("input", { type: "time", value: f.endTime, onChange: set("endTime") })),
              ),
          e("div", { className: "fg-row" },
            e("div", { className: "fg" }, e("label", null, "Cliente"),
              e("input", { value: f.clientName, onChange: set("clientName"), placeholder: "Nombre y apellido" })),
            e("div", { className: "fg" }, e("label", null, "Teléfono"),
              e("input", { value: f.clientPhone, onChange: set("clientPhone"), placeholder: "+54 9 …" })),
          ),
          e("div", { className: "fg" },
            e("label", null, "Estado"),
            e("div", { className: "status-chips" },
              Object.values(C.STATUS).map((s) => e("button", { key: s.key, type: "button",
                className: "status-chip" + (f.status === s.key ? " on" : ""),
                style: f.status === s.key ? { color: s.color, background: s.bg, borderColor: s.color, boxShadow: `0 4px 14px -4px ${s.color}` } : null,
                onClick: () => setF((o) => ({ ...o, status: s.key })) }, s.label)),
            ),
          ),
          e("div", { className: "fg" },
            e("label", null, "Notas"),
            e("textarea", { value: f.notes, onChange: set("notes"), rows: 3, placeholder: "Detalles internos, recordatorios…" }),
          ),
        ),
        e("div", { className: "form-actions" },
          e("button", { className: "btn ghost", onClick: onClose }, "Cancelar"),
          e("button", { className: "btn primary", onClick: save }, e(I.Check, { width: 16, height: 16 }), isEdit ? "Guardar cambios" : "Crear evento"),
        ),
      ),
    );
  }

  export { EventDetail, EventForm, OverdueModal };

