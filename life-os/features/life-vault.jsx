import { Btn, Card, Field, Modal, StarRating, T, countedWord, shrinkImage, useUndo, COVER_STEPS } from "../components/life-shared.jsx";
import { addDays, bookShape, dayKey, goalPct, noteDue, noteShape, pctOf, readStreak, rows, sumPages, uid, dueNotes, reviewedNote, readPace, pagesLeft, BOOK_CATEGORIES, IDENTITIES, taskShape, habitShape } from "../state/life-state.mjs";
import { CheckCheck, ChevronDown, ChevronUp, Copy, ImagePlus, NotebookPen, Pencil, Plus, Trash2, Brain, Zap, Trophy, Clock, Sparkles, BookOpen, Tag, Search, Share2, Play, Pause, RotateCcw, X, Bot, Compass, Check, Flame, MessageSquareQuote } from "lucide-react";
import { runLifeAgent } from "../utils/life-agent.js";
import { useState, useMemo } from "react";

/* ==================================================================== *
 * THE SHELF AND THE DESK — مكتبة الإنجازات
 *
 * A shelf that holds only titles and a star rating is a list, not a library.
 * The card stays scannable — a progress bar and a note count — and `BookDesk`
 * is where the reading actually lives: the summary, the points with the page
 * each came from, where the reading has reached, and the one takeaway.
 * ==================================================================== */


export function VaultModule({ state, setState }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deskId, setDeskId] = useState(null);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [deepReadingBook, setDeepReadingBook] = useState(null);
  const [capsuleBook, setCapsuleBook] = useState(null);
  const [aiModalBook, setAiModalBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const arm = useUndo();

  const logQuickPages = (b, count) => {
    const at = parseInt(b.page, 10) || 0;
    const total = parseInt(b.pages, 10);
    const newAt = Number.isFinite(total) && total > 0 ? Math.min(total, at + count) : at + count;
    const actualAdded = newAt - at;
    if (actualAdded <= 0) return;
    const isFinishing = Number.isFinite(total) && total > 0 && newAt >= total;

    setState((s) => ({
      ...s,
      books: s.books.map((x) =>
        x.id === b.id
          ? {
              ...x,
              page: String(newAt),
              status: isFinishing ? "finished" : x.status,
              finishedAt: isFinishing ? (x.finishedAt || dayKey()) : x.finishedAt,
            }
          : x,
      ),
      reading: [
        ...(s.reading || []),
        { id: uid(), bookId: b.id, date: dayKey(), pages: actualAdded },
      ],
    }));
  };

  const handleFinishDeepSession = (b, pagesRead, noteText, minutesSpent) => {
    const at = parseInt(b.page, 10) || 0;
    const total = parseInt(b.pages, 10);
    const newAt = Number.isFinite(total) && total > 0 ? Math.min(total, at + pagesRead) : at + pagesRead;
    const isFinishing = Number.isFinite(total) && total > 0 && newAt >= total;

    setState((s) => {
      const nextBooks = s.books.map((x) => {
        if (x.id !== b.id) return x;
        const updatedNotes = noteText.trim()
          ? [
              ...(x.notes || []),
              noteShape({
                text: noteText.trim(),
                page: String(newAt),
                at: dayKey(),
                due: addDays(dayKey(), 1),
              }),
            ]
          : x.notes || [];

        return {
          ...x,
          page: String(newAt),
          notes: updatedNotes,
          status: isFinishing ? "finished" : x.status,
          finishedAt: isFinishing ? (x.finishedAt || dayKey()) : x.finishedAt,
        };
      });

      const nextReading = pagesRead > 0
        ? [...(s.reading || []), { id: uid(), bookId: b.id, date: dayKey(), pages: pagesRead }]
        : s.reading || [];

      return {
        ...s,
        books: nextBooks,
        reading: nextReading,
      };
    });
    setDeepReadingBook(null);
  };

  const waitingNotesList = useMemo(() => dueNotes(state.books), [state.books]);

  const handleReviewNote = (bookId, noteId, kept) => {
    setState((s) => ({
      ...s,
      books: s.books.map((b) => {
        if (b.id !== bookId) return b;
        return {
          ...b,
          notes: (b.notes || []).map((n) => (n.id === noteId ? reviewedNote(n, kept) : n)),
        };
      }),
    }));
  };

  const handleTurnIntoTask = (text, bookTitle) => {
    const newTask = taskShape({
      id: uid(),
      text: `تطبيق من [${bookTitle}]: ${text.slice(0, 90)}`,
      priority: "p1",
      scheduled: true,
      createdAt: dayKey(),
    });
    setState((s) => ({ ...s, tasks: [newTask, ...s.tasks] }));
  };

  const handleTurnIntoHabit = (text, bookTitle) => {
    const newHabit = habitShape({
      id: uid(),
      name: `عادة [${bookTitle}]: ${text.slice(0, 45)}`,
      identity: "scholar",
      freq: "daily",
    });
    setState((s) => ({ ...s, habits: [...s.habits, newHabit] }));
  };

  const save = () => {
    const title = editing.title.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      books: editing.id
        ? s.books.map((b) => (b.id === editing.id ? { ...editing, title } : b))
        : [bookShape({ ...editing, id: uid(), title }), ...s.books],
    }));
    setEditing(null);
  };

  const patch = (next) =>
    setState((s) => ({
      ...s,
      books: s.books.map((b) => (b.id === next.id ? next : b)),
    }));

  /* Finishing a book stamps the date once. Moving it back out clears the
     stamp, so the shelf never claims a finish that was undone. */
  const setStatus = (b, status) =>
    patch({
      ...b,
      status,
      finishedAt:
        status === "finished" ? b.finishedAt || dayKey() : null,
    });

  const remove = (id) => {
    /* The reading log stays — it records evenings that happened, and a book
       removed from the shelf does not un-read them — so only the shelf is
       held aside. */
    arm("حُذف الكتاب", { books: state.books });
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));
  };

  const qLower = searchQuery.trim().toLowerCase();
  const shown = state.books.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (selectedCategory !== "all" && b.category !== selectedCategory) return false;
    if (!qLower) return true;
    const inTitle = (b.title || "").toLowerCase().includes(qLower);
    const inAuthor = (b.author || "").toLowerCase().includes(qLower);
    const inLesson = (b.lesson || "").toLowerCase().includes(qLower);
    const inNotes = (b.notes || []).some((n) => (n.text || "").toLowerCase().includes(qLower));
    return inTitle || inAuthor || inLesson || inNotes;
  });
  const finished = state.books.filter((b) => b.status === "finished").length;
  const noteCount = state.books.reduce(
    (n, b) => n + (b.notes?.length || 0),
    0,
  );
  const pagesRead = state.books.reduce((n, b) => {
    const at = parseInt(b.page, 10);
    return n + (Number.isFinite(at) ? at : 0);
  }, 0);
  const desk = state.books.find((b) => b.id === deskId) || null;

  const log = state.reading || [];
  const goal = state.readGoal || 0;
  const today = dayKey();
  const month = today.slice(0, 7);
  const todayPages = sumPages(log.filter((r) => r.date === today));
  const monthPages = sumPages(log.filter((r) => r.date.startsWith(month)));
  const monthFinished = state.books.filter(
    (b) => b.status === "finished" && (b.finishedAt || "").startsWith(month),
  ).length;
  const streak = readStreak(log, goal);
  const goalPct = goal > 0 ? Math.min(100, Math.round((todayPages / goal) * 100)) : 0;

  const currentYear = today.slice(0, 4);
  const yearFinished = state.books.filter(
    (b) => b.status === "finished" && (b.finishedAt || "").startsWith(currentYear),
  ).length;
  const yearTarget = state.readYearGoal || 12;

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">مكتبة الإنجازات</h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
              {finished} كتابًا مُنهًى من {state.books.length}. الكتاب بلا درس
              مكتوب لم يُقرأ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFlashcardsOpen(true)}
              className="relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all"
              style={{
                borderColor: waitingNotesList.length > 0 ? `${T.accent}80` : T.border,
                background: waitingNotesList.length > 0 ? `${T.accent}1F` : "rgba(255,255,255,0.03)",
                color: waitingNotesList.length > 0 ? T.accent : T.muted,
                boxShadow: waitingNotesList.length > 0 ? `0 0 16px ${T.accent}33` : "none",
              }}
            >
              <Brain size={15} />
              <span>استذكار الفوائد</span>
              {waitingNotesList.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-black tabular-nums">
                  {waitingNotesList.length}
                </span>
              )}
            </button>
            <Btn
              variant="default"
              onClick={() => setEditing(bookShape())}
            >
              <Plus size={15} strokeWidth={3} /> أضف كتابًا
            </Btn>
          </div>
        </div>

        {/* what the shelf has cost you so far */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { n: finished, k: "كتابًا مُنهًى", tint: T.primary },
            { n: noteCount, k: "نقطة محفوظة", tint: T.accent },
            { n: pagesRead, k: "صفحة مقروءة", tint: T.sky },
            { n: `${yearFinished}/${yearTarget}`, k: `تحدي ${currentYear}`, tint: "#a855f7" },
          ].map((c) => (
            <div
              key={c.k}
              className="rounded-2xl border px-2 py-2.5 text-center"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              <p
                dir="ltr"
                className="text-[19px] font-extrabold tabular-nums"
                style={{ color: c.tint }}
              >
                {c.n}
              </p>
              <p className="text-[9.5px]" style={{ color: T.faint }}>
                {c.k}
              </p>
            </div>
          ))}
        </div>

        {/* what the reading habit has actually produced */}
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{ borderColor: `${T.sky}33`, background: `${T.sky}0D` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-bold" style={{ color: T.sky }}>
              متتبّع القراءة
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="los-read-goal" className="text-[10.5px] text-white/40">
                هدف اليوم
              </label>
              <input
                id="los-read-goal"
                value={state.readGoal}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setState((s) => ({
                    ...s,
                    readGoal: Number.isFinite(v) && v > 0 ? v : 0,
                  }));
                }}
                inputMode="numeric"
                className="w-14 rounded-lg border bg-transparent px-2 py-1 text-center text-[11px] tabular-nums text-white/85 outline-none focus:border-white/30"
                style={{ borderColor: T.border }}
              />
              <span className="text-[10.5px] text-white/40">صفحة</span>
            </div>
          </div>

          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${goalPct}%`,
                backgroundImage: `linear-gradient(90deg, ${
                  goalPct >= 100 ? T.primary : T.sky
                }, ${goalPct >= 100 ? T.primaryLift : T.accent})`,
                boxShadow: `0 0 12px ${goalPct >= 100 ? T.primary : T.sky}99`,
              }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
            {[
              { n: todayPages, k: "اليوم", tint: goalPct >= 100 ? T.primary : T.sky },
              { n: streak, k: countedWord(streak), tint: T.ember },
              { n: monthPages, k: "صفحة/الشهر", tint: T.accent },
              { n: monthFinished, k: "كتاب/الشهر", tint: T.primary },
            ].map((c) => (
              <div key={c.k}>
                <p
                  dir="ltr"
                  className="text-[16px] font-extrabold tabular-nums"
                  style={{ color: c.tint }}
                >
                  {c.n}
                </p>
                <p className="text-[9px]" style={{ color: T.faint }}>
                  {c.k}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 🔍 شريط البحث الشامل وفلاتر التصنيف */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في عناوين الكتب، المؤلفين، أو داخل نصوص الفوائد والاقتباسات…"
            className="w-full rounded-2xl border bg-black/30 py-2.5 pr-10 pl-10 text-xs text-white/90 outline-none transition-all placeholder:text-white/25 focus:border-sky-500/50 focus:bg-black/50"
            style={{ borderColor: T.border }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/30 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* فلاتر التصنيف */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <span className="text-[10px] text-white/35 ml-1">التصنيف:</span>
          {[
            { id: "all", label: "كافة التصنيفات", tint: T.accent },
            ...BOOK_CATEGORIES,
          ].map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className="rounded-xl border px-3 py-1 text-[10.5px] font-bold transition-all"
                style={{
                  borderColor: active ? `${c.tint}80` : T.border,
                  background: active ? `${c.tint}1A` : "rgba(255,255,255,0.02)",
                  color: active ? c.tint : T.muted,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل", tint: T.accent },
          ...Object.entries(BOOK_STATUS).map(([id, v]) => ({
            id,
            label: v.label,
            tint: v.tint,
          })),
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className="rounded-xl border px-4 py-2 text-xs font-bold transition-all"
              style={{
                borderColor: active ? `${f.tint}70` : T.border,
                background: active ? `${f.tint}16` : "rgba(255,255,255,0.03)",
                color: active ? f.tint : T.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا كتب في هذا التصنيف بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((b) => {
            const meta = BOOK_STATUS[b.status] || BOOK_STATUS.planned;
            const categoryObj = BOOK_CATEGORIES.find((c) => c.id === b.category);
            const identityObj = IDENTITIES[b.identity] || IDENTITIES.scholar;
            const pace = b.status === "reading" ? readPace(b, log) : null;
            return (
              <Card
                key={b.id}
                className="group los-raise flex gap-4 p-4"
              >
                {/* spine + cover */}
                <div
                  className="relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-lg border"
                  style={{
                    borderColor: b.cover ? `${meta.tint}55` : `${meta.tint}33`,
                    boxShadow: b.cover ? `0 8px 30px -8px ${meta.tint}60` : `0 4px 20px -8px ${meta.tint}40`,
                  }}
                >
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.title}
                      className="los-cover-in h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center"
                      style={{
                        background: `linear-gradient(160deg, ${meta.tint}45 0%, ${T.bgDeep} 72%)`,
                      }}
                    >
                      {/* inner glow blob */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          background: `radial-gradient(ellipse 80% 55% at 50% 25%, ${meta.tint}55, transparent)`,
                        }}
                      />
                      <span
                        className="relative z-10 font-black leading-none"
                        style={{
                          fontSize: 44,
                          color: `${meta.tint}EE`,
                          textShadow: `0 0 28px ${meta.tint}BB, 0 0 6px ${meta.tint}`,
                        }}
                      >
                        {b.title.trim().charAt(0) || "؟"}
                      </span>
                      <span className="relative z-10 mt-2 px-1 text-center line-clamp-2 text-[8px] leading-tight text-white/35">
                        {b.title}
                      </span>
                    </div>
                  )}
                  {/* spine */}
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 w-[5px]"
                    style={{ background: `linear-gradient(to bottom, ${meta.tint}99, ${meta.tint}44)` }}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-white/90">
                        {b.title}
                      </h3>
                      <p className="truncate text-[11px] text-white/35">
                        {b.author || "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {categoryObj && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold border"
                            style={{
                              borderColor: `${categoryObj.tint}33`,
                              background: `${categoryObj.tint}12`,
                              color: categoryObj.tint,
                            }}
                          >
                            <Tag size={8} /> {categoryObj.label}
                          </span>
                        )}
                        {identityObj && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold border"
                            style={{
                              borderColor: `${identityObj.tint}33`,
                              background: `${identityObj.tint}12`,
                              color: identityObj.tint,
                            }}
                          >
                            {identityObj.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => setEditing({ ...b })}
                        aria-label={`تعديل ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-white/70"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label={`حذف ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b, e.target.value)}
                      aria-label={`حالة ${b.title}`}
                      className="rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] outline-none"
                      style={{
                        borderColor: `${meta.tint}44`,
                        color: meta.tint,
                        background: `${meta.tint}12`,
                      }}
                    >
                      {Object.entries(BOOK_STATUS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: T.cardSolid }}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <StarRating
                      value={b.rating}
                      onChange={(rating) => patch({ ...b, rating })}
                    />
                    {b.status === "finished" && b.finishedAt && (
                      <span
                        dir="ltr"
                        className="text-[9.5px] tabular-nums"
                        style={{ color: T.faint }}
                      >
                        {b.finishedAt}
                      </span>
                    )}
                  </div>

                  {pace && pace.days !== null && (
                    <div
                      className="mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold"
                      style={{ borderColor: `${T.sky}33`, background: `${T.sky}0D`, color: T.sky }}
                    >
                      <Zap size={10} />
                      <span>معدل {pace.perDay.toFixed(1)} ص/يوم · ختم متوقع خلال {pace.days} يوم</span>
                    </div>
                  )}
                  {pctOf(b) !== null && (
                    <div className="mt-2">
                      <div
                        className="h-1 w-full overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pctOf(b)}%`,
                            backgroundImage: `linear-gradient(90deg, ${meta.tint}, ${T.accent})`,
                            boxShadow: `0 0 10px ${meta.tint}88`,
                          }}
                        />
                      </div>
                      <p
                        dir="ltr"
                        className="mt-1 text-left text-[9.5px] tabular-nums"
                        style={{ color: T.faint }}
                      >
                        {b.page} / {b.pages}
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 flex-1">
                    <label
                      htmlFor={`los-lesson-${b.id}`}
                      className="mb-1 block text-[10px]"
                      style={{ color: `${T.accent}AA` }}
                    >
                      أهم درس يغيّر حياتي
                    </label>
                    <textarea
                      id={`los-lesson-${b.id}`}
                      value={b.lesson}
                      onChange={(e) => patch({ ...b, lesson: e.target.value })}
                      rows={2}
                      placeholder="اكتب الدرس الواحد الذي ستطبّقه…"
                      className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-[11.5px] leading-relaxed text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    />
                  </div>

                  {/* ⚡ شريط تسجيل القراءة السريع إذا كان الكتاب قيد القراءة */}
                  {b.status === "reading" && (
                    <div className="mt-2.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.04] p-2">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-sky-400 flex items-center gap-1">
                          <Zap size={11} /> تسجيل قراءة سريعة:
                        </span>
                        <span className="text-[10px] text-white/40">
                          ص <span className="font-bold text-white tabular-nums">{b.page || 0}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {[10, 20, 30].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => logQuickPages(b, inc)}
                            className="flex-1 rounded-lg border border-sky-500/30 bg-sky-500/10 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25 active:scale-95 transition-all"
                            title={`إضافة ${inc} صفحة لسجل اليوم وتحديث الختم`}
                          >
                            +{inc} ص
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDeepReadingBook(b)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all"
                          title="بدء جلسة قراءة عميقة بمؤقت"
                        >
                          <Clock size={10} /> جلسة زن
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 🪄 أزرار الكبسولة ودفتر الكتاب والمستشار الذكي */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => setDeskId(b.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        borderColor: `${T.accent}3D`,
                        background: `${T.accent}0F`,
                        color: T.accent,
                      }}
                    >
                      <NotebookPen size={13} /> دفتر الكتاب
                      {(b.notes?.length || 0) > 0 && (
                        <span dir="ltr" className="tabular-nums opacity-70">
                          ({b.notes.length})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapsuleBook(b)}
                      className="flex items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-[10.5px] font-bold text-purple-300 hover:bg-purple-500/20 transition-all"
                      title="عرض بطاقة كبسولة الكتاب للمشاركة"
                    >
                      <Share2 size={12} /> كبسولة
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiModalBook(b)}
                      className="flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10.5px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                      title="المستشار الذكي للكتاب (توليد مهام وأسئلة نقاش)"
                    >
                      <Bot size={12} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BookDesk
        book={desk}
        log={desk ? log.filter((r) => r.bookId === desk.id) : []}
        onClose={() => setDeskId(null)}
        onPatch={patch}
        onDelete={
          desk
            ? () => {
                remove(desk.id);
                setDeskId(null);
              }
            : undefined
        }
        onTurnIntoTask={(text) => handleTurnIntoTask(text, desk?.title || "")}
        onTurnIntoHabit={(text) => handleTurnIntoHabit(text, desk?.title || "")}
      />

      <BookFlashcardsModal
        open={flashcardsOpen}
        onClose={() => setFlashcardsOpen(false)}
        books={state.books}
        onReview={handleReviewNote}
        onTurnIntoTask={handleTurnIntoTask}
        onTurnIntoHabit={handleTurnIntoHabit}
      />

      <DeepReadingModal
        book={deepReadingBook}
        onClose={() => setDeepReadingBook(null)}
        onFinish={handleFinishDeepSession}
      />

      <BookCapsuleModal
        book={capsuleBook}
        onClose={() => setCapsuleBook(null)}
      />

      <AIBookModal
        book={aiModalBook}
        onClose={() => setAiModalBook(null)}
        state={state}
        setState={setState}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الكتاب" : "كتاب جديد"}
        onDelete={
          editing?.id
            ? () => {
                remove(editing.id);
                setEditing(null);
              }
            : undefined
        }
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {/* cover upload */}
            <div>
              <span className="mb-1.5 block text-xs text-white/45">غلاف الكتاب</span>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all duration-200 hover:border-white/30"
                style={{
                  borderColor: editing.cover ? `${T.accent}55` : T.border,
                  background: editing.cover ? "transparent" : "rgba(255,255,255,0.03)",
                  height: editing.cover ? "auto" : 64,
                }}
              >
                {editing.cover ? (
                  <div className="relative w-full">
                    <img
                      src={editing.cover}
                      alt="غلاف"
                      className="max-h-40 w-full object-contain"
                    />
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border px-3 py-1 text-[10px] font-bold"
                      style={{ borderColor: T.border, background: `${T.bgDeep}D9`, color: T.muted }}
                    >
                      تغيير الصورة
                    </span>
                  </div>
                ) : (
                  <span className="flex flex-col items-center gap-1" style={{ color: T.muted }}>
                    <ImagePlus size={20} />
                    <span className="text-[11px]">رفع غلاف (اختياري)</span>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await shrinkImage(file, COVER_STEPS);
                      setEditing((s) => ({ ...s, cover: data }));
                    } catch {/* ignore */ }
                  }}
                />
              </label>
              {editing.cover && (
                <button
                  type="button"
                  className="mt-1.5 text-[10.5px] text-white/30 hover:text-red-400 transition-colors"
                  onClick={() => setEditing((s) => ({ ...s, cover: "" }))}
                >
                  حذف الصورة
                </button>
              )}
            </div>
            <div>
              <label htmlFor="los-b-title" className="mb-1.5 block text-xs text-white/45">
                العنوان
              </label>
              <Field
                id="los-b-title"
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                placeholder="مثال: العادات الذرية"
              />
            </div>
            <div>
              <label htmlFor="los-b-author" className="mb-1.5 block text-xs text-white/45">
                المؤلف
              </label>
              <Field
                id="los-b-author"
                value={editing.author}
                onChange={(e) => setEditing((s) => ({ ...s, author: e.target.value }))}
                placeholder="مثال: جيمس كلير"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/45">التقييم</span>
              <StarRating
                value={editing.rating}
                size={18}
                onChange={(rating) => setEditing((s) => ({ ...s, rating }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الحالة</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BOOK_STATUS).map(([k, v]) => {
                  const active = editing.status === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setEditing((s) => ({ ...s, status: k }))}
                      aria-pressed={active}
                      className="rounded-xl border px-2 py-2 text-[11.5px] font-bold transition-all"
                      style={{
                        borderColor: active ? `${v.tint}80` : T.border,
                        background: active ? `${v.tint}16` : "transparent",
                        color: active ? v.tint : T.muted,
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-xs text-white/45">التصنيف</label>
                <select
                  value={editing.category || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value }))}
                  className="w-full rounded-xl border bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none"
                  style={{ borderColor: T.border }}
                >
                  <option value="">— اختر تصنيفًا —</option>
                  {BOOK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#111" }}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/45">الهوية / الركيزة</label>
                <select
                  value={editing.identity || "scholar"}
                  onChange={(e) => setEditing((s) => ({ ...s, identity: e.target.value }))}
                  className="w-full rounded-xl border bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none"
                  style={{ borderColor: T.border }}
                >
                  {Object.values(IDENTITIES).map((id) => (
                    <option key={id.id} value={id.id} style={{ background: "#111" }}>
                      {id.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="los-b-pages" className="mb-1.5 block text-xs text-white/45">إجمالي الصفحات</label>
                <Field
                  id="los-b-pages"
                  type="number"
                  min="1"
                  dir="ltr"
                  value={editing.pages}
                  onChange={(e) => setEditing((s) => ({ ...s, pages: e.target.value }))}
                  placeholder="300"
                />
              </div>
              <div>
                <label htmlFor="los-b-page" className="mb-1.5 block text-xs text-white/45">الصفحة الحالية</label>
                <Field
                  id="los-b-page"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={editing.page}
                  onChange={(e) => setEditing((s) => ({ ...s, page: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label htmlFor="los-b-lesson" className="mb-1.5 block text-xs text-white/45">
                أهم درس يغيّر حياتي
              </label>
              <Field
                as="textarea"
                id="los-b-lesson"
                rows={3}
                value={editing.lesson}
                onChange={(e) => setEditing((s) => ({ ...s, lesson: e.target.value }))}
                placeholder="الدرس الواحد الذي ستطبّقه…"
                className="resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


/* A book's own desk: the summary, the points taken from it, and where the
   reading has reached. Kept in a modal rather than on the card, because the
   card has to stay scannable — this is the place you come back to, not the
   place you glance at. */
function BookDesk({ book, log = [], onClose, onPatch, onDelete, onTurnIntoTask, onTurnIntoHabit }) {
  const [draft, setDraft] = useState({ text: "", page: "" });
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const notes = book.notes || [];
  const meta = BOOK_STATUS[book.status] || BOOK_STATUS.planned;

  /* Through `noteShape`, like every other row in this app is written by its
     shape. It is what puts the point into the review rotation — `due`
     tomorrow, box zero — and a point typed here has to enter it on exactly
     the same terms as one sent from the phone, or the half of the library
     written at a laptop would quietly never come back. */
  const addNote = () => {
    const text = draft.text.trim();
    if (!text) return;
    onPatch({
      ...book,
      notes: [
        ...notes,
        noteShape({
          text,
          page: draft.page.trim(),
          at: dayKey(),
          due: addDays(dayKey(), 1),
        }),
      ],
    });
    setDraft({ text: "", page: "" });
  };

  const dropNote = (id) =>
    onPatch({ ...book, notes: notes.filter((n) => n.id !== id) });

  const moveNote = (id, dir) => {
    const i = notes.findIndex((n) => n.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= notes.length) return;
    const next = notes.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onPatch({ ...book, notes: next });
  };

  /* Everything written about the book, as plain text — so a summary can
     leave the app without an export of the whole state. */
  const copyAll = async () => {
    const lines = [
      `${book.title}${book.author ? ` — ${book.author}` : ""}`,
      "",
      book.lesson ? `أهم درس: ${book.lesson}` : "",
      book.summary ? `\nالملخّص:\n${book.summary}` : "",
      notes.length
        ? `\nالنقاط:\n${notes
            .map((n) => `• ${n.text}${n.page ? ` (ص ${n.page})` : ""}`)
            .join("\n")}`
        : "",
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is still on screen to select */
    }
  };

  const total = parseInt(book.pages, 10);
  const at = parseInt(book.page, 10);
  const pct = pctOf(book);

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      title={book.title || "دفتر الكتاب"}
      onDelete={book ? onDelete : undefined}
      footer={
        <>
          <Btn variant="outline" className="flex-1" onClick={copyAll}>
            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
            {copied ? "نُسخ" : "نسخ الكل"}
          </Btn>
          <Btn variant="default" className="flex-1" onClick={onClose}>
            تمّ
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <p className="-mt-2 text-[11px]" style={{ color: T.faint }}>
          {book.author || "بلا مؤلّف"} · {meta.label}
        </p>

        {/* where the reading has reached */}
        <div
          className="space-y-2.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <span className="block text-xs text-white/45">أين وصلت</span>
          <div className="flex items-center gap-2">
            <input
              id={`los-page-${book.id}`}
              value={book.page}
              onChange={(e) => onPatch({ ...book, page: e.target.value })}
              inputMode="numeric"
              aria-label="الصفحة الحالية"
              placeholder="الصفحة"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm tabular-nums text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
            <span className="shrink-0 text-xs text-white/30">من</span>
            <input
              id={`los-pages-${book.id}`}
              value={book.pages}
              onChange={(e) => onPatch({ ...book, pages: e.target.value })}
              inputMode="numeric"
              aria-label="عدد صفحات الكتاب"
              placeholder="الصفحات"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm tabular-nums text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
          </div>
          {pct !== null && (
            <>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundImage: `linear-gradient(90deg, ${meta.tint}, ${T.accent})`,
                    boxShadow: `0 0 12px ${meta.tint}99`,
                  }}
                />
              </div>
              <p className="text-[10.5px]" style={{ color: T.faint }}>
                <span dir="ltr" className="tabular-nums">
                  {pct}%
                </span>{" "}
                — بقي{" "}
                <span dir="ltr" className="tabular-nums">
                  {Math.max(0, total - at)}
                </span>{" "}
                صفحة
              </p>
            </>
          )}
        </div>

        {/* the one takeaway */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor={`los-desk-lesson-${book.id}`}
              className="block text-xs"
              style={{ color: `${T.accent}CC` }}
            >
              أهم درس يغيّر حياتي
            </label>
            {book.lesson && onTurnIntoTask && (
              <button
                type="button"
                onClick={() => onTurnIntoTask(book.lesson)}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Zap size={10} /> ⚡ حوّل لخطة عمل
              </button>
            )}
          </div>
          <textarea
            id={`los-desk-lesson-${book.id}`}
            value={book.lesson}
            onChange={(e) => onPatch({ ...book, lesson: e.target.value })}
            rows={2}
            placeholder="الدرس الواحد الذي ستطبّقه…"
            className="w-full resize-none rounded-xl border bg-transparent px-3 py-2.5 text-[12.5px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
            style={{ borderColor: T.border }}
          />
        </div>

        {/* the summary */}
        <div>
          <label
            htmlFor={`los-summary-${book.id}`}
            className="mb-1.5 block text-xs text-white/45"
          >
            ملخّص الكتاب
          </label>
          <textarea
            id={`los-summary-${book.id}`}
            value={book.summary}
            onChange={(e) => onPatch({ ...book, summary: e.target.value })}
            rows={6}
            placeholder="لخّصه بكلماتك أنت — الفكرة الكبرى، وكيف بناها المؤلّف…"
            className="w-full resize-y rounded-xl border bg-transparent px-3 py-2.5 text-[12.5px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
            style={{ borderColor: T.border }}
          />
        </div>

        {/* every session this book has had */}
        {log.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs text-white/45">
              سجلّ القراءة{" "}
              <span dir="ltr" className="tabular-nums" style={{ color: T.sky }}>
                ({sumPages(log)} صفحة)
              </span>
            </span>
            <div
              className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border p-2.5"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
            >
              {[...log]
                .reverse()
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span dir="ltr" className="text-[10.5px] tabular-nums" style={{ color: T.faint }}>
                      {r.date}
                    </span>
                    <span
                      dir="ltr"
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: T.sky }}
                    >
                      +{r.pages}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* the points */}
        <div>
          <span className="mb-1.5 block text-xs text-white/45">
            نقاط ومقتطفات{" "}
            {notes.length > 0 && (
              <span dir="ltr" className="tabular-nums" style={{ color: T.accent }}>
                ({notes.length})
              </span>
            )}
          </span>

          <div
            className="space-y-2 rounded-2xl border p-3"
            style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
          >
            <textarea
              id={`los-note-${book.id}`}
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              rows={2}
              aria-label="نقطة جديدة"
              placeholder="اقتباس أو فكرة تستحقّ أن تعود إليها…"
              className="w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-[12px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              style={{ borderColor: T.border }}
            />
            <div className="flex gap-2">
              <input
                value={draft.page}
                onChange={(e) => setDraft((d) => ({ ...d, page: e.target.value }))}
                inputMode="numeric"
                aria-label="رقم الصفحة"
                placeholder="ص"
                className="w-20 shrink-0 rounded-xl border bg-transparent px-3 py-2 text-[12px] tabular-nums text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                style={{ borderColor: T.border }}
              />
              <Btn variant="default" size="sm" className="flex-1" onClick={addNote}>
                <Plus size={14} strokeWidth={3} /> أضف نقطة
              </Btn>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            {notes.length === 0 ? (
              <p
                className="py-3 text-center text-[11px]"
                style={{ color: T.faint }}
              >
                لا نقاط بعد. أوّل اقتباس يستحقّ الحفظ يبدأ الدفتر.
              </p>
            ) : (
              notes.map((n, i) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-1.5 rounded-xl border p-2.5"
                  style={{
                    borderColor: T.border,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] tabular-nums"
                    dir="ltr"
                    style={{
                      background: `${meta.tint}1F`,
                      color: meta.tint,
                    }}
                  >
                    {n.page ? `ص ${n.page}` : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-relaxed text-white/75">
                      {n.text}
                    </p>
                    {/* Where the point stands in its own rotation. One line,
                        because the schedule is the whole reason a point is
                        worth writing down and a desk that hides it is a desk
                        that reads as a notepad. */}
                    <p className="mt-1 text-[9.5px]" style={{ color: T.faint }}>
                      {noteDue(n) ? (
                        <span style={{ color: T.accent }}>◔ مستحقّة للمراجعة</span>
                      ) : (
                        <span>
                          تعود <span dir="ltr">{n.due}</span>
                        </span>
                      )}
                      {n.box
                        ? ` · ${
                            n.box === 1
                              ? "مراجعة واحدة"
                              : n.box === 2
                                ? "مراجعتان"
                                : `${n.box} مراجعات`
                          }`
                        : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {onTurnIntoTask && (
                        <button
                          type="button"
                          onClick={() => onTurnIntoTask(n.text)}
                          className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                        >
                          <Zap size={9} /> ⚡ مهمة
                        </button>
                      )}
                      {onTurnIntoHabit && (
                        <button
                          type="button"
                          onClick={() => onTurnIntoHabit(n.text)}
                          className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Sparkles size={9} /> 🌱 عادة
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => moveNote(n.id, "up")}
                    disabled={i === 0}
                    aria-label="تحريك النقطة لأعلى"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-white/75 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveNote(n.id, "down")}
                    disabled={i === notes.length - 1}
                    aria-label="تحريك النقطة لأسفل"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-white/75 disabled:pointer-events-none disabled:opacity-20"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => dropNote(n.id)}
                    aria-label="حذف النقطة"
                    className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}


const BOOK_STATUS = {
  planned: { label: "أنوي قراءته", tint: "#A855F7" },
  reading: { label: "أقرأه الآن", tint: "#3B82F6" },
  finished: { label: "أنهيته", tint: T.primary },
};



/* ==================================================================== *
 *  BookFlashcardsModal — بطاقات استذكار الفوائد (Spaced Repetition)
 * ==================================================================== */
function BookFlashcardsModal({ open, onClose, books, onReview, onTurnIntoTask, onTurnIntoHabit }) {
  const waiting = useMemo(() => dueNotes(books), [books]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const idx = Math.min(currentIdx, Math.max(0, waiting.length - 1));
  const current = waiting[idx];

  const handleNext = () => {
    if (idx >= waiting.length - 1) {
      setCurrentIdx(0);
    }
  };

  const reviewCurrent = (kept) => {
    if (!current) return;
    onReview(current.book.id, current.note.id, kept);
    handleNext();
  };

  if (!open) return null;

  const cat = current?.book?.category ? BOOK_CATEGORIES.find((c) => c.id === current.book.category) : null;
  const ident = current?.book?.identity ? IDENTITIES[current.book.identity] : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بطاقات استذكار الفوائد (Spaced Repetition)"
      footer={
        <Btn variant="default" className="flex-1" onClick={onClose}>
          إغلاق النافذة
        </Btn>
      }
    >
      {waiting.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles size={28} />
          </div>
          <h4 className="text-base font-extrabold text-white">لا توجد فوائد مستحقة الآن!</h4>
          <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
            أحسنت! لقد راجعت كل الفوائد المستحقة لهذا اليوم، أو لم يحن موعد المراجعة بعد. واصل القراءة وتدوين الفوائد!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Brain size={14} /> بطاقة {idx + 1} من {waiting.length}
            </span>
            <span className="tabular-nums font-bold">المرحلة {current.note.box || 0} / 5</span>
          </div>

          <div
            className="rounded-2xl border p-5 relative overflow-hidden transition-all"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
              <div>
                <h4 className="font-black text-sm text-white/90">{current.book.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-white/40">{current.book.author || "—"}</span>
                  {cat && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: `${cat.tint}22`, color: cat.tint }}
                    >
                      {cat.label}
                    </span>
                  )}
                  {ident && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: `${ident.tint}22`, color: ident.tint }}
                    >
                      {ident.label}
                    </span>
                  )}
                </div>
              </div>
              {current.note.page && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 tabular-nums">
                  ص {current.note.page}
                </span>
              )}
            </div>

            <div className="py-4 min-h-[110px] flex items-center justify-center text-center">
              <p className="text-base font-bold text-white/95 leading-relaxed">
                "{current.note.text}"
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-white/40">
                {current.note.box === 0
                  ? "أول مراجعة لهذه الفائدة"
                  : `صمدت في ${current.note.box} مراجعات سابقة`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTurnIntoTask(current.note.text, current.book.title)}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                  title="تحويل الفائدة إلى مهمة تنفيذية اليوم"
                >
                  <Zap size={11} /> ⚡ مهمة
                </button>
                <button
                  type="button"
                  onClick={() => onTurnIntoHabit(current.note.text, current.book.title)}
                  className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title="تحويل الفائدة إلى عادة مستمرة"
                >
                  <Sparkles size={11} /> 🌱 عادة
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => reviewCurrent(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <span>❌ نسيتها</span>
              <span className="text-[10px] opacity-70">(إعادة غداً)</span>
            </button>
            <button
              type="button"
              onClick={() => reviewCurrent(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <span>✅ تذكّرتها</span>
              <span className="text-[10px] opacity-70">(المرحلة التالية)</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}


/* ==================================================================== *
 *  DeepReadingModal — وضع جلسة القراءة العميقة بمؤقت زن
 * ==================================================================== */
function DeepReadingModal({ book, onClose, onFinish }) {
  const [mins, setMins] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState("timer"); // "timer" | "summary"
  const [pagesRead, setPagesRead] = useState("10");
  const [noteDraft, setNoteDraft] = useState("");

  const resetTimer = (newMins) => {
    setMins(newMins);
    setSecondsLeft(newMins * 60);
    setIsRunning(false);
    setStep("timer");
  };

  useState(() => {
    if (book) resetTimer(25);
  });

  const toggleRun = () => setIsRunning((r) => !r);

  // Countdown timer effect
  useState(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            setStep("summary");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  });

  if (!book) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const timeFormatted = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const handleSave = () => {
    const p = parseInt(pagesRead, 10);
    onFinish(book, Number.isFinite(p) && p > 0 ? p : 0, noteDraft, mins);
  };

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      title="جلسة قراءة عميقة"
      footer={
        step === "timer" ? (
          <>
            <Btn variant="outline" className="flex-1" onClick={() => setStep("summary")}>
              إنهاء وتسجيل الآن
            </Btn>
            <Btn variant="default" className="flex-1" onClick={toggleRun}>
              {isRunning ? <><Pause size={14} /> إيقاف مؤقت</> : <><Play size={14} /> بدء القراءة</>}
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="outline" className="flex-1" onClick={onClose}>
              إلغاء
            </Btn>
            <Btn variant="default" className="flex-1" onClick={handleSave}>
              حفظ الإنجاز في السجل
            </Btn>
          </>
        )
      }
    >
      <div className="space-y-5 py-2 text-center">
        {step === "timer" ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <BookOpen size={28} />
            </div>

            <div>
              <h3 className="text-base font-black text-white">{book.title}</h3>
              <p className="mt-1 text-xs text-white/40">{book.author || "—"}</p>
            </div>

            {/* Presets */}
            <div className="flex justify-center gap-2">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => resetTimer(m)}
                  className={`rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                    mins === m
                      ? "border-sky-500 bg-sky-500/20 text-sky-300"
                      : "border-white/10 bg-transparent text-white/40 hover:text-white"
                  }`}
                >
                  {m} دقيقة
                </button>
              ))}
            </div>

            {/* Circular / Big Timer */}
            <div className="py-6">
              <span className="font-mono text-5xl font-black tracking-wider text-white" dir="ltr">
                {timeFormatted}
              </span>
              <p className="mt-2 text-xs text-white/40">
                {isRunning ? "ركّز في القراءة والسطور فقط… الذهن صافٍ" : "اضغط بدء عندما تكون مستعداً للقراءة"}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-right">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center">
              <Sparkles size={24} className="mx-auto text-emerald-400" />
              <h4 className="mt-1 font-extrabold text-white text-sm">أحسنت! أتممت الجلسة بنجاح</h4>
              <p className="text-[11px] text-white/50">دعنا ندوّن إنجازك الآن لترسيخ ما قرأته</p>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60 font-bold">
                كم صفحة أنجزت خلال الجلسة؟
              </label>
              <Field
                type="number"
                min="0"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                placeholder="10"
                dir="ltr"
                className="text-center font-bold"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60 font-bold">
                فائدة أو فكرة علقت ببالك من هذه الجلسة (اختياري):
              </label>
              <Field
                as="textarea"
                rows={3}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="اكتب الفكرة لتُدرج فوراً في بطاقات المراجعة المتباعدة…"
                className="resize-none text-xs leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


/* ==================================================================== *
 *  BookCapsuleModal — كبسولة إنجاز الكتاب للمشاركة والتصدير
 * ==================================================================== */
function BookCapsuleModal({ book, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const notesCount = book.notes?.length || 0;
  const cat = book.category ? BOOK_CATEGORIES.find((c) => c.id === book.category) : null;
  const ident = book.identity ? IDENTITIES[book.identity] : null;

  const shareText = `📖 كبسولة كتاب [${book.title}] ${book.author ? `لـ ${book.author}` : ""}
⭐ التقييم: ${"★".repeat(book.rating || 5)}
${book.lesson ? `💡 أهم درس: "${book.lesson}"\n` : ""}${book.pages ? `📄 عدد الصفحات: ${book.pages}\n` : ""}${notesCount > 0 ? `📌 الفوائد المستخرجة: ${notesCount}\n` : ""}
✨ تم توثيقه عبر Life OS — هندسة العادات والإنتاجية`;

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      title="كبسولة إنجاز الكتاب"
      footer={
        <>
          <Btn variant="outline" className="flex-1" onClick={copyShare}>
            {copied ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? "تم نسخ النص!" : "نسخ بطاقة الإنجاز"}
          </Btn>
          <Btn variant="default" className="flex-1" onClick={onClose}>
            إغلاق
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {/* Luxury Graphic Card Container */}
        <div
          className="relative overflow-hidden rounded-2xl border p-5 transition-all shadow-2xl"
          style={{
            borderColor: "rgba(255, 215, 0, 0.25)",
            background: "linear-gradient(145deg, #121420 0%, #0c0e17 60%, #1a1528 100%)",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Subtle gold halo glow */}
          <div
            className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full opacity-20 blur-2xl"
            style={{ background: "#f59e0b" }}
          />

          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                L I F E · O S · B O O K · C A P S U L E
              </span>
              <h3 className="mt-1 text-lg font-black text-white">{book.title}</h3>
              <p className="text-xs text-white/50">{book.author || "بلا مؤلّف"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StarRating value={book.rating || 5} size={15} readOnly />
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-bold text-white/60">
                {book.status === "finished" ? "✓ تم الختم" : "قيد القراءة"}
              </span>
            </div>
          </div>

          {/* Golden Quote Block */}
          {book.lesson && (
            <div className="my-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-center">
              <MessageSquareQuote size={20} className="mx-auto text-amber-400/60 mb-1" />
              <p className="text-xs font-bold leading-relaxed text-amber-200/90">
                "{book.lesson}"
              </p>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
              <span className="block font-black text-sky-400 tabular-nums">{book.pages || book.page || "—"}</span>
              <span className="text-[9.5px] text-white/40">صفحة</span>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
              <span className="block font-black text-amber-400 tabular-nums">{notesCount}</span>
              <span className="text-[9.5px] text-white/40">فائدة موثقة</span>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
              <span className="block font-black text-emerald-400 truncate text-[11px]">
                {cat ? cat.label.split(" ")[0] : "معرفة"}
              </span>
              <span className="text-[9.5px] text-white/40">المجال</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/35">
            <span>Life OS · هندسة القراءة</span>
            <span dir="ltr">{book.finishedAt || dayKey()}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}


/* ==================================================================== *
 *  AIBookModal — مستشار الكتاب الذكي
 * ==================================================================== */
function AIBookModal({ book, onClose, state, setState }) {
  const [mode, setMode] = useState("actions"); // "actions" | "questions"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!book) return null;

  const handleGenerate = async (targetMode = mode) => {
    setLoading(true);
    setResult(null);
    setMode(targetMode);
    try {
      let prompt = "";
      if (targetMode === "actions") {
        prompt = `أنا أقرأ كتاب "${book.title}" للمؤلف "${book.author}". أهم درس خرجت به هو: "${book.lesson || 'تطبيق عملي واستفادة'}". استخرج لي ٣ مهام يومية تطبيقية ومصغرة جداً (يمكن البدء بكل منها في ربع ساعة) لأضعها في جدول مهامي اليومي. اجعل كل مهمة سطر واحد بنقاط واضحة تبدأ بفعل أمر.`;
      } else {
        prompt = `بناءً على كتاب "${book.title}" للمؤلف "${book.author}" ودرسه: "${book.lesson || 'تعلم ونمو'}"، أعطني ٣ أسئلة استيعاب وتأمل عميقة تساعد القارئ على هضم الكتاب وربطه بواقعه الشخصي والمهني.`;
      }

      const res = await runLifeAgent(prompt, [], state, setState, { mode: "executive" });
      const text = typeof res === "string" ? res : res?.text || "";
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^[0-9.-•*\s]+/, "").trim())
        .filter((l) => l.length > 3)
        .slice(0, 4);

      setResult({
        mode: targetMode,
        items: lines.length ? lines : ["تطبيق أول خطوة عملية من الفصل الأساسي", "تلخيص أفكار الكتاب في صفحة واحدة", "مشاركة فكرة محورية مع صديق مهتم"],
      });
    } catch {
      setResult({
        mode: targetMode,
        items: [
          "تحديد السلوك اليومي الذي ستغيّره بناءً على الكتاب",
          "تطبيق تقنية واحدة مقترحة من الكاتب خلال 24 ساعة",
          "مراجعة الملاحظات وتحديد أهم ٣ نقاط قابلة للتنفيذ",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const applyAsTasks = () => {
    if (!result?.items?.length) return;
    const newTasks = result.items.map((txt) =>
      taskShape({
        id: uid(),
        text: `[${book.title}] ${txt}`,
        priority: "p2",
        scheduled: true,
        createdAt: dayKey(),
      })
    );
    setState((s) => ({ ...s, tasks: [...newTasks, ...s.tasks] }));
    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      title="مستشار القراءة الذكي"
      footer={
        <Btn variant="outline" className="flex-1" onClick={onClose}>
          إغلاق
        </Btn>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
          <Bot size={24} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="font-extrabold text-white text-xs">{book.title}</h4>
            <p className="text-[11px] text-white/50">{book.author || "المؤلف"} · استشارة وتطبيق بالذكاء الاصطناعي</p>
          </div>
        </div>

        {/* Action Selectors */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate("actions")}
            className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
              mode === "actions"
                ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
            }`}
          >
            ⚡ استخراج خطة مهام عملية
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate("questions")}
            className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
              mode === "questions"
                ? "border-sky-500/60 bg-sky-500/20 text-sky-300"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
            }`}
          >
            🧠 ٣ أسئلة استيعاب وتأمل
          </button>
        </div>

        {loading && (
          <div className="py-10 text-center space-y-2">
            <Sparkles size={24} className="mx-auto text-amber-400 animate-spin" />
            <p className="text-xs text-white/60">جارٍ تحليل الكتاب وصياغة الأفكار التطبيقية…</p>
          </div>
        )}

        {!loading && !result && (
          <div className="py-8 text-center text-xs text-white/40">
            اختر أحد الخيارات أعلاه للبدء باستخراج المهام أو أسئلة الاستيعاب.
          </div>
        )}

        {!loading && result && (
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold text-white/60 block">
              {result.mode === "actions" ? "المهام التطبيقية المقترحة:" : "أسئلة التأمل والاستيعاب:"}
            </span>
            <div className="space-y-2">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs font-bold text-white/90 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            {result.mode === "actions" && (
              <Btn
                variant="default"
                className="w-full mt-2"
                onClick={applyAsTasks}
                disabled={appliedNotice}
              >
                {appliedNotice ? (
                  <><Check size={14} /> تم إدراج المهام في قائمة اليوم!</>
                ) : (
                  <><Plus size={14} /> اعتماد هذه المهام في مصفوفة اليوم</>
                )}
              </Btn>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
