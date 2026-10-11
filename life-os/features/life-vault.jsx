import { Btn, Card, Field, Modal, READ_KEY, StarRating, T, countedWord, shrinkImage, useDailyQuote, useUndo } from "../components/life-shared.jsx";
import { bookShape, dayKey, goalPct, pctOf, readStreak, rows, sumPages, uid } from "../state/life-state.mjs";
import { CheckCheck, ChevronDown, ChevronUp, Copy, ImagePlus, NotebookPen, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

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
  const [read, shuffleRead] = useDailyQuote(state.reads || [], READ_KEY);
  const arm = useUndo();

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

  const shown =
    filter === "all" ? state.books : state.books.filter((b) => b.status === filter);
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
          <Btn
            variant="default"
            onClick={() => setEditing(bookShape())}
          >
            <Plus size={15} strokeWidth={3} /> أضف كتابًا
          </Btn>
        </div>

        {/* what the shelf has cost you so far */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { n: finished, k: "كتابًا مُنهًى", tint: T.primary },
            { n: noteCount, k: "نقطة محفوظة", tint: T.accent },
            { n: pagesRead, k: "صفحة مقروءة", tint: T.sky },
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

        {/* the reading cue — tap for the next one */}
        <button
          type="button"
          onClick={shuffleRead}
          title="اضغط لعبارة أخرى"
          className="los-cue group relative mt-4 w-full overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300"
          style={{
            borderColor: `${T.accent}33`,
            background: `${T.accent}0D`,
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 right-1/3 h-40 w-40 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
            style={{ background: T.accent }}
          />
          {read ? (
            <>
              <p
                key={read.text}
                className="los-in relative mx-auto max-w-xl text-[13px] font-bold leading-relaxed"
                style={{ color: T.fg }}
              >
                {read.text}
              </p>
              <p
                className="relative mt-1.5 text-[10.5px]"
                style={{ color: T.accent }}
              >
                — {read.author}
              </p>
            </>
          ) : (
            <p className="relative text-[12px]" style={{ color: T.muted }}>
              لا عبارات في هذه القائمة.
            </p>
          )}
          <span
            className="relative mt-2 inline-flex items-center gap-1.5 text-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: T.faint }}
          >
            <RotateCcw size={10} /> اضغط لعبارة أخرى
          </span>
        </button>
      </Card>

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
            return (
              <Card
                key={b.id}
                className="group flex gap-4 p-4 transition-all duration-500 hover:-translate-y-1"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${T.accent}59`;
                  e.currentTarget.style.boxShadow = `0 18px 50px -22px ${T.accent}88`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
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

                  <button
                    onClick={() => setDeskId(b.id)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-bold transition-all duration-200 hover:scale-[1.01]"
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
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الكتاب" : "كتاب جديد"}
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
function BookDesk({ book, log = [], onClose, onPatch }) {
  const [draft, setDraft] = useState({ text: "", page: "" });
  const [copied, setCopied] = useState(false);

  if (!book) return null;

  const notes = book.notes || [];
  const meta = BOOK_STATUS[book.status] || BOOK_STATUS.planned;

  const addNote = () => {
    const text = draft.text.trim();
    if (!text) return;
    onPatch({
      ...book,
      notes: [...notes, { id: uid(), text, page: draft.page.trim() }],
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
          <label
            htmlFor={`los-desk-lesson-${book.id}`}
            className="mb-1.5 block text-xs"
            style={{ color: `${T.accent}CC` }}
          >
            أهم درس يغيّر حياتي
          </label>
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
                  <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-white/75">
                    {n.text}
                  </p>
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

