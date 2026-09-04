'use client';
import React from 'react';
import { RECEP } from '@/lib/recepcionData';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import './Recepcion.css';
/* Vista Recepción de Propiedades */

  const e = React.createElement;
  const { useState, useMemo, useEffect, useRef } = React;
  const R = RECEP;
  const I = Icons;
  const { EditableField, TitleField } = UI;

  const STEP_ICON = { tasacion: I.Clipboard, autorizacion: I.Check, cartel: I.SignPost, fotos: I.Camera, descripcion: I.FileText };
  const STATUS_EMOJI = { negro: "✅", rojo: "⚠️", celeste: "🤔", pausa: "⏸️" };

  // Un paso "cuenta" como completo si está hecho o no aplica a esta propiedad
  function stepIsResolved(state) { return state === "done" || state === "na"; }

  // Detección de duplicados al cargar una propiedad nueva: mismo teléfono o mismo apellido
  // (última palabra del nombre) del propietario que uno ya existente
  function normalizePhone(p) { return String(p || "").replace(/\D/g, ""); }
  function lastNameOf(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/);
    return parts.length ? parts[parts.length - 1].toLowerCase() : "";
  }
  function findDuplicateOwner(items, { name, phone }) {
    const ln = lastNameOf(name);
    const ph = normalizePhone(phone);
    return (items || []).find((it) => {
      const itPhone = normalizePhone(it.phone);
      const itLn = lastNameOf(it.owner);
      return (ph && itPhone && ph === itPhone) || (ln && itLn && ln === itLn);
    });
  }

  // Oscurece un color hex un % dado, para el degradé del header (mismo lenguaje que el detalle de evento)
  function darken(hex, amt) {
    const clean = String(hex || "").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return hex;
    const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
    const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
    const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function progress(item) {
    let done = 0, total = 0;
    R.STEPS.forEach((s) => { const st = item.steps[s.key]; if (st === "na") return; total++; if (st === "done") done++; });
    return { done, total };
  }

  // ---------- Indicador de paso ----------
  function StepDot({ stepKey, state }) {
    const Ico = STEP_ICON[stepKey];
    const cls = "step-dot " + state;
    const title = R.STEPS.find((s) => s.key === stepKey).label + ": " +
      (state === "done" ? "hecho" : state === "na" ? "no aplica" : state === "partial" ? "en proceso" : "falta");
    return e("span", { className: cls, title },
      state === "na" ? e("span", { className: "sd-dash" }) : e(Ico, { width: 13, height: 13 }));
  }

  // ---------- Tarjeta (mobile) ----------
  function RowMobile({ item, onOpen }) {
    const st = R.STATUS[item.status];
    const pr = progress(item);
    return e("button", { className: "rcm-card", onClick: () => onOpen(item) },
      e("span", { className: "rcm-num", style: { background: st.bg, color: st.color } }, item.num),
      e("div", { className: "rcm-main" },
        e("div", { className: "rcm-prop" }, item.propiedad || "—",
          item.link ? e("span", { className: "rc-link-ico", title: "Publicada" }, e(I.ExternalLink, { width: 12, height: 12 })) : null),
        e("div", { className: "rcm-sub" },
          item.owner ? e("span", null, item.owner) : null,
          item.fecha ? e("span", null, item.fecha) : null,
        ),
        e("div", { className: "rcm-foot" },
          item.responsable
            ? e("span", { className: "rcm-resp" },
                e("span", { className: "rc-avatar", style: { background: item.respColor } }, item.respInit),
                item.responsable)
            : e("span", { className: "rc-resp-none" }, "Sin asignar"),
          e("span", { className: "rcm-valor" }, item.valor || "—"),
        ),
      ),
      e("div", { className: "rcm-side" },
        e("span", { className: "rc-status-dot", style: { background: st.dot }, title: st.label }),
        e("span", { className: "rcm-prog" }, `${pr.done}/${pr.total}`),
      ),
    );
  }

  // ---------- Fila (desktop) ----------
  function Row({ item, onOpen }) {
    const st = R.STATUS[item.status];
    const pr = progress(item);
    return e("button", { className: "rc-row", onClick: () => onOpen(item) },
      e("span", { className: "rc-num", style: { background: st.bg, color: st.color } }, item.num),
      e("span", { className: "rc-status-dot", style: { background: st.dot }, title: st.label }),
      e("div", { className: "rc-prop" },
        e("div", { className: "rc-prop-name" }, item.propiedad || "—",
          item.link ? e("span", { className: "rc-link-ico", title: "Publicada" }, e(I.ExternalLink, { width: 13, height: 13 })) : null),
        e("div", { className: "rc-prop-sub" },
          item.owner ? e("span", null, e(I.User, { width: 12, height: 12 }), item.owner) : null,
          item.fecha ? e("span", null, e(I.Calendar, { width: 12, height: 12 }), item.fecha) : null,
        ),
      ),
      e("div", { className: "rc-resp" },
        item.responsable
          ? e(React.Fragment, null,
              e("span", { className: "rc-avatar", style: { background: item.respColor } }, item.respInit),
              e("span", { className: "rc-resp-name" }, item.responsable))
          : e("span", { className: "rc-resp-none" }, "Sin asignar"),
      ),
      e("div", { className: "rc-valor" }, item.valor || "—"),
      e("div", { className: "rc-steps" },
        R.STEPS.map((s) => e(StepDot, { key: s.key, stepKey: s.key, state: item.steps[s.key] })),
        e("span", { className: "rc-prog" }, `${pr.done}/${pr.total}`),
      ),
      e("span", { className: "rc-chev" }, e(I.Chevron, { width: 17, height: 17 })),
    );
  }

  // ---------- Vista principal ----------
  function RecepView({ items: allItems, query, statusFilter, respFilter, onOpen, isMobile }) {
    const items = useMemo(() => {
      const q = query.trim().toLowerCase();
      return (allItems || []).filter((it) => {
        if (!statusFilter[it.status]) return false;
        if (respFilter && respFilter !== "__all" && it.responsable !== respFilter) return false;
        if (q) {
          const hay = [it.propiedad, it.owner, it.responsable, it.valor, it.num, it.notas, it.idPublicacion].filter(Boolean).join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }, [allItems, query, statusFilter, respFilter]);

    if (!items.length) return e("div", { className: "rc-empty" }, "No hay propiedades que coincidan con el filtro.");

    if (isMobile) {
      return e("div", { className: "rcm-list" },
        items.map((it, idx) => e(RowMobile, { key: it.num + "-" + idx, item: it, onOpen })),
      );
    }

    return e("div", { className: "rc-table" },
      e("div", { className: "rc-head" },
        e("span", { className: "rc-h-num" }, "N°"),
        e("span", null, ""),
        e("span", { className: "rc-h-prop" }, "Propiedad"),
        e("span", { className: "rc-h-resp" }, "Responsable"),
        e("span", { className: "rc-h-valor" }, "Valor"),
        e("span", { className: "rc-h-steps" }, "Recepción"),
        e("span", null, ""),
      ),
      e("div", { className: "rc-body" },
        items.map((it, idx) => e(Row, { key: it.num + "-" + idx, item: it, onOpen })),
      ),
    );
  }

  const STEP_STATE_OPTIONS = [
    { value: "missing", label: "Falta", short: "Falta" },
    { value: "partial", label: "En proceso", short: "Proceso" },
    { value: "done", label: "Hecho", short: "Hecho" },
    { value: "na", label: "No aplica", short: "N/A" },
  ];

  // ---------- Selector de estado (chips clickeables, elección manual en cualquier momento) ----------
  function StatusPicker({ value, onPick }) {
    return e("div", { className: "status-picker" },
      Object.values(R.STATUS).map((s) => e("button", {
        key: s.key, type: "button", title: s.desc,
        className: "sp-chip" + (value === s.key ? " on" : ""),
        style: value === s.key ? { background: s.bg, borderColor: s.color, color: s.color } : null,
        onClick: () => onPick(s.key),
      }, e("span", { className: "sp-dot", style: { background: s.dot } }), s.label)),
    );
  }

  // ---------- Modal de detalle: lectura linda + edición inline por campo (mismo lenguaje que Clientes) ----------
  function StepEditRow({ stepKey, item, onSave }) {
    const s = R.STEPS.find((x) => x.key === stepKey);
    const Ico = STEP_ICON[stepKey];
    const state = item.steps[stepKey];
    const text = item[stepKey] || "";
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(text);
    useEffect(() => { if (!editing) setVal(text); }, [text, editing]);

    function commit() {
      setEditing(false);
      const v = val.trim();
      if (v !== text) onSave({ [stepKey]: v });
    }

    return e("div", { className: "rd-step " + state },
      e("span", { className: "rd-step-ico" }, e(Ico, { width: 16, height: 16 })),
      e("div", { className: "rd-step-main" },
        e("div", { className: "rd-step-top" },
          e("span", { className: "rd-step-label" }, s.label),
          e("div", { className: "rsf-btns" },
            STEP_STATE_OPTIONS.map((o) => e("button", {
              key: o.value, type: "button", title: o.label,
              className: "rsf-btn " + o.value + (state === o.value ? " on" : ""),
              onClick: () => { if (o.value !== state) onSave({ steps: { ...item.steps, [stepKey]: o.value } }); },
            }, o.short)),
          ),
        ),
        editing
          ? e("input", {
              className: "rd-step-input", autoFocus: true, value: val, placeholder: "Detalle opcional — ej. sí, Pablo",
              onChange: (ev) => setVal(ev.target.value), onBlur: commit,
              onKeyDown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); commit(); } if (ev.key === "Escape") { setVal(text); setEditing(false); } },
            })
          : e("div", { className: "rd-step-val" + (text ? "" : " empty"), onClick: () => setEditing(true) },
              text || "+ agregar detalle"),
      ),
    );
  }

  function RecepDetail({ item, onClose, onSave, onDelete }) {
    const allStepsResolved = item ? R.STEPS.every((s) => stepIsResolved(item.steps[s.key])) : false;
    // Al completar (o marcar N/A) todos los pasos, se sugiere "Todo OK" automáticamente,
    // pero el estado siempre se puede cambiar a mano desde el selector de abajo.
    const wasAllResolved = useRef(allStepsResolved);
    useEffect(() => {
      if (item && allStepsResolved && !wasAllResolved.current && item.status !== "negro") onSave({ status: "negro" });
      wasAllResolved.current = allStepsResolved;
    }, [allStepsResolved, item]);

    if (!item) return null;
    const st = R.STATUS[item.status];
    const pr = progress(item);
    const tel = item.phone ? "tel:" + item.phone.replace(/\s/g, "") : null;

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "recep-detail", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "detail-top", style: { background: `linear-gradient(135deg, ${st.color}, ${darken(st.color, 0.35)})` } },
          e("span", { className: "detail-deco" }),
          e("span", { className: "cd-top-emoji" }, STATUS_EMOJI[item.status] || "📌"),
          e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "detail-body" },
          e("div", { className: "rd-title-row" },
            e(TitleField, { value: item.propiedad, placeholder: "Sin nombre", onSave: (v) => onSave({ propiedad: v }) }),
            e("span", { className: "d-chip" }, "N°" + item.num),
          ),
          e("div", { className: "detail-grid" },
            e(EditableField, {
              type: "select", label: "Responsable", value: item.responsable,
              options: [{ value: "", label: "Sin asignar" }].concat(R.TEAM.map((t) => ({ value: t.name, label: t.name }))),
              icon: item.responsable ? e("span", { className: "rc-avatar", style: { background: item.respColor } }, item.respInit) : e(I.User, { width: 15, height: 15 }),
              displayValue: item.responsable || "Sin asignar",
              onSave: (v) => { const t = R.TEAM.find((x) => x.name === v); onSave({ responsable: v, respColor: t ? t.color : "#8a978f", respInit: t ? t.init : "·" }); },
            }),
            e(EditableField, { label: "Ingreso", value: item.fecha, placeholder: "DD/MM", icon: e(I.Calendar, { width: 15, height: 15 }), onSave: (v) => onSave({ fecha: v }) }),
          ),
          e("div", { className: "detail-grid" },
            e(EditableField, { label: "Valor", value: item.valor, placeholder: "Usd 100.000", icon: e(I.Coins, { width: 15, height: 15 }), onSave: (v) => onSave({ valor: v }) }),
            e(EditableField, { label: "Superficie", value: item.superficie, placeholder: "Sup. cub. 86 m² - Lote 350 m²", icon: e(I.Building, { width: 15, height: 15 }), onSave: (v) => onSave({ superficie: v }) }),
          ),
          e(EditableField, { label: "Propietario", value: item.owner, placeholder: "Nombre del dueño", full: true, icon: e(I.User, { width: 15, height: 15 }), onSave: (v) => onSave({ owner: v }) }),
          e("div", { className: "detail-grid" },
            e(EditableField, { type: "tel", label: "Teléfono", value: item.phone, placeholder: "+54 9 …", icon: e(I.Phone, { width: 15, height: 15 }), onSave: (v) => onSave({ phone: v }) }),
            e(EditableField, { label: "ID publicación", value: item.idPublicacion, placeholder: "Nº interno / Tokko", icon: e(I.Tag, { width: 15, height: 15 }), onSave: (v) => onSave({ idPublicacion: v }) }),
          ),
          tel ? e("div", { className: "cd-contact-row" },
            e("a", { className: "cl-cbtn call lg", href: tel }, e(I.Phone, { width: 14, height: 14 }), "Llamar")) : null,
          e(EditableField, { label: "Link de publicación", value: item.link, placeholder: "https://…", full: true, icon: e(I.ExternalLink, { width: 15, height: 15 }), onSave: (v) => onSave({ link: v }) }),
          e(EditableField, { type: "textarea", label: "Notas", value: item.notas, placeholder: "Observaciones, llaves, condiciones del dueño…", full: true, icon: e(I.FileText, { width: 15, height: 15 }), onSave: (v) => onSave({ notas: v }) }),
          e("div", { className: "rd-status-block" },
            e("span", { className: "rd-status-label" }, "Estado"),
            e(StatusPicker, { value: item.status, onPick: (k) => onSave({ status: k }) }),
          ),
          e("div", { className: "rd-steps-head" },
            e("span", null, "Estado de recepción"),
            e("span", { className: "rd-prog-pill", style: { color: st.color, background: st.bg } }, `${pr.done} de ${pr.total} pasos`),
          ),
          e("div", { className: "rd-steps" }, R.STEPS.map((s) => e(StepEditRow, { key: s.key, stepKey: s.key, item, onSave }))),
          item.link ? e("a", { className: "rd-link", href: item.link, target: "_blank", rel: "noopener" },
            e(I.ExternalLink, { width: 16, height: 16 }), "Ver publicación online") : null,
        ),
        e("div", { className: "detail-actions" },
          e("button", { className: "btn ghost danger", onClick: () => { onDelete(item); onClose(); } }, e(I.Trash, { width: 16, height: 16 }), "Eliminar"),
          e("div", { className: "spacer" }),
          e("button", { className: "btn ghost", onClick: onClose }, "Cerrar"),
        ),
      ),
    );
  }

  // ---------- Fila de paso editable (formulario de alta) ----------
  function StepFormRow({ stepKey, step, onState, onText }) {
    const s = R.STEPS.find((x) => x.key === stepKey);
    const Ico = STEP_ICON[stepKey];
    return e("div", { className: "rsf-card " + step.state },
      e("div", { className: "rsf-top" },
        e("span", { className: "rsf-ico" }, e(Ico, { width: 15, height: 15 })),
        e("span", { className: "rsf-label" }, s.label),
        e("div", { className: "rsf-btns" },
          STEP_STATE_OPTIONS.map((o) => e("button", {
            key: o.value, type: "button", title: o.label,
            className: "rsf-btn " + o.value + (step.state === o.value ? " on" : ""),
            onClick: () => onState(o.value),
          }, o.short)),
        ),
      ),
      e("input", {
        className: "rsf-text", value: step.text, onChange: onText,
        placeholder: "Detalle opcional — ej. sí, Pablo",
      }),
    );
  }

  // ---------- Formulario de alta de propiedad (la edición es inline en RecepDetail) ----------
  function RecepForm({ nextNum, onClose, onSave, existingItems }) {
    const [f, setF] = useState(() => ({
      propiedad: "", owner: "", phone: "", fecha: "", valor: "", link: "",
      superficie: "", idPublicacion: "", notas: "", responsable: "", status: "celeste",
      steps: R.STEPS.reduce((o, s) => { o[s.key] = { text: "", state: "missing" }; return o; }, {}),
    }));
    const set = (k) => (ev) => setF((o) => ({ ...o, [k]: ev.target.value }));
    const setStepText = (key) => (ev) => setF((o) => ({
      ...o, steps: { ...o.steps, [key]: { ...o.steps[key], text: ev.target.value } },
    }));
    const setStepState = (key) => (val) => setF((o) => ({
      ...o, steps: { ...o.steps, [key]: { ...o.steps[key], state: val } },
    }));

    const stepsDone = R.STEPS.filter((s) => f.steps[s.key].state === "done").length;
    const stepsTotal = R.STEPS.filter((s) => f.steps[s.key].state !== "na").length;
    const allStepsResolved = R.STEPS.every((s) => stepIsResolved(f.steps[s.key].state));
    // Al completar (o marcar N/A) todos los pasos, se sugiere "Todo OK" automáticamente,
    // pero el estado siempre se puede elegir a mano desde el selector de abajo.
    const wasAllResolved = useRef(allStepsResolved);
    useEffect(() => {
      if (allStepsResolved && !wasAllResolved.current) {
        setF((o) => (o.status === "negro" ? o : { ...o, status: "negro" }));
      }
      wasAllResolved.current = allStepsResolved;
    }, [allStepsResolved]);

    function save() {
      if (!f.propiedad.trim()) return;
      const dup = findDuplicateOwner(existingItems, { name: f.owner, phone: f.phone });
      if (dup && !window.confirm(`Ya hay una propiedad cargada con ese apellido o teléfono de propietario ("${dup.owner || "sin nombre"}"). ¿Agregar igual?`)) return;
      const team = R.TEAM.find((t) => t.name === f.responsable);
      const stepTexts = {}; const stepStates = {};
      R.STEPS.forEach((s) => { stepTexts[s.key] = f.steps[s.key].text.trim(); stepStates[s.key] = f.steps[s.key].state; });
      onSave({
        num: nextNum,
        propiedad: f.propiedad.trim(),
        owner: f.owner.trim(),
        phone: f.phone.trim(),
        fecha: f.fecha.trim(),
        valor: f.valor.trim(),
        link: f.link.trim(),
        superficie: f.superficie.trim(),
        idPublicacion: f.idPublicacion.trim(),
        notas: f.notas.trim(),
        responsable: f.responsable,
        respColor: team ? team.color : "#8a978f",
        respInit: team ? team.init : "·",
        status: f.status,
        flags: [],
        ...stepTexts,
        steps: stepStates,
      });
    }

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "form-head" },
          e("h2", null, "Nueva propiedad 🏠"),
          e("button", { className: "detail-x dark", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "form-body" },
          e("div", { className: "fg" },
            e("label", null, "Propiedad"),
            e("input", { value: f.propiedad, onChange: set("propiedad"), placeholder: "Dirección / descripción de la propiedad", autoFocus: true }),
          ),
          e("div", { className: "fg-row" },
            e("div", { className: "fg" }, e("label", null, "Propietario"),
              e("input", { value: f.owner, onChange: set("owner"), placeholder: "Nombre del dueño" })),
            e("div", { className: "fg" }, e("label", null, "Teléfono"),
              e("input", { value: f.phone, onChange: set("phone"), placeholder: "+54 9 …" })),
          ),
          e("div", { className: "fg-row" },
            e("div", { className: "fg" }, e("label", null, "Valor"),
              e("input", { value: f.valor, onChange: set("valor"), placeholder: "Usd 100.000" })),
            e("div", { className: "fg" }, e("label", null, "Fecha de ingreso"),
              e("input", { value: f.fecha, onChange: set("fecha"), placeholder: "DD/MM" })),
          ),
          e("div", { className: "fg" },
            e("label", null, "Responsable"),
            e("select", { value: f.responsable, onChange: set("responsable") },
              e("option", { value: "" }, "Sin asignar"),
              R.TEAM.map((t) => e("option", { key: t.name, value: t.name }, t.name)),
            ),
          ),
          e("div", { className: "fg-row" },
            e("div", { className: "fg" }, e("label", null, "Link de publicación"),
              e("input", { value: f.link, onChange: set("link"), placeholder: "https://…" })),
            e("div", { className: "fg" }, e("label", null, "ID publicación"),
              e("input", { value: f.idPublicacion, onChange: set("idPublicacion"), placeholder: "Nº interno / Tokko" })),
          ),
          e("div", { className: "fg" },
            e("label", null, "Superficie"),
            e("input", { value: f.superficie, onChange: set("superficie"), placeholder: "Sup. cub. 86 m² - Lote 350 m²" }),
          ),
          e("div", { className: "fg" },
            e("label", null, "Notas"),
            e("textarea", { value: f.notas, onChange: set("notas"), rows: 3, placeholder: "Observaciones, llaves, condiciones del dueño…" }),
          ),
          e("div", { className: "fg" },
            e("label", null, "Estado"),
            e(StatusPicker, { value: f.status, onPick: (k) => setF((o) => ({ ...o, status: k })) }),
          ),
          e("div", { className: "fg" },
            e("div", { className: "rd-steps-head" },
              e("label", null, "Estado de la recepción"),
              e("span", { className: "rd-prog-pill" }, `${stepsDone} de ${stepsTotal} pasos`),
            ),
            e("div", { className: "recep-steps-form" },
              R.STEPS.map((s) => e(StepFormRow, {
                key: s.key, stepKey: s.key, step: f.steps[s.key],
                onState: setStepState(s.key), onText: setStepText(s.key),
              })),
            ),
          ),
        ),
        e("div", { className: "form-actions" },
          e("button", { className: "btn ghost", onClick: onClose }, "Cancelar"),
          e("button", { className: "btn primary", onClick: save }, e(I.Check, { width: 16, height: 16 }), "Crear propiedad"),
        ),
      ),
    );
  }

  export { RecepView, RecepDetail, RecepForm, progress };

