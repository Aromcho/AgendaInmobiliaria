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
  const { Avatar, TYPE_ICON, Confetti } = UI;

  // ---------- Foto adjunta (se achica en el navegador antes de subir) ----------
  function resizeImageFile(file, maxW = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Color de acento ----------
  function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return { r: 21, g: 120, b: 79 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function tint(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ---------- Paleta de colores de tarjeta ----------
  const TASK_COLORS = [
    '#15784f', '#2563eb', '#b8791b', '#7257c9', '#0e8a8a',
    '#d8504a', '#c2861a', '#0a5e5e', '#9d4edd', '#e85d75',
  ];
  const ASSIGNED_COLOR = '#9d4edd'; // color fijo para tareas que te asignó otra persona

  function ColorPicker({ value, onPick, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
      const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [onClose]);
    return e("div", { className: "color-pop", ref, onMouseDown: (ev) => ev.stopPropagation(), onClick: (ev) => ev.stopPropagation() },
      TASK_COLORS.map((c) => e("button", {
        key: c, type: "button", title: "Elegir este color",
        className: "color-swatch" + (value === c ? " on" : ""),
        style: { background: c },
        onClick: () => { onPick(c); onClose(); },
      })),
      e("button", {
        type: "button", title: "Sin color personalizado",
        className: "color-swatch clear" + (!value ? " on" : ""),
        onClick: () => { onPick(""); onClose(); },
      }, e(I.Close, { width: 11, height: 11 })),
    );
  }

  // ---------- Paleta de emojis de tarjeta ----------
  const TASK_EMOJIS = [
    '🏠', '🏡', '🔑', '🏢', '📋', '✅', '📞', '💰', '📸', '📝',
    '⏰', '🎯', '🚗', '📅', '🔥', '💡', '⭐', '🎉', '👍', '📦',
    '🧹', '🛠️', '📌', '💬', '👀', '🏖️', '✈️', '🐾', '🍀', '☀️',
  ];
  function EmojiPicker({ value, onPick, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
      const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [onClose]);
    return e("div", { className: "emoji-pop", ref, onMouseDown: (ev) => ev.stopPropagation(), onClick: (ev) => ev.stopPropagation() },
      TASK_EMOJIS.map((em) => e("button", {
        key: em, type: "button",
        className: "emoji-swatch" + (value === em ? " on" : ""),
        onClick: () => { onPick(em); onClose(); },
      }, em)),
      e("button", {
        type: "button", title: "Sin emoji",
        className: "emoji-swatch clear" + (!value ? " on" : ""),
        onClick: () => { onPick(""); onClose(); },
      }, e(I.Close, { width: 11, height: 11 })),
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
  function Card({ card, listId, accent, onDragStart, onDelCard, onEditCard, onColorCard, onEmojiCard, onImageCard, currentUserId, dimMatch, anim, onAnimEnd }) {
    const t = card.type ? C.EVENT_TYPES[card.type] : null;
    const ag = C.agentById(card.agentId);
    const Ico = card.type ? TYPE_ICON[card.type] : null;
    const ds = dueState(card.due);
    const assignedByOther = !!card.assignedBy && card.assignedBy !== currentUserId;
    const ac = card.color || (assignedByOther ? ASSIGNED_COLOR : accent) || "#15784f";
    const [openPicker, setOpenPicker] = useState(null); // null | "color" | "emoji"
    const fileRef = useRef(null);
    async function onPickImage(ev) {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      if (!file) return;
      const dataUrl = await resizeImageFile(file);
      onImageCard(listId, card.id, dataUrl);
    }
    const cardRef = useRef(null);
    const [confettiPos, setConfettiPos] = useState(null);

    useEffect(() => {
      if (anim === "done" && cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setConfettiPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else if (anim !== "done") {
        setConfettiPos(null);
      }
    }, [anim]);

    const cardEl = e("div", {
      ref: cardRef,
      className: "task-card" + (dimMatch ? " dim" : "") + (assignedByOther ? " assigned" : "")
        + (ds ? ` due-${ds}` : "") + (anim ? ` card-anim-${anim}` : ""),
      draggable: true,
      style: {
        "--tc-accent": ac,
        "--tc-bg": tint(ac, 0.07),
        "--tc-bg-hover": tint(ac, 0.14),
        "--tc-glow": tint(ac, 0.32),
      },
      onDragStart: (ev) => onDragStart(ev, listId, card.id),
      onAnimationEnd: anim && anim !== "done" ? () => onAnimEnd(card.id) : undefined,
      onClick: () => onEditCard(listId, card),
    },
      card.image ? e("div", { className: "tc-photo-wrap" },
        e("img", { className: "tc-photo", src: card.image, alt: "" }),
        e("button", {
          className: "tc-photo-del", title: "Quitar foto",
          onClick: (ev) => { ev.stopPropagation(); onImageCard(listId, card.id, ""); },
        }, e(I.Close, { width: 12, height: 12 })),
      ) : null,
      card.tag ? e("span", { className: "tc-tag", style: t ? { color: t.ink, background: t.bg } : null },
        Ico ? e(Ico, { width: 12, height: 12 }) : null, card.tag) : null,
      e("p", { className: "tc-text" },
        assignedByOther ? e("span", {
          style: { display: "inline-flex", verticalAlign: "middle", marginRight: 6 },
          title: `Asignada por ${card.assignedByName}`,
        }, e(Avatar, { agent: { email: card.assignedByEmail, name: card.assignedByName }, size: 19 })) : null,
        card.emoji ? e("span", { className: "tc-emoji-ico" }, card.emoji) : null,
        card.title),
      card.description ? e("p", { className: "tc-desc" }, card.description) : null,
      card.linkPreview ? e(LinkPreviewCard, { preview: card.linkPreview, compact: true }) : null,
      e("div", { className: "tc-foot" },
        card.due ? e("span", { className: "tc-due " + ds },
          ds ? e("span", { className: "due-dot " + ds }) : e(I.Clock, { width: 13, height: 13 }),
          fmtDue(card.due)) : e("span", null),
        ag ? e(Avatar, { agent: ag, size: 27 }) : null,
      ),
      e("div", { className: "tc-actions", onClick: (ev) => ev.stopPropagation() },
        e("button", { className: "tc-act", title: "Emoji de la tarjeta", onClick: () => setOpenPicker((o) => (o === "emoji" ? null : "emoji")) },
          card.emoji ? e("span", { className: "tc-emoji-mini" }, card.emoji) : e(I.Plus, { width: 15, height: 15 })),
        e("button", { className: "tc-act", title: "Color de la tarjeta", onClick: () => setOpenPicker((o) => (o === "color" ? null : "color")) },
          e("span", { className: "tc-color-dot", style: { background: ac } })),
        e("button", { className: "tc-act", title: "Foto de la tarjeta", onClick: () => fileRef.current && fileRef.current.click() },
          e(I.Camera, { width: 16, height: 16 })),
        e("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onPickImage }),
        e("button", { className: "tc-act", title: "Editar", onClick: () => onEditCard(listId, card) }, e(I.Edit, { width: 16, height: 16 })),
        e("button", { className: "tc-act danger", title: "Eliminar", onClick: () => onDelCard(listId, card.id) }, e(I.Close, { width: 16, height: 16 })),
      ),
      openPicker === "color" ? e(ColorPicker, {
        value: card.color || "",
        onPick: (c) => onColorCard(listId, card.id, c),
        onClose: () => setOpenPicker(null),
      }) : null,
      openPicker === "emoji" ? e(EmojiPicker, {
        value: card.emoji || "",
        onPick: (em) => onEmojiCard(listId, card.id, em),
        onClose: () => setOpenPicker(null),
      }) : null,
    );

    // Confetti (UI.Confetti se manda solo por portal al <body>): explota libre, sin scroll
    // dentro de la columna ni quedar recortado por el contenedor de la tarjeta.
    return e(React.Fragment, null,
      cardEl,
      anim === "done" && confettiPos
        ? e(Confetti, { x: confettiPos.x, y: confettiPos.y, onDone: () => onAnimEnd(card.id) })
        : null,
    );
  }

  // ---------- Columna ----------
  function Column({ list, onDragStart, onDrop, onDragOverList, dragOverId, onAddCard, onDelCard, onEditCard, onColorCard, onEmojiCard, onImageCard, currentUserId, query, cardAnim, onAnimEnd }) {
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
            key: c.id, card: c, listId: list.id, accent: list.accent, onDragStart, onDelCard, onEditCard, onColorCard, onEmojiCard, onImageCard,
            currentUserId, dimMatch: dim, anim: cardAnim && cardAnim[c.id], onAnimEnd,
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
          e(I.Plus, { width: 15, height: 15 }), "Recordatorio"));
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
  function Board({ lists, query, onAddCard, onDelCard, onEditCard, onColorCard, onEmojiCard, onImageCard, onMoveCard, onAddList, currentUserId, cardAnim, onAnimEnd }) {
    const [dragOverId, setDragOverId] = useState(null);
    const drag = useRef(null); // {fromList, cardId}
    const boardRef = useRef(null);
    const autoScroll = useRef({ raf: null, dir: 0, speed: 0 });

    // ---- Auto-scroll horizontal del tablero al arrastrar cerca de un borde ----
    const EDGE = 70; // px desde el borde donde empieza a scrollear
    const MAX_SPEED = 16; // px por frame, al borde mismo

    function stepAutoScroll() {
      const el = boardRef.current;
      const a = autoScroll.current;
      if (!el || !a.dir) { a.raf = null; return; }
      el.scrollLeft += a.dir * a.speed;
      a.raf = requestAnimationFrame(stepAutoScroll);
    }
    function stopAutoScroll() {
      const a = autoScroll.current;
      if (a.raf) cancelAnimationFrame(a.raf);
      a.raf = null; a.dir = 0; a.speed = 0;
      if (boardRef.current) boardRef.current.style.scrollBehavior = "";
    }
    function onBoardDragOver(ev) {
      const el = boardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distLeft = ev.clientX - rect.left;
      const distRight = rect.right - ev.clientX;
      const a = autoScroll.current;
      let dir = 0, speed = 0;
      if (distLeft < EDGE) { dir = -1; speed = MAX_SPEED * (1 - Math.max(distLeft, 0) / EDGE); }
      else if (distRight < EDGE) { dir = 1; speed = MAX_SPEED * (1 - Math.max(distRight, 0) / EDGE); }
      a.dir = dir; a.speed = speed;
      if (dir) {
        el.style.scrollBehavior = "auto"; // evitar que el "smooth" del CSS frene el auto-scroll
        if (!a.raf) a.raf = requestAnimationFrame(stepAutoScroll);
      } else {
        stopAutoScroll();
      }
    }
    useEffect(() => {
      window.addEventListener("dragend", stopAutoScroll);
      return () => { window.removeEventListener("dragend", stopAutoScroll); stopAutoScroll(); };
    }, []);

    function onDragStart(ev, listId, cardId) {
      drag.current = { fromList: listId, cardId };
      ev.dataTransfer.effectAllowed = "move";
      try { ev.dataTransfer.setData("text/plain", cardId); } catch (e2) {}
      ev.currentTarget.classList.add("dragging");
    }
    function onDrop(ev, toListId) {
      ev.preventDefault();
      stopAutoScroll();
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

    return e("div", { className: "board", ref: boardRef, onDragOver: onBoardDragOver, onDragLeave: stopAutoScroll, onDrop: stopAutoScroll },
      lists.map((l) => e(Column, {
        key: l.id, list: l, query,
        onDragStart, onDrop, onDragOverList: setDragOverId, dragOverId,
        onAddCard, onDelCard, onEditCard, onColorCard, onEmojiCard, onImageCard, currentUserId, cardAnim, onAnimEnd,
      })),
      e(AddListColumn, { onAddList }),
    );
  }

  // ---------- Modal de edición ----------
  function TaskForm({ initial, onClose, onSave, onDelete }) {
    const card = initial.card;
    const [title, setTitle] = useState(card.title || "");
    const [desc, setDesc] = useState(card.description || "");
    const [color, setColor] = useState(card.color || "");
    const [emoji, setEmoji] = useState(card.emoji || "");
    const [image, setImage] = useState(card.image || "");
    const fileRef = useRef(null);
    const { preview, loading } = useLinkPreview(desc);

    function save() {
      const t = title.trim();
      if (!t) return;
      onSave({ id: card.id, title: t, description: desc.trim(), color, emoji, image });
    }
    async function onPickImage(ev) {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      if (!file) return;
      setImage(await resizeImageFile(file));
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
          e("div", { className: "fg" },
            e("label", null, "Color de la tarjeta"),
            e("div", { className: "color-pop inline" },
              TASK_COLORS.map((c) => e("button", {
                key: c, type: "button", className: "color-swatch" + (color === c ? " on" : ""),
                style: { background: c }, onClick: () => setColor(c),
              })),
              e("button", {
                type: "button", title: "Sin color personalizado",
                className: "color-swatch clear" + (!color ? " on" : ""),
                onClick: () => setColor(""),
              }, e(I.Close, { width: 11, height: 11 })),
            ),
          ),
          e("div", { className: "fg" },
            e("label", null, "Emoji de la tarjeta"),
            e("div", { className: "emoji-pop inline" },
              TASK_EMOJIS.map((em) => e("button", {
                key: em, type: "button", className: "emoji-swatch" + (emoji === em ? " on" : ""),
                onClick: () => setEmoji(em),
              }, em)),
              e("button", {
                type: "button", title: "Sin emoji",
                className: "emoji-swatch clear" + (!emoji ? " on" : ""),
                onClick: () => setEmoji(""),
              }, e(I.Close, { width: 11, height: 11 })),
            ),
          ),
          e("div", { className: "fg" },
            e("label", null, "Foto de la tarjeta"),
            image ? e("div", { className: "tc-photo-wrap form-photo" },
              e("img", { className: "tc-photo", src: image, alt: "" }),
              e("button", { className: "tc-photo-del", title: "Quitar foto", onClick: () => setImage("") }, e(I.Close, { width: 12, height: 12 })),
            ) : null,
            e("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onPickImage }),
            e("button", {
              type: "button", className: "btn ghost sm", onClick: () => fileRef.current && fileRef.current.click(),
            }, e(I.Camera, { width: 14, height: 14 }), image ? "Cambiar foto" : "Agregar foto"),
          ),
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
