'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import { getPropertyPreview } from '@/services/api';
import './Clientes.css';
/* Seguimiento de clientes -> cartelera de leads del equipo (tarjetas + buscador + detalle editable) */

  const e = React.createElement;
  const { useState, useMemo, useEffect } = React;
  const C = CAL;
  const I = Icons;
  const { Avatar, ColorPicker, EmojiPicker, EditableField, TitleField } = UI;

  const CLIENT_EMOJIS = ['🙂', '😊', '🤝', '⭐', '🏡', '🔑', '🌟', '🐾', '☀️', '💚', '🎯', '🚀'];
  function emojiFor(seed) {
    const s = String(seed || '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return CLIENT_EMOJIS[hash % CLIENT_EMOJIS.length];
  }

  // Oscurece un color hex un % dado, para el degradé del header del detalle
  function darken(hex, amt) {
    const clean = String(hex || '').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return hex;
    const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
    const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
    const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function fmtFecha(s) {
    if (!s) return '';
    const d = C.parse(s + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return s;
    return `${d.getDate()} ${C.MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Normaliza un ítem de "¿Qué le ofrecí?": soporta tanto el objeto nuevo
  // { text, propertyRef, propertyPreview } como el texto suelto viejo
  function normalizeOffer(item) {
    if (item && typeof item === 'object') {
      return { text: item.text || '', propertyRef: item.propertyRef || '', propertyPreview: item.propertyPreview || null };
    }
    return { text: typeof item === 'string' ? item : '', propertyRef: '', propertyPreview: null };
  }

  function toOfferList(v) {
    if (Array.isArray(v)) return v.map(normalizeOffer).filter((o) => o.text || o.propertyRef);
    if (typeof v === 'string' && v.trim()) return [normalizeOffer(v.trim())];
    return [];
  }

  // Si lo que se pegó es un link o un ID de propiedad, devuelve una etiqueta corta
  // ("ID 45231") para mostrar en vez del link completo, más la referencia original
  // (para poder resolver la vista previa). Si es texto libre, devuelve null.
  function extractPropertyToken(str) {
    const trimmed = String(str || '').trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return { label: `ID ${trimmed}`, ref: trimmed };
    if (/^https?:\/\//i.test(trimmed)) {
      const idMatch = trimmed.match(/(\d{3,})/);
      if (idMatch) return { label: `ID ${idMatch[1]}`, ref: trimmed };
      try { return { label: '🔗 ' + new URL(trimmed).hostname.replace(/^www\./, ''), ref: trimmed }; } catch { return null; }
    }
    return null;
  }

  // Reemplaza el texto pegado (si es un link/ID) por su etiqueta corta, dejando
  // intacto el texto libre que ya estaba escrito alrededor
  function applyPasteToken(text, selStart, selEnd, pasted) {
    const token = extractPropertyToken(pasted);
    if (!token) return null;
    const before = text.slice(0, selStart);
    const after = text.slice(selEnd);
    return { text: before + token.label + after, ref: token.ref };
  }

  function waLink(phone, cliente) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const msg = encodeURIComponent(`¡Hola ${cliente || ''}! 👋 Te escribo de Silvia Fernández Inmobiliaria.`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  }

  // Vista previa en vivo de la propiedad anclada (mientras se escribe/pega el link o ID)
  function usePropertyPreview(ref, active) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      if (!active) { setPreview(null); setLoading(false); return; }
      const val = String(ref || '').trim();
      if (!val) { setPreview(null); setLoading(false); return; }
      let alive = true;
      setLoading(true);
      const t = setTimeout(() => {
        getPropertyPreview(val).then((data) => {
          if (!alive) return;
          setPreview(data);
          setLoading(false);
        }).catch(() => { if (alive) setLoading(false); });
      }, 600);
      return () => { alive = false; clearTimeout(t); };
    }, [ref, active]);
    return { preview, loading };
  }

  // Tarjeta clickeable con la imagen de portada de la propiedad anclada
  function PropertyPreviewCard({ preview, compact }) {
    if (!preview) return null;
    return e('a', {
      className: 'link-preview' + (compact ? ' sm' : ''),
      href: preview.url, target: '_blank', rel: 'noreferrer',
      onClick: (ev) => ev.stopPropagation(),
      onMouseDown: (ev) => ev.stopPropagation(),
    },
      preview.image
        ? e('img', { className: 'lp-img', src: preview.image, alt: '' })
        : e('span', { className: 'lp-img lp-img-empty' }, e(I.ExternalLink, { width: 18, height: 18 })),
      e('div', { className: 'lp-body' },
        e('span', { className: 'lp-title' }, preview.title || preview.url),
        e('span', { className: 'lp-domain' }, hostOf(preview.url)),
      ),
    );
  }

  // ---------- Tarjeta ----------
  function ClientCard({ item, index, onOpen, onDelete, onColor, onEmoji }) {
    const ag = C.agentById(item.agentId);
    const emoji = item.emoji || emojiFor(item.cliente || item.id);
    const accent = item.color || '';
    const [openPicker, setOpenPicker] = useState(null); // null | "color" | "emoji"
    const wa = waLink(item.telefono, item.cliente);
    const tel = item.telefono ? 'tel:' + item.telefono.replace(/\s/g, '') : null;
    const mail = item.email ? 'mailto:' + item.email : null;
    const ofrecidos = toOfferList(item.ofreci);

    return e('div', {
      className: 'cl-card',
      style: { '--cl-delay': `${Math.min(index, 12) * 0.045}s`, '--cl-accent': accent || 'var(--mint-400)' },
      onClick: () => onOpen(item),
    },
      e('div', { className: 'cl-actions', onClick: (ev) => ev.stopPropagation() },
        e('button', { className: 'cl-act', title: 'Emoji de la tarjeta', onClick: () => setOpenPicker((o) => (o === 'emoji' ? null : 'emoji')) },
          e('span', { className: 'cl-act-emoji' }, emoji)),
        e('button', { className: 'cl-act', title: 'Color del borde', onClick: () => setOpenPicker((o) => (o === 'color' ? null : 'color')) },
          e('span', { className: 'cl-color-dot', style: { background: accent || 'transparent', borderColor: accent || 'var(--ink-3)' } })),
        e('button', { className: 'cl-act danger', title: 'Eliminar', onClick: () => onDelete(item) }, e(I.Trash, { width: 13, height: 13 })),
        openPicker === 'color' ? e(ColorPicker, { value: accent, onPick: (c) => onColor(item, c), onClose: () => setOpenPicker(null) }) : null,
        openPicker === 'emoji' ? e(EmojiPicker, { value: item.emoji || '', onPick: (em) => onEmoji(item, em), onClose: () => setOpenPicker(null) }) : null,
      ),
      e('div', { className: 'cl-head' },
        e('span', { className: 'cl-emoji' }, emoji),
        e('div', { className: 'cl-head-text' },
          e('h3', { className: 'cl-name' }, item.cliente || 'Sin nombre'),
          e('div', { className: 'cl-meta-row' },
            item.fecha ? e('span', { className: 'cl-date' }, e(I.Calendar, { width: 11, height: 11 }), fmtFecha(item.fecha)) : null,
            item.presupuesto ? e('span', { className: 'cl-budget' }, '💰', item.presupuesto) : null,
          ),
        ),
      ),
      e('div', { className: 'cl-body' },
        item.busca ? e('div', { className: 'cl-line' }, e('span', { className: 'cl-line-ico' }, '🔍'), e('span', { className: 'cl-line-txt' }, item.busca)) : null,
        ofrecidos.length
          ? e('div', { className: 'cl-offer-list' },
              ofrecidos.slice(0, 3).map((o, i) => e('div', { className: 'cl-line', key: i }, e('span', { className: 'cl-line-ico' }, '🏠'), e('span', { className: 'cl-line-txt' }, o.text))),
              ofrecidos.length > 3 ? e('div', { className: 'cl-line cl-more' }, `+${ofrecidos.length - 3} más`) : null,
            )
          : null,
        (!item.busca && !item.presupuesto && !ofrecidos.length) ? e('div', { className: 'cl-line cl-line-empty' }, 'Sin detalles todavía… (click para completar)') : null,
      ),
      e('div', { className: 'cl-foot' },
        ag ? e('span', { className: 'cl-agent', title: ag.name }, e(Avatar, { agent: ag, size: 24 }), e('span', null, ag.name)) : e('span', { className: 'cl-agent-none' }, 'Sin agente'),
        e('div', { className: 'cl-contact', onClick: (ev) => ev.stopPropagation() },
          e('a', {
            className: 'cl-cbtn wa' + (wa ? '' : ' off'), href: wa || undefined, target: '_blank', rel: 'noreferrer',
            title: wa ? 'Escribir por WhatsApp' : 'Sin teléfono', onClick: (ev) => { if (!wa) ev.preventDefault(); },
          }, e(I.WhatsApp, { width: 14, height: 14 })),
          e('a', {
            className: 'cl-cbtn call' + (tel ? '' : ' off'), href: tel || undefined,
            title: tel ? 'Llamar' : 'Sin teléfono', onClick: (ev) => { if (!tel) ev.preventDefault(); },
          }, e(I.Phone, { width: 13, height: 13 })),
          e('a', {
            className: 'cl-cbtn mail' + (mail ? '' : ' off'), href: mail || undefined,
            title: mail ? 'Enviar email' : 'Sin email', onClick: (ev) => { if (!mail) ev.preventDefault(); },
          }, e(I.Mail, { width: 13, height: 13 })),
        ),
      ),
    );
  }

  // ---------- Tarjeta fantasma: "+ Nuevo cliente" ----------
  function ClientAddCard({ onClick }) {
    return e('button', { type: 'button', className: 'cl-add-card', onClick },
      e('span', { className: 'cl-add-plus' }, e(I.Plus, { width: 22, height: 22 })),
      e('span', { className: 'cl-add-label' }, 'Nuevo cliente'),
      e('span', { className: 'cl-add-emoji' }, '✨'),
    );
  }

  // ---------- Vista principal (grilla + buscador) ----------
  function ClientesView({ items: allItems, query, agentFilter, onOpen, onDelete, onColor, onEmoji, onNew }) {
    const list = useMemo(() => {
      const q = query.trim().toLowerCase();
      return (allItems || []).filter((it) => {
        if (agentFilter && agentFilter !== '__all' && it.agentId !== agentFilter) return false;
        if (q) {
          const hay = [it.cliente, it.telefono, it.email, it.busca, it.presupuesto, ...toOfferList(it.ofreci).map((o) => o.text)].filter(Boolean).join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }, [allItems, query, agentFilter]);

    return e('div', { className: 'cl-grid' },
      e(ClientAddCard, { onClick: onNew }),
      list.length
        ? list.map((it, i) => e(ClientCard, { key: it.id, item: it, index: i + 1, onOpen, onDelete, onColor, onEmoji }))
        : e('div', { className: 'cl-empty-inline' },
            (allItems || []).length ? '🔍 No hay clientes que coincidan con la búsqueda.' : '¡Sumá tu primer cliente y arrancá el seguimiento! 🎉'),
    );
  }

  // ---------- Ítem de la lista de propiedades ofrecidas (detalle) ----------
  // Un solo campo de texto: si se pega un link o ID de propiedad, se muestra solo
  // el ID (no el link completo) y se puede seguir escribiendo a continuación.
  // La imagen/título de la propiedad anclada solo se ve acá (dentro del modal).
  function OfferedListItem({ value, onChange, onRemove }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState({ text: value.text, ref: value.propertyRef });
    useEffect(() => { if (!editing) setVal({ text: value.text, ref: value.propertyRef }); }, [value, editing]);
    const { preview, loading } = usePropertyPreview(val.ref, editing);
    const shown = editing ? preview : value.propertyPreview;

    function commit() {
      setEditing(false);
      let text = val.text.trim();
      let ref = val.ref;
      if (!ref) {
        const token = extractPropertyToken(text);
        if (token) { text = token.label; ref = token.ref; }
      }
      if (!text && !ref) { onRemove(); return; }
      if (text !== value.text || ref !== value.propertyRef) {
        onChange({ text, propertyRef: ref, propertyPreview: ref === value.propertyRef ? value.propertyPreview : null });
      }
    }
    function cancel() { setVal({ text: value.text, ref: value.propertyRef }); setEditing(false); }
    function onPaste(ev) {
      const result = applyPasteToken(val.text, ev.target.selectionStart, ev.target.selectionEnd, ev.clipboardData.getData('text'));
      if (!result) return;
      ev.preventDefault();
      setVal({ text: result.text, ref: result.ref });
    }

    return e('div', { className: 'cd-list-item' },
      e('span', { className: 'cd-list-ico' }, '🏠'),
      e('div', { className: 'cd-list-body' },
        editing
          ? e('div', { className: 'cd-list-edit-row' },
              e('input', {
                autoFocus: true, value: val.text, onPaste,
                onChange: (ev) => setVal((o) => ({ ...o, text: ev.target.value })),
                onKeyDown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); commit(); } if (ev.key === 'Escape') cancel(); },
              }),
              e('button', { type: 'button', className: 'cd-list-ok', title: 'Guardar', onClick: commit }, e(I.Check, { width: 13, height: 13 })),
              e('button', { type: 'button', className: 'cd-list-cancel', title: 'Cancelar', onClick: cancel }, e(I.Close, { width: 12, height: 12 })),
            )
          : e('span', { className: 'cd-list-text', onClick: () => setEditing(true) }, value.text),
        loading ? e('span', { className: 'lp-loading' }, 'Cargando vista previa…') : null,
        shown ? e(PropertyPreviewCard, { preview: shown, compact: true }) : null,
      ),
      e('button', { type: 'button', className: 'cd-list-del', title: 'Quitar', onClick: onRemove }, e(I.Close, { width: 12, height: 12 })),
    );
  }

  // ---------- Lista de propiedades ofrecidas (dentro del modal de detalle) ----------
  function OfferedListField({ value, onSave }) {
    const items = toOfferList(value);
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState({ text: '', ref: '' });
    const { preview: draftPreview, loading: draftLoading } = usePropertyPreview(draft.ref, adding);

    function updateAt(i, v) { onSave(items.map((it, idx) => (idx === i ? v : it))); }
    function removeAt(i) { onSave(items.filter((_, idx) => idx !== i)); }
    function onDraftPaste(ev) {
      const result = applyPasteToken(draft.text, ev.target.selectionStart, ev.target.selectionEnd, ev.clipboardData.getData('text'));
      if (!result) return;
      ev.preventDefault();
      setDraft({ text: result.text, ref: result.ref });
    }
    function cancelDraft() { setDraft({ text: '', ref: '' }); setAdding(false); }
    function addDraft() {
      let text = draft.text.trim();
      let ref = draft.ref;
      if (!ref) {
        const token = extractPropertyToken(text);
        if (token) { text = token.label; ref = token.ref; }
      }
      if (!text && !ref) { cancelDraft(); return; }
      setDraft({ text: '', ref: '' });
      setAdding(false);
      onSave([...items, { text, propertyRef: ref, propertyPreview: null }]);
    }

    return e('div', { className: 'detail-chip cd-chip cd-list-chip full' },
      e('span', { className: 'dc-ico' }, '🏠'),
      e('div', { className: 'dc-text' },
        e('div', { className: 'dc-label' }, '¿Qué le ofrecí?'),
        items.length
          ? e('div', { className: 'cd-list' },
              items.map((it, i) => e(OfferedListItem, { key: i, value: it, onChange: (v) => updateAt(i, v), onRemove: () => removeAt(i) })))
          : null,
        adding
          ? e('div', { className: 'offer-editor' },
              e('input', {
                autoFocus: true, value: draft.text, placeholder: 'Pegá un link, un ID de Tokko o escribí una nota libre',
                onChange: (ev) => setDraft((o) => ({ ...o, text: ev.target.value })), onPaste: onDraftPaste,
                onKeyDown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addDraft(); } if (ev.key === 'Escape') cancelDraft(); },
              }),
              e('div', { className: 'offer-editor-hint' }, '💡 Si pegás un link o un ID, se muestra solo el ID y podés seguir escribiendo una nota.'),
              draftLoading ? e('span', { className: 'lp-loading' }, 'Cargando vista previa…') : null,
              draftPreview ? e(PropertyPreviewCard, { preview: draftPreview, compact: true }) : null,
              e('div', { className: 'offer-editor-actions' },
                e('button', { type: 'button', className: 'btn ghost sm', onClick: cancelDraft }, 'Cancelar'),
                e('button', { type: 'button', className: 'btn primary sm', onClick: addDraft }, e(I.Check, { width: 13, height: 13 }), 'Agregar'),
              ),
            )
          : e('button', { type: 'button', className: 'offer-add-trigger', onClick: () => setAdding(true) }, e(I.Plus, { width: 14, height: 14 }), 'Agregar propiedad ofrecida'),
      ),
    );
  }

  // ---------- Modal de detalle (lectura linda + edición inline por campo) ----------
  function ClientDetail({ item, onClose, onSave, onDelete }) {
    if (!item) return null;
    const ag = C.agentById(item.agentId);
    const accent = item.color || '#15784f';
    const emoji = item.emoji || emojiFor(item.cliente || item.id);
    const wa = waLink(item.telefono, item.cliente);
    const tel = item.telefono ? 'tel:' + item.telefono.replace(/\s/g, '') : null;
    const mail = item.email ? 'mailto:' + item.email : null;

    return e('div', { className: 'modal-scrim', onMouseDown: onClose },
      e('div', { className: 'client-detail', onMouseDown: (ev) => ev.stopPropagation() },
        e('div', { className: 'detail-top', style: { background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.35)})` } },
          e('span', { className: 'detail-deco' }),
          e('span', { className: 'cd-top-emoji' }, emoji),
          e('button', { className: 'detail-x', onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e('div', { className: 'detail-body' },
          e(TitleField, { value: item.cliente, onSave: (v) => onSave({ cliente: v }) }),
          e('div', { className: 'detail-grid' },
            e(EditableField, {
              type: 'select', label: 'Agente', value: item.agentId,
              options: C.AGENTS.map((a) => ({ value: a.id, label: a.name })),
              icon: ag ? e(Avatar, { agent: ag, size: 18 }) : e(I.User, { width: 15, height: 15 }),
              displayValue: ag ? ag.name : 'Sin asignar',
              onSave: (v) => onSave({ agentId: v }),
            }),
            e(EditableField, {
              type: 'date', label: 'Fecha', value: item.fecha,
              icon: e(I.Calendar, { width: 15, height: 15 }),
              displayValue: item.fecha ? fmtFecha(item.fecha) : null, placeholder: 'Sin fecha',
              onSave: (v) => onSave({ fecha: v }),
            }),
          ),
          e('div', { className: 'detail-grid' },
            e(EditableField, {
              type: 'tel', label: 'Teléfono', value: item.telefono,
              icon: e(I.Phone, { width: 15, height: 15 }), placeholder: '+54 9 …',
              onSave: (v) => onSave({ telefono: v }),
            }),
            e(EditableField, {
              type: 'email', label: 'Email', value: item.email,
              icon: e(I.Mail, { width: 15, height: 15 }), placeholder: 'cliente@mail.com',
              onSave: (v) => onSave({ email: v }),
            }),
          ),
          e('div', { className: 'cd-contact-row' },
            e('a', { className: 'cl-cbtn wa lg' + (wa ? '' : ' off'), href: wa || undefined, target: '_blank', rel: 'noreferrer', onClick: (ev) => { if (!wa) ev.preventDefault(); } },
              e(I.WhatsApp, { width: 15, height: 15 }), 'WhatsApp'),
            e('a', { className: 'cl-cbtn call lg' + (tel ? '' : ' off'), href: tel || undefined, onClick: (ev) => { if (!tel) ev.preventDefault(); } },
              e(I.Phone, { width: 14, height: 14 }), 'Llamar'),
            e('a', { className: 'cl-cbtn mail lg' + (mail ? '' : ' off'), href: mail || undefined, onClick: (ev) => { if (!mail) ev.preventDefault(); } },
              e(I.Mail, { width: 14, height: 14 }), 'Email'),
          ),
          e(EditableField, {
            type: 'textarea', label: '¿Qué busca?', value: item.busca, full: true,
            icon: e('span', null, '🔍'), placeholder: 'Ej. depto 2 amb en el centro, hasta USD 80.000',
            onSave: (v) => onSave({ busca: v }),
          }),
          e(EditableField, {
            label: 'Presupuesto', value: item.presupuesto, full: true,
            icon: e(I.Coins, { width: 15, height: 15 }), placeholder: 'Ej. USD 120.000',
            onSave: (v) => onSave({ presupuesto: v }),
          }),
          e(OfferedListField, { value: item.ofreci, onSave: (v) => onSave({ ofreci: v }) }),
        ),
        e('div', { className: 'detail-actions' },
          e('button', { className: 'btn ghost danger', onClick: () => { onDelete(item); onClose(); } }, e(I.Trash, { width: 16, height: 16 }), 'Eliminar'),
          e('div', { className: 'spacer' }),
          e('button', { className: 'btn ghost', onClick: onClose }, 'Cerrar'),
        ),
      ),
    );
  }

  // ---------- Lista de propiedades ofrecidas (dentro del formulario de alta) ----------
  // Mismo campo único: pegar un link/ID lo muestra como "ID …" (sin el link completo);
  // la imagen se ve como vista previa acá mismo (el formulario también es un modal).
  function OfferFormRows({ value, onChange }) {
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState({ text: '', ref: '' });
    const { preview: draftPreview, loading: draftLoading } = usePropertyPreview(draft.ref, adding);

    function onPaste(ev) {
      const result = applyPasteToken(draft.text, ev.target.selectionStart, ev.target.selectionEnd, ev.clipboardData.getData('text'));
      if (!result) return;
      ev.preventDefault();
      setDraft({ text: result.text, ref: result.ref });
    }
    function cancelDraft() { setDraft({ text: '', ref: '' }); setAdding(false); }
    function add() {
      let text = draft.text.trim();
      let ref = draft.ref;
      if (!ref) {
        const token = extractPropertyToken(text);
        if (token) { text = token.label; ref = token.ref; }
      }
      if (!text && !ref) { cancelDraft(); return; }
      onChange([...value, { text, propertyRef: ref, propertyPreview: null }]);
      setDraft({ text: '', ref: '' });
      setAdding(false);
    }
    function removeAt(i) { onChange(value.filter((_, idx) => idx !== i)); }

    return e('div', { className: 'fg-offer-wrap' },
      value.length
        ? e('div', { className: 'fg-offer-list' },
            value.map((it, i) => e('div', { className: 'fg-offer-row', key: i },
              e('span', { className: 'fg-offer-txt' }, it.text),
              e('button', { type: 'button', className: 'fg-offer-del', title: 'Quitar', onClick: () => removeAt(i) }, e(I.Close, { width: 12, height: 12 })))))
        : null,
      adding
        ? e('div', { className: 'offer-editor' },
            e('input', {
              autoFocus: true, value: draft.text, placeholder: 'Pegá un link, un ID de Tokko o escribí una nota libre',
              onChange: (ev) => setDraft((o) => ({ ...o, text: ev.target.value })), onPaste,
              onKeyDown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); add(); } if (ev.key === 'Escape') cancelDraft(); },
            }),
            e('div', { className: 'offer-editor-hint' }, '💡 Si pegás un link o un ID, se muestra solo el ID y podés seguir escribiendo una nota.'),
            draftLoading ? e('span', { className: 'lp-loading' }, 'Cargando vista previa…') : null,
            draftPreview ? e(PropertyPreviewCard, { preview: draftPreview, compact: true }) : null,
            e('div', { className: 'offer-editor-actions' },
              e('button', { type: 'button', className: 'btn ghost sm', onClick: cancelDraft }, 'Cancelar'),
              e('button', { type: 'button', className: 'btn primary sm', onClick: add }, e(I.Check, { width: 13, height: 13 }), 'Agregar'),
            ),
          )
        : e('button', { type: 'button', className: 'offer-add-trigger', onClick: () => setAdding(true) }, e(I.Plus, { width: 14, height: 14 }), 'Agregar propiedad ofrecida'),
    );
  }

  // ---------- Formulario de alta ----------
  function ClientForm({ onClose, onSave }) {
    const [f, setF] = useState({
      agentId: C.AGENTS[0].id,
      fecha: C.ymd(C.TODAY),
      cliente: '',
      telefono: '',
      email: '',
      busca: '',
      presupuesto: '',
      ofreci: [],
    });
    const set = (k) => (ev) => setF((o) => ({ ...o, [k]: ev.target.value }));

    function save() {
      if (!f.cliente.trim()) return;
      onSave({
        agentId: f.agentId,
        fecha: f.fecha,
        cliente: f.cliente.trim(),
        telefono: f.telefono.trim(),
        email: f.email.trim(),
        busca: f.busca.trim(),
        presupuesto: f.presupuesto.trim(),
        ofreci: f.ofreci,
      });
    }

    return e('div', { className: 'modal-scrim', onMouseDown: onClose },
      e('div', { className: 'form', onMouseDown: (ev) => ev.stopPropagation() },
        e('div', { className: 'form-head' },
          e('h2', null, 'Nuevo cliente 🙂'),
          e('button', { className: 'detail-x dark', onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
        ),
        e('div', { className: 'form-body' },
          e('div', { className: 'fg-row' },
            e('div', { className: 'fg' }, e('label', null, 'Agente'),
              e('select', { value: f.agentId, onChange: set('agentId') },
                C.AGENTS.map((a) => e('option', { key: a.id, value: a.id }, a.name)))),
            e('div', { className: 'fg' }, e('label', null, 'Fecha'),
              e('input', { type: 'date', value: f.fecha, onChange: set('fecha') })),
          ),
          e('div', { className: 'fg' }, e('label', null, 'Cliente'),
            e('input', { value: f.cliente, autoFocus: true, placeholder: 'Nombre del cliente', onChange: set('cliente') })),
          e('div', { className: 'fg-row' },
            e('div', { className: 'fg' }, e('label', null, 'Teléfono'),
              e('input', { value: f.telefono, placeholder: '+54 9 …', onChange: set('telefono') })),
            e('div', { className: 'fg' }, e('label', null, 'Email'),
              e('input', { value: f.email, placeholder: 'cliente@mail.com', onChange: set('email') })),
          ),
          e('div', { className: 'fg' }, e('label', null, '¿Qué busca?'),
            e('textarea', { value: f.busca, rows: 2, placeholder: 'Ej. depto 2 amb en el centro, hasta USD 80.000', onChange: set('busca') })),
          e('div', { className: 'fg' }, e('label', null, 'Presupuesto'),
            e('input', { value: f.presupuesto, placeholder: 'Ej. USD 120.000', onChange: set('presupuesto') })),
          e('div', { className: 'fg' }, e('label', null, '¿Qué le ofrecí?'),
            e(OfferFormRows, { value: f.ofreci, onChange: (list) => setF((o) => ({ ...o, ofreci: list })) })),
        ),
        e('div', { className: 'form-actions' },
          e('button', { className: 'btn ghost', onClick: onClose }, 'Cancelar'),
          e('button', { className: 'btn primary', onClick: save }, e(I.Check, { width: 16, height: 16 }), 'Agregar cliente'),
        ),
      ),
    );
  }

  export { ClientesView, ClientDetail, ClientForm };
