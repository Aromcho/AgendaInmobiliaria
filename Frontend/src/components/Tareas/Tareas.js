'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import { getLinkPreview } from '@/services/api';
import './Tareas.css';
/* Tablero de Tareas (kanban) -> window.Tareas.Board */

  const e = React.createElement;
  const { useState, useRef, useEffect } = React;
  const C = CAL;
  const I = Icons;
  const { Avatar, TYPE_ICON } = UI;

  // ---------- Confetti (al completar una tarea) ----------
  const CONFETTI_COLORS = ['#15784f', '#2563eb', '#b8791b', '#7257c9', '#0e8a8a'];
  function makeConfetti(n = 16) {
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n + (Math.random() * 0.6 - 0.3);
      const dist = 36 + Math.random() * 44;
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist - 12}px`,
        rot: `${Math.round(Math.random() * 540 - 270)}deg`,
        delay: `${(Math.random() * 0.08).toFixed(2)}s`,
      };
    });
  }
  function Confetti({ onDone }) {
    const piecesRef = useRef(null);
    if (!piecesRef.current) piecesRef.current = makeConfetti();
    useEffect(() => {
      const t = setTimeout(onDone, 950);
      return () => clearTimeout(t);
    }, [onDone]);
    return e("div", { className: "confetti-burst" },
      piecesRef.current.map((p) => e("span", {
        key: p.id,
        className: "confetti-piece",
        style: { "--c-color": p.color, "--c-tx": p.tx, "--c-ty": p.ty, "--c-rot": p.rot, "--c-delay": p.delay },
      })),
    );
  }

  function fmtDue(s) {
    if (!s) return null;
    const d = C.parse(s + "T00:00:00");
    return `${d.getDate()} ${C.MONTHS_SHORT[d.getMonth()]}`;
  }
  function dueState(s) {
    if (!s) return "";
    const diff = C.dayDiff(C.TODAY, C.parse(s + "T00:00:00"));
    if (diff < 0) return "past";
    if (diff <= 2) return "soon";
    return "";
  }
  function extractUrl(text) {
    if (!text) return null;
    const m = String(text).match(/(https?:\/\/[^\s<>"']+)/i);
    return m ? m[0] : null;
  }
  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  }

  // Vista previa de link en vivo (mientras se escribe la descripción)
  function useLinkPreview(text) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      const url = extractUrl(text);
      if (!url) { setPreview(null); setLoading(false); return; }
      let active = true;
      setLoading(true);
      const t = setTimeout(() => {
        getLinkPreview(url).then((data) => {
          if (!active) return;
          setPreview(data);
          setLoading(false);
        }).catch(() => { if (active) setLoading(false); });
      }, 600);
      return () => { active = false; clearTimeout(t); };
    }, [text]);
    return { preview, loading };
  }

  function LinkPreviewCard({ preview, compact }) {
    if (!preview) return null;
    return e("a", {
      className: "link-preview" + (compact ? " sm" : ""),
      href: preview.url, target: "_blank", rel: "noreferrer",
      onClick: (ev) => ev.stopPropagation(),
      onMouseDown: (ev) => ev.stopPropagation(),
    },
      preview.image
        ? e("img", { className: "lp-img", src: preview.image, alt: "" })
        : e("span", { className: "lp-img lp-img-empty" }, e(I.ExternalLink, { width: 18, height: 18 })),
      e("div", { className: "lp-body" },
        e("span", { className: "lp-title" }, preview.title || preview.url),
        e("span", { className: "lp-domain" }, hostOf(preview.url)),
      ),
    );
  }

  // ---------- Tarjeta ----------
  function Card({ card, listId, onDragStart, onDelCard, onEditCard, dimMatch, anim, onAnimEnd }) {
    const t = card.type ? C.EVENT_TYPES[card.type] : null;
    const ag = C.agentById(card.agentId);
    const Ico = card.type ? TYPE_ICON[card.type] : null;
    const ds = dueState(card.due);
    return e("div", {
      className: "task-card" + (dimMatch ? " dim" : "") + (anim ? ` card-anim-${anim}` : ""),
      draggable: true,
      onDragStart: (ev) => onDragStart(ev, listId, card.id),
      onAnimationEnd: anim && anim !== "done" ? () => onAnimEnd(card.id) : undefined,
    },
      anim === "done" ? e(Confetti, { onDone: () => onAnimEnd(card.id) }) : null,
      t ? e("span", { className: "tc-accent", style: { background: t.color } }) : null,
      card.tag ? e("span", { className: "tc-tag", style: t ? { color: t.ink, background: t.bg } : null },
        Ico ? e(Ico, { width: 12, height: 12 }) : null, card.tag) : null,
      e("p", { className: "tc-text" }, card.title),
      card.description ? e("p", { className: "tc-desc" }, card.description) : null,
      card.linkPreview ? e(LinkPreviewCard, { preview: card.linkPreview, compact: true }) : null,
      e("div", { className: "tc-foot" },
        card.due ? e("span", { className: "tc-due " + ds }, e(I.Clock, { width: 13, height: 13 }), fmtDue(card.due)) : e("span", null),
        ag ? e(Avatar, { agent: ag, size: 24 }) : null,
      ),
      e("div", { className: "tc-actions" },
        e("button", { className: "tc-act", title: "Editar", onClick: () => onEditCard(listId, card) }, e(I.Edit, { width: 13, height: 13 })),
        e("button", { className: "tc-act danger", title: "Eliminar", onClick: () => onDelCard(listId, card.id) }, e(I.Close, { width: 13, height: 13 })),
      ),
    );
  }

  // ---------- Columna ----------
  function Column({ list, onDragStart, onDrop, onDragOverList, dragOverId, onAddCard, onDelCard, onEditCard, query, cardAnim, onAnimEnd }) {
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [showDesc, setShowDesc] = useState(false);
    const titleRef = useRef(null);
    const { preview, loading } = useLinkPreview(desc);

    function submit() {
      const t = title.trim();
      if (!t) return;
      onAddCard(list.id, { title: t, description: desc.trim() });
      setTitle(""); setDesc(""); setShowDesc(false); setAdding(false);
    }
    function cancel() { setTitle(""); setDesc(""); setShowDesc(false); setAdding(false); }

    const q = query.trim().toLowerCase();
    return e("div", {
      className: "column" + (dragOverId === list.id ? " over" : ""),
      onDragOver: (ev) => { ev.preventDefault(); onDragOverList(list.id); },
      onDrop: (ev) => onDrop(ev, list.id),
    },
      e("div", { className: "col-head" },
        e("span", { className: "col-accent", style: { background: list.accent || "#15784f" } }),
        e("h3", { className: "col-title" }, list.title),
        e("span", { className: "col-count" }, list.cards.length),
      ),
      e("div", { className: "col-body" },
        list.cards.map((c) => {
          const dim = q && !(c.title + " " + (c.description || "") + " " + (c.tag || "")).toLowerCase().includes(q);
          return e(Card, {
            key: c.id, card: c, listId: list.id, onDragStart, onDelCard, onEditCard, dimMatch: dim,
            anim: cardAnim && cardAnim[c.id], onAnimEnd,
          });
        }),
        adding
          ? e("div", { className: "add-card-box" },
              e("input", { ref: titleRef, value: title, autoFocus: true,
                placeholder: "Título de la tarea…",
                onChange: (ev) => setTitle(ev.target.value),
                onKeyDown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); submit(); } if (ev.key === "Escape") cancel(); } }),
              showDesc
                ? e("textarea", { value: desc, rows: 2, autoFocus: true,
                    placeholder: "Descripción opcional… podés pegar un link",
                    onChange: (ev) => setDesc(ev.target.value),
                    onKeyDown: (ev) => { if (ev.key === "Escape") cancel(); } })
                : e("button", { type: "button", className: "add-desc-toggle", onClick: () => setShowDesc(true) },
                    e(I.Plus, { width: 12, height: 12 }), "Agregar descripción o link"),
              preview ? e(LinkPreviewCard, { preview, compact: true }) : (loading ? e("span", { className: "lp-loading" }, "Cargando vista previa…") : null),
              e("div", { className: "add-card-actions" },
                e("button", { className: "btn primary sm", onClick: submit }, "Agregar"),
                e("button", { className: "btn ghost sm", onClick: cancel }, "Cancelar"),
              ),
            )
          : e("button", { className: "add-card-btn", onClick: () => setAdding(true) }, e(I.Plus, { width: 15, height: 15 }), "Añadir tarjeta"),
      ),
    );
  }

  // ---------- Nueva columna ----------
  function AddListColumn({ onAddList }) {
    const [adding, setAdding] = useState(false);
    const [val, setVal] = useState("");

    function submit() {
      const v = val.trim();
      if (v) onAddList(v);
      setVal(""); setAdding(false);
    }

    if (!adding) {
      return e("div", { className: "add-list" },
        e("button", { className: "add-list-btn", onClick: () => setAdding(true) },
          e(I.Plus, { width: 15, height: 15 }), "Crear lista"));
    }
    return e("div", { className: "add-list" },
      e("div", { className: "add-list-box" },
        e("input", { value: val, autoFocus: true, placeholder: "Nombre de la lista…",
          onChange: (ev) => setVal(ev.target.value),
          onKeyDown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); submit(); } if (ev.key === "Escape") { setVal(""); setAdding(false); } } }),
        e("div", { className: "add-card-actions" },
          e("button", { className: "btn primary sm", onClick: submit }, "Crear"),
          e("button", { className: "btn ghost sm", onClick: () => { setVal(""); setAdding(false); } }, "Cancelar"),
        ),
      ),
    );
  }

  // ---------- Tablero ----------
  function Board({ lists, query, onAddCard, onDelCard, onEditCard, onMoveCard, onAddList, cardAnim, onAnimEnd }) {
    const [dragOverId, setDragOverId] = useState(null);
    const drag = useRef(null); // {fromList, cardId}

    function onDragStart(ev, listId, cardId) {
      drag.current = { fromList: listId, cardId };
      ev.dataTransfer.effectAllowed = "move";
      try { ev.dataTransfer.setData("text/plain", cardId); } catch (e2) {}
      ev.currentTarget.classList.add("dragging");
    }
    function onDrop(ev, toListId) {
      ev.preventDefault();
      setDragOverId(null);
      document.querySelectorAll(".task-card.dragging").forEach((n) => n.classList.remove("dragging"));
      const d = drag.current; drag.current = null;
      if (!d) return;
      const next = lists.map((l) => ({ ...l, cards: l.cards.slice() }));
      const from = next.find((l) => l.id === d.fromList);
      const to = next.find((l) => l.id === toListId);
      if (!from || !to) return;
      const idx = from.cards.findIndex((c) => c.id === d.cardId);
      if (idx < 0) return;
      const [card] = from.cards.splice(idx, 1);
      // insertar según la posición del cursor
      const colBody = ev.currentTarget.querySelector(".col-body");
      let insertAt = to.cards.length;
      if (colBody) {
        const cards = [...colBody.querySelectorAll(".task-card:not(.dragging)")];
        for (let i = 0; i < cards.length; i++) {
          const r = cards[i].getBoundingClientRect();
          if (ev.clientY < r.top + r.height / 2) { insertAt = i; break; }
        }
      }
      to.cards.splice(insertAt, 0, { ...card, listId: toListId });

      const touched = from.id === to.id ? [to] : [from, to];
      const updates = [];
      touched.forEach((l) => {
        l.cards.forEach((c, i) => { c.position = i; updates.push({ id: c.id, listId: l.id, position: i }); });
      });
      onMoveCard(next, updates, { cardId: d.cardId, fromListId: d.fromList, toListId });
    }

    return e("div", { className: "board" },
      lists.map((l) => e(Column, {
        key: l.id, list: l, query,
        onDragStart, onDrop, onDragOverList: setDragOverId, dragOverId,
        onAddCard, onDelCard, onEditCard, cardAnim, onAnimEnd,
      })),
      e(AddListColumn, { onAddList }),
    );
  }

  // ---------- Modal de edición ----------
  function TaskForm({ initial, onClose, onSave, onDelete }) {
    const card = initial.card;
    const [title, setTitle] = useState(card.title || "");
    const [desc, setDesc] = useState(card.description || "");
    const { preview, loading } = useLinkPreview(desc);

    function save() {
      const t = title.trim();
      if (!t) return;
      onSave({ id: card.id, title: t, description: desc.trim() });
    }

    return e("div", { className: "modal-scrim", onMouseDown: onClose },
      e("div", { className: "form", style: { width: 480 }, onMouseDown: (e2) => e2.stopPropagation() },
        e("div", { className: "form-head" },
          e("h2", null, "Editar tarea"),
          e("button", { className: "detail-x dark", onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e("div", { className: "form-body" },
          e("div", { className: "fg" },
            e("label", null, "Título"),
            e("input", { value: title, autoFocus: true, onChange: (ev) => setTitle(ev.target.value) }),
          ),
          e("div", { className: "fg" },
            e("label", null, "Descripción"),
            e("textarea", { value: desc, rows: 4, placeholder: "Detalles, link de la propiedad…", onChange: (ev) => setDesc(ev.target.value) }),
          ),
          preview ? e(LinkPreviewCard, { preview }) : (loading ? e("span", { className: "lp-loading" }, "Cargando vista previa…") : null),
        ),
        e("div", { className: "form-actions" },
          e("button", { className: "btn ghost danger", onClick: () => onDelete(initial.listId, card.id) }, e(I.Trash, { width: 16, height: 16 }), "Eliminar"),
          e("div", { className: "spacer", style: { flex: 1 } }),
          e("button", { className: "btn ghost", onClick: onClose }, "Cancelar"),
          e("button", { className: "btn primary", onClick: save }, e(I.Check, { width: 16, height: 16 }), "Guardar"),
        ),
      ),
    );
  }

  export { Board, TaskForm };
