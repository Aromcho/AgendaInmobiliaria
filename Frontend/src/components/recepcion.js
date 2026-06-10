'use client';
import React from 'react';
import { RECEP } from '@/lib/recepcionData';
import Icons from './Icons';
/* Vista Recepción de Propiedades -> window.RecepView */

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
          const hay = [it.propiedad, it.owner, it.responsable, it.valor, it.num].filter(Boolean).join(" ").toLowerCase();
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

  function RecepDetail({ item, onClose }) {
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
          e("div", { className: "rd-steps-head" },
            e("span", null, "Estado de recepción"),
            e("span", { className: "rd-prog-pill", style: { color: st.color, background: st.bg } }, `${pr.done} de ${pr.total} pasos`),
          ),
          e("div", { className: "rd-steps" }, R.STEPS.map((s) => e(StepRow, { key: s.key, stepKey: s.key, item }))),
          item.link ? e("a", { className: "rd-link", href: item.link, target: "_blank", rel: "noopener" },
            e(I.ExternalLink, { width: 16, height: 16 }), "Ver publicación online") : null,
        ),
      ),
    );
  }

  export { RecepView, RecepDetail, progress };

