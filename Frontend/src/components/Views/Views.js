'use client';
import React from 'react';
import { CAL } from '@/lib/data';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import './Views.css';
/* Vistas del calendario -> window.Views
   MonthView, WeekView, DayView, AgendaView + algoritmos de layout */

  const e = React.createElement;
  const C = CAL;
  const I = Icons;
  const { Avatar, TypeDot, TYPE_ICON } = UI;

  const HOUR_START = 7, HOUR_END = 22, HOUR_H = 52;
  const nowDate = new Date();
  const NOW_MIN = nowDate.getHours() * 60 + nowDate.getMinutes(); // indicador "ahora" en la fecha de hoy

  // ============ helpers de layout ============
  function eventDayRange(ev) {
    const s = C.startOfDay(ev.start);
    let e2 = C.startOfDay(ev.end);
    if (!ev.allDay) e2 = s;
    return [s, e2];
  }

  // Barras por semana (vista mes) con asignación de carriles
  function layoutWeek(weekStart, evs) {
    const weekEnd = C.addDays(weekStart, 6);
    const segs = [];
    evs.forEach((ev) => {
      const [s, e2] = eventDayRange(ev);
      if (e2 < weekStart || s > weekEnd) return;
      const segStart = s < weekStart ? weekStart : s;
      const segEnd = e2 > weekEnd ? weekEnd : e2;
      const startCol = C.dayDiff(weekStart, segStart);
      const endCol = C.dayDiff(weekStart, segEnd);
      segs.push({
        ev, startCol, span: endCol - startCol + 1,
        contL: s < weekStart, contR: e2 > weekEnd,
        _s: C.parse(ev.start).getTime(),
        _len: endCol - startCol,
      });
    });
    segs.sort((a, b) => (b._len - a._len) || (a._s - b._s));
    const lanes = [];
    segs.forEach((seg) => {
      let lane = 0;
      while (true) {
        const occ = lanes[lane] || (lanes[lane] = []);
        const hit = occ.some((r) => !(seg.startCol > r.e || seg.startCol + seg.span - 1 < r.s));
        if (!hit) { occ.push({ s: seg.startCol, e: seg.startCol + seg.span - 1 }); seg.lane = lane; break; }
        lane++;
      }
    });
    return segs;
  }

  // Columnas para eventos con horario solapados (vista semana/día)
  function layoutDayColumn(evs) {
    const items = evs.map((ev) => ({
      ev, start: C.minutesOfDay(ev.start), end: Math.max(C.minutesOfDay(ev.end), C.minutesOfDay(ev.start) + 30),
    })).sort((a, b) => a.start - b.start || a.end - b.end);
    // agrupar en clusters solapados
    let clusterEnd = -1, group = [];
    const out = [];
    const flush = () => {
      // asignar columnas dentro del grupo
      const cols = [];
      group.forEach((it) => {
        let c = 0;
        while (cols[c] && cols[c] > it.start) c++;
        cols[c] = it.end;
        it.col = c;
      });
      const ncols = cols.length;
      group.forEach((it) => { it.cols = ncols; out.push(it); });
      group = [];
    };
    items.forEach((it) => {
      if (group.length && it.start >= clusterEnd) { flush(); clusterEnd = -1; }
      group.push(it);
      clusterEnd = Math.max(clusterEnd, it.end);
    });
    if (group.length) flush();
    return out;
  }

  // ============ Vista MES (y grilla compacta para multi-mes) ============
  function MonthGrid({ cursor, events, onOpen, onNew, goDay, compact }) {
    const first = C.startOfMonth(cursor);
    let gridStart = C.startOfWeek(first);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const leadingOffset = C.dayDiff(gridStart, first);
    const weeksNeeded = Math.ceil((leadingOffset + daysInMonth) / 7);
    if (weeksNeeded > 5) gridStart = C.addDays(gridStart, 7); // mes necesita 6 semanas: se corta la primera
    const weeks = [];
    for (let w = 0; w < 5; w++) weeks.push(C.addDays(gridStart, w * 7));
    const MAX = compact ? 1 : 3;
    const HEAD_H = compact ? 16 : 30;
    const LANE_H = compact ? 15 : 23;

    return e("div", { className: "month" + (compact ? " mini" : "") },
      e("div", { className: "month-dow" },
        C.DAYS_SHORT.map((d) => e("div", { key: d, className: "mdow" }, compact ? d[0] : d)),
      ),
      e("div", { className: "month-grid" },
        weeks.map((ws, wi) => {
          const segs = layoutWeek(ws, events);
          // overflow por día
          const hidden = [0, 0, 0, 0, 0, 0, 0];
          segs.forEach((s) => { if (s.lane >= MAX) for (let c = s.startCol; c < s.startCol + s.span; c++) hidden[c]++; });
          return e("div", { className: "mweek", key: wi },
            // fondo de celdas
            e("div", { className: "mweek-cells" },
              [0,1,2,3,4,5,6].map((ci) => {
                const day = C.addDays(ws, ci);
                const inMonth = C.isSameMonth(day, first);
                const isToday = C.isSameDay(day, C.TODAY);
                const isWeekend = ci >= 5;
                return e("div", {
                  key: ci,
                  className: "mcell" + (inMonth ? "" : " out") + (isWeekend ? " wknd" : ""),
                  onClick: (ev) => { if (ev.target.classList.contains("mcell")) onNew(day); },
                },
                  e("div", { className: "mcell-head" },
                    e("span", { className: "mcell-num" + (isToday ? " today" : "") }, day.getDate()),
                  ),
                );
              }),
            ),
            // capa de barras
            e("div", { className: "mweek-bars" },
              segs.filter((s) => s.lane < MAX).map((s, i) => {
                const t = C.EVENT_TYPES[s.ev.type];
                const ag = C.agentById(s.ev.agentId);
                const multi = s.ev.allDay && C.dayDiff(s.ev.start, s.ev.end) >= 1;
                const due = C.eventDueState(s.ev);
                return e("button", {
                  key: s.ev.id + i,
                  className: "mbar t-" + s.ev.type + (multi ? " multi" : "") + (s.contL ? " cl" : "") + (s.contR ? " cr" : "") + (due ? ` due-${due}` : ""),
                  style: {
                    left: `calc(${(s.startCol / 7) * 100}% + 4px)`,
                    width: `calc(${(s.span / 7) * 100}% - 8px)`,
                    top: HEAD_H + s.lane * LANE_H,
                    background: multi ? t.color : t.bg,
                    color: multi ? "#fff" : t.ink,
                    borderColor: multi ? t.color : t.soft,
                  },
                  onClick: (ev) => { ev.stopPropagation(); onOpen(s.ev); },
                  title: s.ev.title,
                },
                  compact
                    ? e("span", { className: "mbar-in" }, s.ev.title)
                    : multi
                      ? e("span", { className: "mbar-in" }, s.ev.title, ag ? e("span", { className: "mbar-tag" }, ag.initials) : null)
                      : e("span", { className: "mbar-in" },
                          e(TypeDot, { type: s.ev.type, size: 7 }),
                          !s.ev.allDay ? e("b", { className: "mbar-time" }, C.fmtTime(s.ev.start)) : null,
                          e("span", { className: "mbar-txt" }, s.ev.title)),
                );
              }),
              // overflow
              [0,1,2,3,4,5,6].map((ci) => hidden[ci] ? e("button", {
                key: "ov" + ci,
                className: "mbar-more",
                style: { left: `calc(${(ci / 7) * 100}% + 4px)`, width: `calc(${(1 / 7) * 100}% - 8px)`, top: HEAD_H + MAX * LANE_H },
                onClick: (ev) => { ev.stopPropagation(); goDay(C.addDays(ws, ci)); },
              }, compact ? `+${hidden[ci]}` : `+${hidden[ci]} más`) : null),
            ),
          );
        }),
      ),
    );
  }

  function MonthView(p) { return MonthGrid(Object.assign({}, p, { compact: false })); }

  // ============ Vista MULTI-MES (3 / 6 / 12 meses) ============
  function MultiMonthView({ months, cursor, events, onOpen, onNew, goDay }) {
    const first = C.startOfMonth(cursor);
    const cursors = [];
    for (let m = 0; m < months; m++) cursors.push(C.addMonths(first, m));

    return e("div", { className: "multi-month", "data-count": months },
      e("div", { className: "mm-grid" },
        cursors.map((mc, i) => e("div", { className: "mm-month", key: i },
          e("div", { className: "mm-month-head" }, C.fmtMonthYear(mc).replace(/^./, (c) => c.toUpperCase())),
          e(MonthGrid, { cursor: mc, events, onOpen, onNew, goDay, compact: true }),
        )),
      ),
    );
  }

  // ============ Eje horario compartido ============
  function HourGutter() {
    const labels = [];
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      labels.push(e("div", { key: h, className: "hour-lbl", style: { top: (h - HOUR_START) * HOUR_H } },
        `${String(h).padStart(2, "0")}:00`));
    }
    return e("div", { className: "hour-gutter", style: { height: (HOUR_END - HOUR_START) * HOUR_H } }, labels);
  }

  function TimedEvent({ it, multiCol, onOpen }) {
    const ev = it.ev;
    const t = C.EVENT_TYPES[ev.type];
    const Ico = TYPE_ICON[ev.type];
    const ag = C.agentById(ev.agentId);
    const prop = C.propById(ev.propertyId);
    const top = (it.start - HOUR_START * 60) / 60 * HOUR_H;
    const height = Math.max(24, (it.end - it.start) / 60 * HOUR_H - 2);
    const w = multiCol ? `calc(${100 / it.cols}% - 3px)` : "calc(100% - 6px)";
    const left = multiCol ? `calc(${(it.col / it.cols) * 100}% + 2px)` : "3px";
    const short = height < 42;
    const due = C.eventDueState(ev);
    return e("button", {
      className: "tev t-" + ev.type + (short ? " short" : "") + (due ? ` due-${due}` : ""),
      style: { top, height, width: w, left, background: t.bg, borderColor: t.soft, color: t.ink },
      onClick: (e2) => { e2.stopPropagation(); onOpen(ev); },
    },
      e("span", { className: "tev-bar", style: { background: t.color } }),
      e("div", { className: "tev-body" },
        e("div", { className: "tev-title" },
          due ? e("span", { className: "due-dot " + due }) : null,
          e(Ico, { width: 12, height: 12 }), e("span", null, ev.title)),
        !short ? e("div", { className: "tev-meta" }, `${C.fmtTime(ev.start)}–${C.fmtTime(ev.end)}`, prop ? ` · ${prop.name}` : "") : null,
      ),
      !short && ag ? e(Avatar, { agent: ag, size: 18 }) : null,
    );
  }

  function AllDayStrip({ days, events, onOpen }) {
    // barras allDay (reservas + vencimientos) en fila superior
    const weekStart = days[0];
    const allday = events.filter((ev) => ev.allDay);
    const segs = layoutWeek(weekStart, allday);
    const laneCount = segs.reduce((m, s) => Math.max(m, s.lane + 1), 0);
    return e("div", { className: "allday", style: { minHeight: Math.max(1, laneCount) * 24 + 8 } },
      e("div", { className: "allday-label" }, "Todo el día"),
      e("div", { className: "allday-track" },
        segs.map((s, i) => {
          const ev = s.ev; const t = C.EVENT_TYPES[ev.type];
          const multi = C.dayDiff(ev.start, ev.end) >= 1;
          const due = C.eventDueState(ev);
          return e("button", {
            key: ev.id + i,
            className: "ad-bar" + (s.contL ? " cl" : "") + (s.contR ? " cr" : "") + (due ? ` due-${due}` : ""),
            style: {
              left: `calc(${(s.startCol/7)*100}% + 3px)`, width: `calc(${(s.span/7)*100}% - 6px)`,
              top: 4 + s.lane * 24,
              background: multi ? t.color : t.bg, color: multi ? "#fff" : t.ink, borderColor: multi ? t.color : t.soft,
            },
            onClick: (e2) => { e2.stopPropagation(); onOpen(ev); },
          }, due ? e("span", { className: "due-dot " + due }) : null, ev.title);
        }),
      ),
    );
  }

  // ============ Vista SEMANA ============
  function WeekView({ cursor, events, onOpen, onNew }) {
    const ws = C.startOfWeek(cursor);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(C.addDays(ws, i));
    const timed = events.filter((ev) => !ev.allDay);

    return e("div", { className: "week" },
      e("div", { className: "week-head" },
        e("div", { className: "wh-corner" }),
        days.map((d, i) => {
          const isToday = C.isSameDay(d, C.TODAY);
          return e("div", { key: i, className: "wh-day" + (isToday ? " today" : "") },
            e("span", { className: "wh-dow" }, C.DAYS_SHORT[i]),
            e("span", { className: "wh-num" + (isToday ? " today" : "") }, d.getDate()),
          );
        }),
      ),
      e(AllDayStrip, { days, events, onOpen }),
      e("div", { className: "week-body" },
        e(HourGutter, null),
        e("div", { className: "week-cols" },
          days.map((d, di) => {
            const dayEvs = timed.filter((ev) => C.isSameDay(ev.start, d));
            const laid = layoutDayColumn(dayEvs);
            const isToday = C.isSameDay(d, C.TODAY);
            return e("div", { key: di, className: "wcol" + (di >= 5 ? " wknd" : "") },
              // líneas de hora
              Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, h) =>
                e("div", { key: h, className: "wline", style: { top: h * HOUR_H } })),
              // click para crear
              Array.from({ length: HOUR_END - HOUR_START }).map((_, h) =>
                e("div", { key: "s" + h, className: "wslot", style: { top: h * HOUR_H, height: HOUR_H },
                  onClick: () => onNew(d, HOUR_START + h) })),
              laid.map((it, i) => e(TimedEvent, { key: it.ev.id + i, it, multiCol: it.cols > 1, onOpen })),
              isToday ? e("div", { className: "now-line", style: { top: (NOW_MIN - HOUR_START*60)/60*HOUR_H } }, e("span", { className: "now-dot" })) : null,
            );
          }),
        ),
      ),
    );
  }

  // ============ Vista DÍA ============
  function DayView({ cursor, events, onOpen, onNew }) {
    const day = C.startOfDay(cursor);
    const allday = events.filter((ev) => ev.allDay && (() => { const [s,e2]=eventDayRange(ev); return day>=s && day<=e2; })());
    const timed = events.filter((ev) => !ev.allDay && C.isSameDay(ev.start, day));
    const laid = layoutDayColumn(timed);
    const isToday = C.isSameDay(day, C.TODAY);

    return e("div", { className: "day" },
      allday.length ? e("div", { className: "day-allday" },
        e("div", { className: "day-allday-lbl" }, "Todo el día"),
        e("div", { className: "day-allday-list" },
          allday.map((ev) => {
            const t = C.EVENT_TYPES[ev.type]; const ag = C.agentById(ev.agentId); const prop = C.propById(ev.propertyId);
            const due = C.eventDueState(ev);
            return e("button", { key: ev.id, className: "day-ad" + (due ? ` due-${due}` : ""), style: { background: t.bg, color: t.ink, borderColor: t.soft },
              onClick: () => onOpen(ev) },
              e("span", { className: "day-ad-bar", style: { background: t.color } }),
              due ? e("span", { className: "due-dot " + due }) : null,
              e("span", { className: "day-ad-title" }, ev.title),
              prop ? e("span", { className: "day-ad-prop" }, prop.name) : null,
              ag ? e(Avatar, { agent: ag, size: 20 }) : null,
            );
          }),
        ),
      ) : null,
      e("div", { className: "day-body" },
        e(HourGutter, null),
        e("div", { className: "day-col" },
          Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, h) =>
            e("div", { key: h, className: "wline", style: { top: h * HOUR_H } })),
          Array.from({ length: HOUR_END - HOUR_START }).map((_, h) =>
            e("div", { key: "s" + h, className: "wslot", style: { top: h * HOUR_H, height: HOUR_H }, onClick: () => onNew(day, HOUR_START + h) })),
          laid.map((it, i) => e(TimedEvent, { key: it.ev.id + i, it, multiCol: it.cols > 1, onOpen })),
          isToday ? e("div", { className: "now-line", style: { top: (NOW_MIN - HOUR_START*60)/60*HOUR_H } }, e("span", { className: "now-dot" })) : null,
        ),
      ),
    );
  }

  // ============ Vista AGENDA ============
  function AgendaView({ cursor, events, onOpen }) {
    // eventos del mes en curso, expandiendo reservas a su rango
    const first = C.startOfMonth(cursor);
    const last = C.addDays(C.addMonths(first, 1), -1);
    const list = events.filter((ev) => {
      const [s, e2] = eventDayRange(ev);
      return e2 >= first && s <= last;
    }).slice().sort((a, b) => C.parse(a.start) - C.parse(b.start) || (a.allDay ? -1 : 1));

    // agrupar por día de inicio
    const groups = [];
    const map = {};
    list.forEach((ev) => {
      const d = C.startOfDay(C.parse(ev.start) < first ? first : ev.start);
      const key = C.ymd(d);
      if (!map[key]) { map[key] = { key, date: d, items: [] }; groups.push(map[key]); }
      map[key].items.push(ev);
    });

    if (!groups.length) return e("div", { className: "agenda-empty" }, "No hay eventos para este período.");

    return e("div", { className: "agenda" },
      groups.map((g) => {
        const isToday = C.isSameDay(g.date, C.TODAY);
        return e("div", { className: "ag-group", key: g.key },
          e("div", { className: "ag-date" + (isToday ? " today" : "") },
            e("span", { className: "ag-dnum" }, g.date.getDate()),
            e("div", { className: "ag-dmeta" },
              e("span", { className: "ag-dow" }, C.DAYS[(g.date.getDay()+6)%7]),
              e("span", { className: "ag-mon" }, C.MONTHS_SHORT[g.date.getMonth()]),
            ),
            isToday ? e("span", { className: "ag-today-pill" }, "Hoy") : null,
          ),
          e("div", { className: "ag-items" },
            g.items.map((ev) => {
              const t = C.EVENT_TYPES[ev.type]; const ag = C.agentById(ev.agentId); const prop = C.propById(ev.propertyId);
              const Ico = TYPE_ICON[ev.type]; const st = C.STATUS[ev.status];
              const multi = ev.allDay && C.dayDiff(ev.start, ev.end) >= 1;
              const due = C.eventDueState(ev);
              return e("button", { key: ev.id, className: "ag-item" + (due ? ` due-${due}` : ""), onClick: () => onOpen(ev) },
                e("span", { className: "ag-time" },
                  due ? e("span", { className: "due-dot " + due }) : null,
                  ev.allDay ? (multi ? `${C.nights(ev)} noches` : "Todo el día") : C.fmtTime(ev.start)),
                e("span", { className: "ag-bar", style: { background: t.color } }),
                e("span", { className: "ag-ico", style: { color: t.color, background: t.bg } }, e(Ico, { width: 15, height: 15 })),
                e("div", { className: "ag-main" },
                  e("div", { className: "ag-title" }, ev.title,
                    e("span", { className: "ag-type-tag", style: { color: t.ink, background: t.bg } }, t.short),
                    due === "past" ? e("span", { className: "ag-overdue-tag" }, "¡Venció!") : due === "soon" ? e("span", { className: "ag-soon-tag" }, "Por vencer") : null),
                  e("div", { className: "ag-sub" },
                    prop ? e("span", null, e(I.MapPin, { width: 12, height: 12 }), prop.name) : null,
                    ev.client ? e("span", null, e(I.User, { width: 12, height: 12 }), ev.client.name) : null,
                  ),
                ),
                st ? e("span", { className: "status-badge", style: { color: st.color, background: st.bg } }, st.label) : null,
                ag ? e(Avatar, { agent: ag, size: 26 }) : null,
              );
            }),
          ),
        );
      }),
    );
  }

  // ============ Tira de días mobile: semana horizontal + indicador del día elegido ============
  function MobileWeekStrip({ selectedDay, events, onDayTap, onPrevWeek, onNextWeek }) {
    const ws = C.startOfWeek(selectedDay);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(C.addDays(ws, i));
    return e("div", { className: "mob-week-strip" },
      e("button", { className: "mob-week-nav", onClick: onPrevWeek }, e(I.ChevronLeft, { width: 15, height: 15 })),
      e("div", { className: "mob-week-days" },
        days.map((d, i) => {
          const isToday = C.isSameDay(d, C.TODAY);
          const isSel = C.isSameDay(d, selectedDay);
          const hasEvs = events.some((ev) => {
            const [s, e2] = eventDayRange(ev);
            return d >= s && d <= e2;
          });
          return e("button", {
            key: i, type: "button",
            className: "mob-week-day" + (isSel ? " sel" : "") + (isToday && !isSel ? " today" : ""),
            onClick: () => onDayTap(d),
          },
            e("span", { className: "mwd-dow" }, C.DAYS_SHORT[i]),
            e("span", { className: "mwd-num" }, d.getDate()),
            hasEvs ? e("span", { className: "mwd-dot" }) : null,
          );
        }),
      ),
      e("button", { className: "mob-week-nav", onClick: onNextWeek }, e(I.Chevron, { width: 15, height: 15 })),
    );
  }

  export { MonthView, MultiMonthView, WeekView, DayView, AgendaView, MobileWeekStrip };

