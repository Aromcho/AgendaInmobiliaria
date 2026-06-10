'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from './Icons';
import * as UI from './ui';
/* Tablero de Tareas (kanban) -> window.Tareas.Board */

  const e = React.createElement;
  const { useState, useRef } = React;
  const C = CAL;
  const I = Icons;
  const { Avatar, TYPE_ICON } = UI;

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

  // ---------- Tarjeta ----------
  function Card({ card, listId, onDragStart, onOpenMenu, dimMatch }) {
    const t = card.type ? C.EVENT_TYPES[card.type] : null;
    const ag = C.agentById(card.agentId);
    const Ico = card.type ? TYPE_ICON[card.type] : null;
    const ds = dueState(card.due);
    return e("div", {
      className: "task-card" + (dimMatch ? " dim" : ""),
      draggable: true,
      onDragStart: (ev) => onDragStart(ev, listId, card.id),
    },
      t ? e("span", { className: "tc-accent", style: { background: t.color } }) : null,
      card.tag ? e("span", { className: "tc-tag", style: t ? { color: t.ink, background: t.bg } : null },
        Ico ? e(Ico, { width: 12, height: 12 }) : null, card.tag) : null,
      e("p", { className: "tc-text" }, card.text),
      e("div", { className: "tc-foot" },
        card.due ? e("span", { className: "tc-due " + ds }, e(I.Clock, { width: 13, height: 13 }), fmtDue(card.due)) : e("span", null),
        ag ? e(Avatar, { agent: ag, size: 24 }) : null,
      ),
      e("button", { className: "tc-del", title: "Eliminar", onClick: () => onOpenMenu(listId, card.id) }, e(I.Close, { width: 13, height: 13 })),
    );
  }

  // ---------- Columna ----------
  function Column({ list, onDragStart, onDrop, onDragOverList, dragOverId, onAddCard, onDelCard, query }) {
    const [adding, setAdding] = useState(false);
    const [val, setVal] = useState("");
    const inputRef = useRef(null);

    function submit() {
      const v = val.trim();
      if (v) onAddCard(list.id, v);
      setVal(""); setAdding(false);
    }

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
          const dim = q && !(c.text + " " + (c.tag || "")).toLowerCase().includes(q);
          return e(Card, { key: c.id, card: c, listId: list.id, onDragStart, onOpenMenu: onDelCard, dimMatch: dim });
        }),
        adding
          ? e("div", { className: "add-card-box" },
              e("textarea", { ref: inputRef, value: val, autoFocus: true, rows: 2,
                placeholder: "Escribí la tarea…",
                onChange: (ev) => setVal(ev.target.value),
                onKeyDown: (ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); submit(); } if (ev.key === "Escape") { setVal(""); setAdding(false); } } }),
              e("div", { className: "add-card-actions" },
                e("button", { className: "btn primary sm", onClick: submit }, "Agregar"),
                e("button", { className: "btn ghost sm", onClick: () => { setVal(""); setAdding(false); } }, "Cancelar"),
              ),
            )
          : e("button", { className: "add-card-btn", onClick: () => setAdding(true) }, e(I.Plus, { width: 15, height: 15 }), "Añadir tarjeta"),
      ),
    );
  }

  // ---------- Tablero ----------
  function Board({ lists, query, onAddCard, onDelCard, onMoveCard }) {
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
      onMoveCard(next, updates);
    }

    return e("div", { className: "board" },
      lists.map((l) => e(Column, {
        key: l.id, list: l, query,
        onDragStart, onDrop, onDragOverList: setDragOverId, dragOverId,
        onAddCard, onDelCard,
      })),
    );
  }

  export { Board };
