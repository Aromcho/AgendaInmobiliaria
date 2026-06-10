'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from './Icons';
import * as UI from './ui';
/* Modales -> window.Modals : EventDetail, EventForm */

  const e = React.createElement;
  const { useState } = React;
  const C = CAL;
  const I = Icons;
  const { Avatar, TYPE_ICON } = UI;

  function Row({ icon, label, children }) {
    if (!children) return null;
    return e("div", { className: "d-row" },
      e("span", { className: "d-ico" }, icon),
      e("div", { className: "d-rc" },
        label ? e("div", { className: "d-label" }, label) : null,
        e("div", { className: "d-val" }, children),
      ),
    );
  }

  // ---------- Detalle de evento ----------
  function EventDetail({ ev, onClose, onEdit, onDelete }) {
    if (!ev) return null;
    const t = C.EVENT_TYPES[ev.type];
    const Ico = TYPE_ICON[ev.type];
    const ag = C.agentById(ev.agentId);
    const prop = C.propById(ev.propertyId);
    const st = C.STATUS[ev.status];
    const multi = ev.allDay && C.dayDiff(ev.start, ev.end) >= 1;
    const dateLine = ev.allDay
      ? (multi
          ? `${C.parse(ev.start).getDate()} ${C.MONTHS_SHORT[C.parse(ev.start).getMonth()]} → ${C.parse(ev.end).getDate()} ${C.MONTHS_SHORT[C.parse(ev.end).getMonth()]} · ${C.nights(ev)} noches`
          : `${C.DAYS[(C.parse(ev.start).getDay()+6)%7]} ${C.parse(ev.start).getDate()} de ${C.MONTHS[C.parse(ev.start).getMonth()]}`)
      : `${C.DAYS[(C.parse(ev.start).getDay()+6)%7]} ${C.parse(ev.start).getDate()} · ${C.fmtTime(ev.start)} – ${C.fmtTime(ev.end)}`;

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "detail", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "detail-top", style: { background: t.color } },
          e("span", { className: "detail-type" }, e(Ico, { width: 15, height: 15 }), t.label),
          e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "detail-body" },
          e("h2", { className: "detail-title" }, ev.title),
          st ? e("span", { className: "status-badge lg", style: { color: st.color, background: st.bg } }, st.label) : null,
          e("div", { className: "detail-rows" },
            e(Row, { icon: e(I.Clock, { width: 16, height: 16 }) }, dateLine),
            prop ? e(Row, { icon: e(I.MapPin, { width: 16, height: 16 }), label: prop.kind },
              e("div", null, e("b", null, prop.name), e("div", { className: "d-muted" }, prop.loc))) : null,
            ev.client ? e(Row, { icon: e(I.User, { width: 16, height: 16 }), label: "Cliente" },
              e("div", null, e("b", null, ev.client.name),
                ev.client.people ? e("span", { className: "d-chip" }, `${ev.client.people} pax`) : null,
                ev.client.phone ? e("div", { className: "d-muted d-phone" }, e(I.Phone, { width: 13, height: 13 }), ev.client.phone) : null,
              )) : null,
            ag ? e(Row, { icon: e(Avatar, { agent: ag, size: 24 }), label: "Responsable" }, ag.name) : null,
            ev.notes ? e(Row, { icon: e(I.Tag, { width: 16, height: 16 }), label: "Notas" }, ev.notes) : null,
          ),
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

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", onMouseDown: (e2) => e2.stopPropagation() },
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
                  style: on ? { background: t.bg, color: t.ink, borderColor: t.color } : null,
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
                style: f.status === s.key ? { color: s.color, background: s.bg, borderColor: s.color } : null,
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

  export { EventDetail, EventForm };

