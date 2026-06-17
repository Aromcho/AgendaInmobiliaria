'use client';
import React from 'react';
import { RECEP } from '@/lib/recepcionData';
import Icons from '../Icons/Icons';
import './Recepcion.css';
/* Vista Recepción de Propiedades */

  const e = React.createElement;
  const { useState, useMemo } = React;
  const R = RECEP;
  const I = Icons;

  const STEP_ICON = { tasacion: I.Clipboard, autorizacion: I.Check, cartel: I.SignPost, fotos: I.Camera, descripcion: I.FileText };

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

  // ---------- Fila ----------
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
  function RecepView({ items: allItems, query, statusFilter, respFilter, onOpen }) {
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
          e("span", { className: "rd-step-state " + state }, txt),
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
        e("div", { className: "rd-top", style: { background: st.color } },
          e("div", { className: "rd-top-l" },
            e("span", { className: "rd-num" }, "N°" + item.num),
            e("span", { className: "rd-status" }, st.label),
          ),
          e("button", { className: "detail-x", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "rd-body" },
          e("h2", { className: "rd-title" }, item.propiedad || "—"),
          e("div", { className: "rd-meta" },
            item.responsable ? e("div", { className: "rd-meta-i" },
              e("span", { className: "rc-avatar lg", style: { background: item.respColor } }, item.respInit),
              e("div", null, e("div", { className: "rd-meta-lbl" }, "Responsable"), e("b", null, item.responsable))) : null,
            item.fecha ? e("div", { className: "rd-meta-i" },
              e("span", { className: "rd-meta-ico" }, e(I.Calendar, { width: 17, height: 17 })),
              e("div", null, e("div", { className: "rd-meta-lbl" }, "Ingreso"), e("b", null, item.fecha))) : null,
            item.valor ? e("div", { className: "rd-meta-i" },
              e("span", { className: "rd-meta-ico" }, e(I.Coins, { width: 17, height: 17 })),
              e("div", null, e("div", { className: "rd-meta-lbl" }, "Valor"), e("b", null, item.valor))) : null,
          ),
          (item.owner || item.phone) ? e("div", { className: "rd-owner" },
            e("span", { className: "rd-meta-ico" }, e(I.User, { width: 17, height: 17 })),
            e("div", null,
              e("div", { className: "rd-meta-lbl" }, "Propietario"),
              e("b", null, item.owner || "—"),
              item.phone ? e("a", { className: "rd-phone", href: "tel:" + item.phone.replace(/\s/g, "") }, e(I.Phone, { width: 13, height: 13 }), item.phone) : null,
            ),
          ) : null,
          (item.superficie || item.idPublicacion) ? e("div", { className: "rd-meta" },
            item.superficie ? e("div", { className: "rd-meta-i" },
              e("span", { className: "rd-meta-ico" }, e(I.Building, { width: 17, height: 17 })),
              e("div", null, e("div", { className: "rd-meta-lbl" }, "Superficie"), e("b", null, item.superficie))) : null,
            item.idPublicacion ? e("div", { className: "rd-meta-i" },
              e("span", { className: "rd-meta-ico" }, e(I.Tag, { width: 17, height: 17 })),
              e("div", null, e("div", { className: "rd-meta-lbl" }, "ID publicación"), e("b", null, item.idPublicacion))) : null,
          ) : null,
          item.notas ? e("div", { className: "rd-notas" },
            e("span", { className: "rd-meta-ico" }, e(I.FileText, { width: 17, height: 17 })),
            e("div", null, e("div", { className: "rd-meta-lbl" }, "Notas"), e("p", null, item.notas)),
          ) : null,
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

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", onMouseDown: (e2) => e2.stopPropagation() },
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

