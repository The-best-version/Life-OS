import { AR_MONTHS, Badge, Btn, Card, Checkbox, DOW_AR, DateField, Field, Modal, T, TimeField, WEEK_LABELS, arDate, courseIn, courseName, dayWord, prettyTime, timesWord, useBurst, whenWord } from "./life-shared.jsx";
import { EVENT_KINDS, REPEATS, WARN_CHOICES, alertsOf, dayKey, daysUntil, eventShape, eventsIn, fmtDay, isEventDone, isKey, keyToDate, kindOf, repeatOf, rows, uniShape, upcoming, upcomingRows } from "./life-state.mjs";
import { uniDue, uniKindOf } from "./life-uni.jsx";
import { AlertTriangle, ArrowLeft, Bell, CalendarClock, CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, CircleDot, Clock, GraduationCap, Hash, LayoutGrid, ListChecks, MapPin, Pencil, Plus, Repeat, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AgendaModule({ state, setState, onGo }) {
  const today = new Date();
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [picked, setPicked] = useState(null); // the opened square
  const [draft, setDraft] = useState(null); // the event form

  const events = state.events || [];
  const uni = state.uni || uniShape();

  /* The window the month grid covers, including the leading blanks — an
     entry on the 1st of a month that starts on a Wednesday still has to be
     found, and the grid asks for its square by key. */
  const month = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7; // the week starts Saturday
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++)
      cells.push({ d, ds: fmtDay(new Date(cursor.y, cursor.m, d)) });
    return {
      cells,
      from: fmtDay(first),
      to: fmtDay(new Date(cursor.y, cursor.m, days)),
    };
  }, [cursor]);

  const byDate = useMemo(
    () => eventsIn(events, month.from, month.to),
    [events, month.from, month.to],
  );
  const dueByDate = useMemo(
    () => uniDue(uni, month.from, month.to),
    [uni, month.from, month.to],
  );

  const monthCount = useMemo(() => {
    let n = 0;
    for (const row of byDate.values()) n += row.length;
    return n;
  }, [byDate]);

  const alerts = useMemo(() => alertsOf(events), [events]);
  /* One expansion, four readings. Walking the recurrence rules once per
     counter is the same answer paid for four times. The counters read the
     occurrence-level list so «متأخّر ٣» means three real dates; the screen
     shows the entry-level one so a weekly class is a single row. */
  const all = useMemo(() => upcoming(events), [events]);
  const list = useMemo(() => upcomingRows(events), [events]);
  /* Ticked-but-still-ahead occurrences stay in the list (seeing that next
     week's exam is already prepared for is the point) but must not be
     counted as work outstanding. */
  const next7 = all.filter((r) => {
    const left = daysUntil(r.on);
    return left >= 0 && left <= 7 && !isEventDone(r.ev, r.on);
  }).length;
  const late = all.filter((r) => r.on < dayKey()).length;

  /* The twelve months of the cursor's year, each with how many entries land
     in it. Built in one pass over one window instead of twelve calls, which
     is what keeps a year of weekly entries cheap to draw. */
  const year = useMemo(() => {
    const from = fmtDay(new Date(cursor.y, 0, 1));
    const to = fmtDay(new Date(cursor.y, 11, 31));
    const map = eventsIn(events, from, to);
    const months = AR_MONTHS.map((label, m) => ({ label, m, n: 0, days: new Set() }));
    for (const [ds, row] of map) {
      const mm = Number(ds.slice(5, 7)) - 1;
      if (months[mm]) {
        months[mm].n += row.length;
        months[mm].days.add(Number(ds.slice(8, 10)));
      }
    }
    return months;
  }, [events, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const jumpToday = () => {
    const now = new Date();
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    setView("month");
  };

  const toggle = (id, on) =>
    setState((s) => ({
      ...s,
      events: (s.events || []).map((e) =>
        e.id !== id
          ? e
          : {
              ...e,
              doneOn: (e.doneOn || []).includes(on)
                ? e.doneOn.filter((x) => x !== on)
                : [...(e.doneOn || []), on],
            },
      ),
    }));

  const remove = (ev) => {
    const rep = repeatOf(ev.repeat);
    const msg = rep.short
      ? `حذف «${ev.title}» وكل تكراراته (${rep.label})؟`
      : `حذف «${ev.title}»؟`;
    if (!window.confirm(msg)) return;
    setState((s) => ({
      ...s,
      events: (s.events || []).filter((e) => e.id !== ev.id),
    }));
  };

  const openNew = (date) =>
    setDraft({
      ...eventShape({ date: date || dayKey(), kind: "note", warn: 1 }),
      isNew: true,
    });

  const save = () => {
    const ev = eventShape(draft);
    ev.title = String(draft.title || "").trim();
    setState((s) => {
      const prev = s.events || [];
      return {
        ...s,
        /* The ticks belong to the occurrences, not to the form — an entry
           edited after being ticked must not come back untouched. */
        events: prev.some((e) => e.id === ev.id)
          ? prev.map((e) => (e.id === ev.id ? { ...ev, doneOn: e.doneOn } : e))
          : [...prev, ev],
      };
    });
    /* Land the user where the entry actually went — saving a date in March
       while looking at October and seeing nothing change reads as a failed
       save. */
    const d = keyToDate(ev.date);
    if (d) setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setDraft(null);
  };

  const stats = [
    { k: "في هذا الشهر", v: monthCount, c: T.sky, icon: CalendarDays },
    { k: "خلال أسبوع", v: next7, c: T.cta, icon: CalendarClock },
    { k: "متأخّر", v: late, c: late ? T.danger : T.faint, icon: AlertTriangle },
    { k: "كل المواعيد", v: events.length, c: T.accent, icon: Hash },
  ];

  const pickedRows = picked ? byDate.get(picked) || [] : [];
  const pickedDue = picked ? dueByDate.get(picked) || [] : [];

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            التقويم
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الشهور والسنوات القادمة، وما يستحق أن يُحجز فيها. ما لا تاريخ له لا
            يحدث.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="default" size="sm" onClick={() => openNew()}>
              <CalendarPlus size={14} strokeWidth={2.6} /> موعد جديد
            </Btn>
            <Btn
              variant="outline"
              size="sm"
              onClick={jumpToday}
              style={{ borderColor: T.border }}
            >
              <CircleDot size={13} /> اليوم
            </Btn>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {AGENDA_VIEWS.map((v) => {
            const on = v.id === view;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={on}
                className="flex flex-col items-center gap-1 rounded-xl border px-3.5 py-2.5 text-[11px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                  color: on ? T.cta : T.muted,
                }}
              >
                <Icon size={15} strokeWidth={2} />
                {v.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.k} className="p-4">
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: s.c }} />
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  {s.k}
                </p>
              </div>
              <p
                dir="ltr"
                className="mt-1 text-[22px] font-extrabold tabular-nums"
                style={{ color: s.c }}
              >
                {s.v}
              </p>
            </Card>
          );
        })}
      </div>

      {/* The warning window, open. An exam that only speaks on the morning
          of the exam is a calendar that waited until it was too late. */}
      {alerts.length > 0 && (
        <Card className="p-5 sm:p-6" style={{ borderColor: `${T.cta}40` }}>
          <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.cta }}>
            <Bell size={15} /> يقترب
          </p>
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 6).map(({ ev, on, left }) => {
              const k = kindOf(ev.kind);
              const Icon = k.icon;
              return (
                <button
                  key={`${ev.id}:${on}`}
                  onClick={() => setPicked(on)}
                  className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
                  style={{
                    borderColor: left <= 1 ? `${T.danger}4D` : "rgba(255,255,255,0.08)",
                    backgroundColor: left <= 1 ? `${T.danger}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={15} className="shrink-0" style={{ color: k.tint }} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {ev.title || k.label}
                  </span>
                  <span
                    className="shrink-0 text-[11px] font-extrabold"
                    style={{ color: left <= 1 ? T.danger : T.accent }}
                  >
                    {whenWord(on)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "month" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* RTL: the chevron pointing right walks back in time. */}
            <button
              onClick={() => shift(-1)}
              aria-label="الشهر السابق"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronRight size={16} />
            </button>
            <div className="text-center">
              <p className="text-[15px] font-extrabold" style={{ color: T.accent }}>
                {AR_MONTHS[cursor.m]}
              </p>
              <p dir="ltr" className="text-[11px] tabular-nums" style={{ color: T.faint }}>
                {cursor.y}
              </p>
            </div>
            <button
              onClick={() => shift(1)}
              aria-label="الشهر القادم"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEK_LABELS.map((w, i) => (
              <p
                key={i}
                className="text-center text-[10px] font-bold"
                style={{ color: T.faint }}
              >
                {w}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {month.cells.map((cell, i) => {
              if (!cell) return <div key={`b${i}`} />;
              const rows = byDate.get(cell.ds) || [];
              const due = dueByDate.get(cell.ds) || [];
              const total = rows.length + due.length;
              const isToday = cell.ds === dayKey();
              const open = rows.filter((r) => !isEventDone(r.ev, r.on)).length +
                due.filter((t) => !t.done).length;
              const dow = keyToDate(cell.ds)?.getDay();
              const weekend = dow === 5; // Friday
              return (
                <button
                  key={cell.ds}
                  onClick={() => setPicked(cell.ds)}
                  aria-label={`${arDate(cell.ds)}${total ? ` — ${total} عنصر` : ""}`}
                  className="group relative flex min-h-[62px] flex-col rounded-xl border p-1.5 text-right transition-all duration-200 hover:border-white/30 sm:min-h-[84px]"
                  style={{
                    borderColor: isToday ? `${T.cta}99` : "rgba(255,255,255,0.08)",
                    backgroundColor: isToday
                      ? `${T.cta}14`
                      : weekend
                        ? "rgba(255,255,255,0.015)"
                        : "rgba(255,255,255,0.03)",
                    boxShadow: isToday ? `0 0 18px -6px ${T.cta}99` : "none",
                  }}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span
                      dir="ltr"
                      className="text-[12px] font-extrabold tabular-nums"
                      style={{ color: isToday ? T.cta : total ? T.fg : T.faint }}
                    >
                      {cell.d}
                    </span>
                    {open > 0 && (
                      <span
                        dir="ltr"
                        className="rounded-md px-1 text-[9px] font-extrabold tabular-nums"
                        style={{ background: `${T.cta}26`, color: T.cta }}
                      >
                        {open}
                      </span>
                    )}
                  </span>

                  {/* Phones get dots, desktops get titles: at 375px a
                      truncated Arabic title in a 44px cell is noise. */}
                  <span className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                    {rows.slice(0, 4).map(({ ev, on }) => (
                      <span
                        key={ev.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: isEventDone(ev, on) ? T.primary : kindOf(ev.kind).tint,
                        }}
                      />
                    ))}
                    {/* Ringed, so a university deadline is visibly not one
                        of the calendar's own entries. */}
                    {due.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full border"
                        style={{
                          background: t.done ? T.primary : uniKindOf(t.kind).tint,
                          borderColor: "rgba(255,255,255,0.55)",
                        }}
                      />
                    ))}
                  </span>

                  <span className="mt-1 hidden min-w-0 flex-1 flex-col gap-0.5 sm:flex">
                    {rows.slice(0, 2).map(({ ev, on }) => {
                      const done = isEventDone(ev, on);
                      const tint = done ? T.primary : kindOf(ev.kind).tint;
                      return (
                        <span
                          key={ev.id}
                          className="truncate rounded px-1 py-0.5 text-[9.5px] font-bold"
                          style={{
                            background: `${tint}26`,
                            color: tint,
                            textDecoration: done ? "line-through" : "none",
                          }}
                        >
                          {ev.title || kindOf(ev.kind).label}
                        </span>
                      );
                    })}
                    {due.slice(0, 1).map((t) => (
                      <span
                        key={t.id}
                        className="truncate rounded px-1 py-0.5 text-[9.5px] font-bold"
                        style={{
                          background: `${uniKindOf(t.kind).tint}26`,
                          color: uniKindOf(t.kind).tint,
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {t.title || uniKindOf(t.kind).label}
                      </span>
                    ))}
                    {total > 3 && (
                      <span className="px-1 text-[9px]" style={{ color: T.faint }}>
                        {"+"}
                        <span dir="ltr" className="tabular-nums">
                          {total - 3}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "year" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setCursor((c) => ({ ...c, y: c.y - 1 }))}
              aria-label="السنة السابقة"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronRight size={16} />
            </button>
            <p
              dir="ltr"
              className="text-[19px] font-extrabold tabular-nums"
              style={{ color: T.accent }}
            >
              {cursor.y}
            </p>
            <button
              onClick={() => setCursor((c) => ({ ...c, y: c.y + 1 }))}
              aria-label="السنة القادمة"
              className="rounded-xl border p-2 transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {year.map((mo) => {
              const here =
                cursor.y === today.getFullYear() && mo.m === today.getMonth();
              const days = new Date(cursor.y, mo.m + 1, 0).getDate();
              return (
                <button
                  key={mo.m}
                  onClick={() => {
                    setCursor({ y: cursor.y, m: mo.m });
                    setView("month");
                  }}
                  className="rounded-2xl border p-3 text-right transition-all duration-200 hover:border-white/30"
                  style={{
                    borderColor: here ? `${T.cta}80` : T.border,
                    backgroundColor: here ? `${T.cta}14` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className="text-[12.5px] font-extrabold"
                      style={{ color: here ? T.cta : T.fg }}
                    >
                      {mo.label}
                    </span>
                    {mo.n > 0 && (
                      <span
                        dir="ltr"
                        className="rounded-md px-1.5 text-[9.5px] font-extrabold tabular-nums"
                        style={{ background: `${T.sky}26`, color: T.sky }}
                      >
                        {mo.n}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 grid grid-cols-7 gap-[3px]">
                    {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                      <span
                        key={d}
                        className="h-[7px] rounded-sm"
                        style={{
                          background: mo.days.has(d)
                            ? T.sky
                            : "rgba(255,255,255,0.07)",
                          boxShadow: mo.days.has(d) ? `0 0 6px ${T.sky}80` : "none",
                        }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "list" && (
        <Card className="p-5 sm:p-7">
          <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
            القادم
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            المتأخّر أولًا، ثم اليوم، ثم ما بعده — بلا بحث في الشهور.
          </p>
          {list.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] text-white/35">
                لا مواعيد مسجّلة بعد.
              </p>
              <Btn variant="default" size="sm" className="mt-4" onClick={() => openNew()}>
                <Plus size={14} strokeWidth={3} /> أضف أول موعد
              </Btn>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {list.map(({ ev, on, more }) => (
                <EventRow
                  key={`${ev.id}:${on}`}
                  ev={ev}
                  on={on}
                  showDate
                  more={more}
                  onToggle={() => toggle(ev.id, on)}
                  onEdit={() => setDraft({ ...ev })}
                  onDelete={() => remove(ev)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      <DaySheet
        open={!!picked}
        on={picked}
        rows={pickedRows}
        due={pickedDue}
        uni={uni}
        onClose={() => setPicked(null)}
        onAdd={() => {
          openNew(picked);
          setPicked(null);
        }}
        onToggle={toggle}
        onEdit={(ev) => {
          setDraft({ ...ev });
          setPicked(null);
        }}
        onDelete={remove}
        onGo={() => {
          setPicked(null);
          onGo("uni");
        }}
      />

      <EventModal
        open={!!draft}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setDraft(null)}
        onSave={save}
      />
    </div>
  );
}



function EventModal({ open, draft, setDraft, onClose, onSave }) {
  const [err, setErr] = useState("");
  const d = draft || {};
  const repeating = d.repeat && d.repeat !== "none";

  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.title || "").trim()) {
      setErr("اكتب عنوان الموعد أولًا.");
      return;
    }
    if (!isKey(d.date)) {
      setErr("التاريخ غير صالح.");
      return;
    }
    /* A repeat that ends before it starts is a repeat that never happens,
       and the grid would simply draw nothing — a save that looks like it
       worked and loses the entry. Refuse it with a reason instead. */
    if (repeating && d.until && d.until < d.date) {
      setErr("تاريخ انتهاء التكرار قبل تاريخ البداية.");
      return;
    }
    onSave();
  };

  const set = (patch) => setDraft((s) => ({ ...s, ...patch }));

  /* The title reads `isNew`, not `id`: every draft is born through
     `eventShape`, which hands it an id straight away, so an id proves
     nothing about whether this entry already exists. */
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.isNew ? "موعد جديد" : "تعديل الموعد"}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="los-ev-title" className="mb-1.5 block text-xs text-white/45">
            العنوان
          </label>
          <Field
            id="los-ev-title"
            autoFocus
            value={d.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: اختبار مبادئ الإدارة"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">النوع</span>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_KINDS.map((k) => {
              const on = d.kind === k.id;
              const Icon = k.icon;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => set({ kind: k.id })}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${k.tint}80` : T.border,
                    background: on ? `${k.tint}1F` : "rgba(255,255,255,0.03)",
                    color: on ? k.tint : T.muted,
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="los-ev-date" className="mb-1.5 block text-xs text-white/45">
              التاريخ
            </label>
            <DateField id="los-ev-date" value={d.date} onChange={(v) => set({ date: v })} />
          </div>
          <div>
            <label htmlFor="los-ev-time" className="mb-1.5 block text-xs text-white/45">
              الوقت <span style={{ color: T.faint }}>(اختياري)</span>
            </label>
            <TimeField id="los-ev-time" value={d.time} onChange={(v) => set({ time: v })} />
          </div>
        </div>

        <div>
          <label htmlFor="los-ev-place" className="mb-1.5 block text-xs text-white/45">
            المكان <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ev-place"
            value={d.place || ""}
            onChange={(e) => set({ place: e.target.value })}
            placeholder="مثال: قاعة ٢٠٣ — مبنى الإدارة"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">التكرار</span>
          <div className="grid grid-cols-2 gap-2">
            {REPEATS.map((r) => {
              const on = (d.repeat || "none") === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => set({ repeat: r.id, until: r.id === "none" ? null : d.until })}
                  aria-pressed={on}
                  className="rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.violet}80` : T.border,
                    background: on ? `${T.violet}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.violet : T.muted,
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {repeating && (
          <div className="los-in">
            <label htmlFor="los-ev-until" className="mb-1.5 block text-xs text-white/45">
              يتوقّف التكرار في <span style={{ color: T.faint }}>(اتركه فارغًا ليستمر)</span>
            </label>
            <div className="flex items-center gap-2">
              <DateField
                id="los-ev-until"
                value={d.until}
                min={d.date}
                onChange={(v) => set({ until: v || null })}
              />
              {d.until && (
                <Btn
                  variant="ghost"
                  size="icon"
                  onClick={() => set({ until: null })}
                  title="إلغاء تاريخ التوقّف"
                  style={{ borderColor: T.border }}
                >
                  <X size={14} />
                </Btn>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="mb-2 block text-xs text-white/45">
            ينبّهك قبل الموعد بـ
          </span>
          <div className="flex flex-wrap gap-2">
            {WARN_CHOICES.map((w) => {
              const on = Number(d.warn || 0) === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => set({ warn: w })}
                  aria-pressed={on}
                  className="rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.cta : T.muted,
                  }}
                >
                  {w === 0 ? (
                    "لا تنبيه"
                  ) : (
                    <>
                      <span dir="ltr" className="tabular-nums">
                        {w}
                      </span>{" "}
                      {dayWord(w)}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="los-ev-note" className="mb-1.5 block text-xs text-white/45">
            ملاحظة <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ev-note"
            as="textarea"
            rows={3}
            value={d.note || ""}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="ما يجب تحضيره، أو ما لا يجب أن تنساه"
            className="resize-y leading-relaxed"
          />
        </div>

        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{
              borderColor: `${T.danger}4D`,
              background: `${T.danger}14`,
              color: T.danger,
            }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}


/* A dated input that renders dark. Left to itself the native picker paints
   a white panel and a black glyph on a dark card — unreadable, and the icon
   disappears entirely. `colorScheme` is the one line that fixes both. */


/* One occurrence, as a row. The tick is per-day — the same weekly entry is
   ticked this Sunday and open the next — so the reward has to fire on the
   occurrence, not on the entry. */
function EventRow({ ev, on, onToggle, onEdit, onDelete, showDate = false, more = 0 }) {
  const k = kindOf(ev.kind);
  const Icon = k.icon;
  const done = isEventDone(ev, on);
  const late = !done && on < dayKey();
  const [burst, fireBurst] = useBurst(700);
  const rep = repeatOf(ev.repeat);

  const handle = () => {
    if (!done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-start gap-2 rounded-xl border p-2.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : late
            ? `${T.danger}4D`
            : "rgba(255,255,255,0.08)",
        backgroundColor: burst
          ? `${T.primary}26`
          : done
            ? `${T.primary}0F`
            : late
              ? `${T.danger}0F`
              : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: done ? `${T.primary}59` : `${k.tint}45`,
          background: done ? `${T.primary}1A` : `${k.tint}18`,
          color: done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            checked={done}
            onToggle={handle}
            label={ev.title || k.label}
            tint={T.primary}
            size="sm"
          />
          <button
            onClick={onEdit}
            aria-label={`تعديل ${ev.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`حذف ${ev.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-1.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {showDate && (
            <span
              className="inline-flex items-center gap-1"
              style={{ color: late ? T.danger : T.faint }}
            >
              <CalendarDays size={10} />
              {arDate(on)}
            </span>
          )}
          {ev.time && (
            <span className="inline-flex items-center gap-1" style={{ color: T.muted }}>
              <Clock size={10} />
              <span dir="ltr" className="tabular-nums">
                {prettyTime(ev.time)}
              </span>
            </span>
          )}
          {ev.place && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: T.faint }}>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{ev.place}</span>
            </span>
          )}
          {rep.short && (
            <span className="inline-flex items-center gap-1" style={{ color: T.violet }}>
              <Repeat size={10} />
              {rep.short}
              {/* The row stands for the whole series in the summary list, so
                  it has to say how much of the series it is standing for —
                  otherwise collapsing fifty occurrences into one reads as
                  forty-nine of them having gone missing. */}
              {more > 0 && (
                <span className="font-bold">
                  {"+ "}
                  <span dir="ltr" className="tabular-nums">
                    {more}
                  </span>{" "}
                  {timesWord(more)}
                </span>
              )}
            </span>
          )}
          {!done && (
            <span
              className="font-bold"
              style={{ color: late ? T.danger : on === dayKey() ? T.cta : T.faint }}
            >
              {whenWord(on)}
            </span>
          )}
        </div>

        {ev.note && (
          <p
            className="mt-1.5 whitespace-pre-wrap pr-1.5 text-[11px] leading-relaxed"
            style={{ color: T.muted }}
          >
            {ev.note}
          </p>
        )}
      </div>
    </div>
  );
}


/* Module scope, not a closure inside LifeOS — defining it inline gave the
   nav a new component type every render, so React tore down and rebuilt
   every button, dropping focus and restarting transitions mid-flight. */
/* ==================================================================== *
 *  MODULE — the calendar: months, years, and the things that matter on them
 * ==================================================================== */

const AGENDA_VIEWS = [
  { id: "month", label: "الشهر", icon: CalendarDays },
  { id: "year", label: "السنة", icon: LayoutGrid },
  { id: "list", label: "القادم", icon: ListChecks },
];


/* One square, opened. Everything written on that day in one place —
   the calendar's own entries and, below them, what the university screen
   has due. */
function DaySheet({ open, on, rows, due, uni, onClose, onAdd, onToggle, onEdit, onDelete, onGo }) {
  const d = keyToDate(on);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d ? `${DOW_AR[d.getDay()]} · ${arDate(on)}` : "اليوم"}
      footer={
        <Btn variant="default" className="flex-1" onClick={onAdd}>
          <Plus size={15} strokeWidth={3} /> أضف في هذا اليوم
        </Btn>
      }
    >
      <div className="space-y-4">
        {on === dayKey() && (
          <Badge tint={T.cta}>
            <CircleDot size={11} /> اليوم
          </Badge>
        )}

        {rows.length === 0 && due.length === 0 ? (
          <p className="py-6 text-center text-[12px] leading-relaxed text-white/30">
            لا شيء في هذا اليوم.
            <span className="mt-1 block text-[11px] text-white/20">
              يوم فارغ في التقويم ليس يومًا فارغًا في عمرك.
            </span>
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map(({ ev }) => (
              <EventRow
                key={ev.id}
                ev={ev}
                on={on}
                onToggle={() => onToggle(ev.id, on)}
                onEdit={() => onEdit(ev)}
                onDelete={() => onDelete(ev)}
              />
            ))}
          </div>
        )}

        {due.length > 0 && (
          <div>
            <p
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold"
              style={{ color: T.faint }}
            >
              <GraduationCap size={12} /> من الجامعة
            </p>
            <div className="space-y-2">
              {due.map((t) => (
                <UniDueRow
                  key={t.id}
                  task={t}
                  course={courseIn(uni, t.course)}
                  onGo={onGo}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


/* The university's deadlines, read-only here. They belong to the other
   screen and are shown rather than copied — one due date, one owner. */
function UniDueRow({ task, course, onGo }) {
  const k = uniKindOf(task.kind);
  const Icon = k.icon;
  return (
    <button
      onClick={onGo}
      className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
      style={{
        borderColor: task.done ? `${T.primary}33` : `${k.tint}33`,
        backgroundColor: task.done ? `${T.primary}0D` : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: task.done ? `${T.primary}59` : `${k.tint}45`,
          background: task.done ? `${T.primary}1A` : `${k.tint}18`,
          color: task.done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[13px] font-bold"
          style={{
            color: task.done ? T.primary : T.fg,
            textDecoration: task.done ? "line-through" : "none",
          }}
        >
          {task.title || k.label}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {course && <span style={{ color: T.faint }}>{courseName(course)}</span>}
          {task.time && (
            <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
              {prettyTime(task.time)}
            </span>
          )}
        </span>
      </span>
      <ArrowLeft size={14} className="shrink-0" style={{ color: T.faint }} />
    </button>
  );
}

