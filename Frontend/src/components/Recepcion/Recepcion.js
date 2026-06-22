'use client';
import React from 'react';
import { RECEP } from '@/lib/recepcionData';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import './Recepcion.css';
/* Vista Recepción de Propiedades */

  const e = React.createElement;
  const { useState, useMemo } = React;
  const R = RECEP;
  const I = Icons;
  const { InfoChip, InfoCard } = UI;

  const STEP_ICON = { tasacion: I.Clipboard, autorizacion: I.Check, cartel: I.SignPost, fotos: I.Camera, descripcion: I.FileText };
  const STEP_EMOJI = { done: "✅", missing: "⚠️", partial: "⏳", na: "➖" };
  const STATUS_EMOJI = { negro: "✅", rojo: "⚠️", celeste: "🤔", pausa: "⏸️" };

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

  // ---------- Modal de detalle ----------
  function StepRow({ stepKey, item }) {
    const s = R.STEPS.find((x) => x.key === stepKey);
    const state = item.steps[stepKey];
    const val = item[stepKey] || "";
    const Ico = STEP_ICON[stepKey];
    const txt = { done: "Hecho", missing: "Falta", na: "No aplica", partial: "En proceso" }[state];
    return e("div", { className: "rd-step " + state },
      e("span", { className: "rd-step-ico" }, e(Ico, { width: 16, height: 16 })),
      e("div", { className: "rd-step-main" },
        e("div", { className: "rd-step-top" },
          e("span", { className: "rd-step-label" }, s.label),
          e("span", { className: "rd-step-state " + state }, STEP_EMOJI[state], " ", txt),
        ),
        val ? e("div", { className: "rd-step-val" }, val) : null,
      ),
    );
  }

  function RecepDetail({ item, onClose, onEdit, onDelete }) {
    if (!item) return null;
    const st = R.STATUS[item.status];
    const pr = progress(item);
    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "recep-detail", onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "detail-top", style: { background: `linear-gradient(135deg, ${st.color}, ${darken(st.color, 0.35)})` } },
          e("span", { className: "detail-deco" }),
          e("span", { className: "detail-type" }, STATUS_EMOJI[item.status] || "📌", " ", st.label),
          e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "detail-body" },
          e("h2", { className: "detail-title" }, item.propiedad || "—",
            e("span", { className: "d-chip" }, "N°" + item.num)),
          e("div", { className: "detail-grid" },
            e(InfoChip, {
              icon: item.responsable ? e("span", { className: "rc-avatar", style: { background: item.respColor } }, item.respInit) : e(I.User, { width: 15, height: 15 }),
              emoji: "🧑‍💼", label: "Responsable", value: item.responsable || "Sin asignar",
            }),
            e(InfoChip, { icon: e(I.Calendar, { width: 15, height: 15 }), emoji: "📅", label: "Ingreso", value: item.fecha }),
            e(InfoChip, { icon: e(I.Coins, { width: 15, height: 15 }), emoji: "💰", label: "Valor", value: item.valor }),
          ),
          (item.owner || item.phone) ? e(InfoCard, {
            icon: e(I.User, { width: 15, height: 15 }), emoji: "🙋", label: "Propietario", title: item.owner || "—",
            sub: item.phone ? e("a", { className: "rd-phone", href: "tel:" + item.phone.replace(/\s/g, "") }, e(I.Phone, { width: 13, height: 13 }), item.phone) : null,
          }) : null,
          e("div", { className: "detail-grid" },
            e(InfoChip, { icon: e(I.Building, { width: 15, height: 15 }), emoji: "📐", label: "Superficie", value: item.superficie }),
            e(InfoChip, { icon: e(I.Tag, { width: 15, height: 15 }), emoji: "🔖", label: "ID publicación", value: item.idPublicacion }),
          ),
          item.notas ? e(InfoCard, {
            icon: e(I.FileText, { width: 15, height: 15 }), emoji: "📝", label: "Notas", sub: item.notas,
          }) : null,
          e("div", { className: "rd-steps-head" },
            e("span", null, "Estado de recepción"),
            e("span", { className: "rd-prog-pill", style: { color: st.color, background: st.bg } }, `${pr.done} de ${pr.total} pasos`),
          ),
          e("div", { className: "rd-steps" }, R.STEPS.map((s) => e(StepRow, { key: s.key, stepKey: s.key, item }))),
          item.link ? e("a", { className: "rd-link", href: item.link, target: "_blank", rel: "noopener" },
            e(I.ExternalLink, { width: 16, height: 16 }), "Ver publicación online") : null,
        ),
        e("div", { className: "detail-actions" },
          e("button", { className: "btn ghost danger", onClick: () => onDelete(item) }, e(I.Trash, { width: 16, height: 16 }), "Eliminar"),
          e("div", { className: "spacer" }),
          e("button", { className: "btn ghost", onClick: onClose }, "Cerrar"),
          e("button", { className: "btn primary", onClick: () => onEdit(item) }, e(I.Edit, { width: 16, height: 16 }), "Editar"),
        ),
      ),
    );
  }

  const STEP_STATE_OPTIONS = [
    { value: "missing", label: "Falta" },
    { value: "partial", label: "En proceso" },
    { value: "done", label: "Hecho" },
    { value: "na", label: "No aplica" },
  ];

  // ---------- Formulario de propiedad (alta o edición) ----------
  function RecepForm({ nextNum, initial, onClose, onSave }) {
    const isEdit = !!initial;
    const [f, setF] = useState(() => ({
      propiedad: initial?.propiedad || "", owner: initial?.owner || "", phone: initial?.phone || "",
      fecha: initial?.fecha || "", valor: initial?.valor || "", link: initial?.link || "",
      superficie: initial?.superficie || "", idPublicacion: initial?.idPublicacion || "", notas: initial?.notas || "",
      responsable: initial?.responsable || "", status: initial?.status || "celeste",
      steps: R.STEPS.reduce((o, s) => {
        o[s.key] = { text: initial?.[s.key] || "", state: initial?.steps?.[s.key] || "missing" };
        return o;
      }, {}),
    }));
    const set = (k) => (ev) => setF((o) => ({ ...o, [k]: ev.target.value }));
    const setStep = (key, field) => (ev) => setF((o) => ({
      ...o, steps: { ...o.steps, [key]: { ...o.steps[key], [field]: ev.target.value } },
    }));

    function save() {
      if (!f.propiedad.trim()) return;
      const team = R.TEAM.find((t) => t.name === f.responsable);
      const stepTexts = {}; const stepStates = {};
      R.STEPS.forEach((s) => { stepTexts[s.key] = f.steps[s.key].text.trim(); stepStates[s.key] = f.steps[s.key].state; });
      onSave({
        num: isEdit ? initial.num : nextNum,
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
        respColor: team ? team.color : (initial?.respColor || "#8a978f"),
        respInit: team ? team.init : (initial?.respInit || "·"),
        status: f.status,
        flags: initial?.flags || [],
        ...stepTexts,
        steps: stepStates,
      });
    }

    const curStatus = R.STATUS[f.status];
    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", style: { "--form-accent": curStatus.color }, onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "form-head" },
          e("h2", null, isEdit ? `Editar N°${initial.num}` : "Nueva propiedad"),
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
          e("div", { className: "fg-row" },
            e("div", { className: "fg" },
              e("label", null, "Responsable"),
              e("select", { value: f.responsable, onChange: set("responsable") },
                e("option", { value: "" }, "Sin asignar"),
                R.TEAM.map((t) => e("option", { key: t.name, value: t.name }, t.name)),
              ),
            ),
            e("div", { className: "fg" },
              e("label", null, "Estado"),
              e("select", { value: f.status, onChange: set("status") },
                Object.values(R.STATUS).map((s) => e("option", { key: s.key, value: s.key }, s.label)),
              ),
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
            e("label", null, "Estado de la recepción"),
            e("div", { className: "recep-steps-form" },
              R.STEPS.map((s) => e("div", { key: s.key, className: "rsf-row" },
                e("span", { className: "rsf-label" }, s.label),
                e("input", { className: "rsf-text", value: f.steps[s.key].text, onChange: setStep(s.key, "text"), placeholder: "Ej. sí, Pablo" }),
                e("select", { className: "rsf-state", value: f.steps[s.key].state, onChange: setStep(s.key, "state") },
                  STEP_STATE_OPTIONS.map((o) => e("option", { key: o.value, value: o.value }, o.label)),
                ),
              )),
            ),
          ),
        ),
        e("div", { className: "form-actions" },
          e("button", { className: "btn ghost", onClick: onClose }, "Cancelar"),
          e("button", { className: "btn primary", onClick: save }, e(I.Check, { width: 16, height: 16 }), isEdit ? "Guardar cambios" : "Crear propiedad"),
        ),
      ),
    );
  }

  export { RecepView, RecepDetail, RecepForm, progress };

