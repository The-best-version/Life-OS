import { HorizonRow, clockLabel, horizonClock } from "./life-goals.jsx";
import { ReadLogModal, useHabitTick } from "../components/life-day.jsx";
import { Badge, Btn, Card, Checkbox, ConfigBlockBoundary, Field, GLASS, GROUPS, GROUP_BY_ID, Modal, ProgressRing, T, arDate, countedWord, dayWord, groupOf, shrinkImage, useBurst, useUndo } from "../components/life-shared.jsx";
import { cardTitles, routineBlocks } from "../life-config.js";
import { CORE_CAP, HABIT_MIN_MAX, HORIZONS, IDENTITIES, READ_ACTIVE, STREAK_TARGET, bookForHabit, coreOf, goalShape, habitShape, habitStreak, historyIndex, inferHabitIdentity, isGap, openingWindow, pctOfRow, rows, setDayDone, streakBaseFrom, uid, yesterdayKey } from "../state/life-state.mjs";
import { AlertTriangle, ArrowLeft, CalendarDays, Check, ChevronDown, ChevronUp, Database, Feather, Flame, GripVertical, History, Hourglass, ImagePlus, Library, MessageSquareQuote, Pencil, Plus, Quote, RotateCcw, ScanFace, Star, Sunrise, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function RoutineModule({
  state,
  setState,
  discipline,
  streak,
  quote,
  onShuffleQuote,
  mirror,
  savedAt,
  diskAt,
  diskStuck,
  onOpenMirror,
  onOpenReflect,
  onOpenFix,
  onOpenTomorrow,
  onGoGoals,
  reflected,
  prepped,
}) {
  const [editing, setEditing] = useState(null); // {id?, label, group}
  const [quotesOpen, setQuotesOpen] = useState(false);
  const [dragging, setDragging] = useState(null); // habit id being dragged
  const [overGroup, setOverGroup] = useState(null);
  const [picking, setPicking] = useState(false); // choosing the core five
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  /* One place a habit is ticked, shared with the «اليوم» screen — the
     withdrawal of a reading log on an untick is not logic that may exist in
     two copies drifting apart. */
  const { toggle, logging, closeLog, logRead } = useHabitTick(state, setState);
  const arm = useUndo();

  const save = () => {
    const label = editing.label.trim();
    if (!label) return;
    /* Through the one shape, so the add form and the migration cannot drift
       into writing two different kinds of habit. */
    const min = String(editing.min || "").trim();
    const identity = editing.identity || "general";
    const identityManual = editing.identityManual === true;
    setState((s) => ({
      ...s,
      habits: editing.id
        ? s.habits.map((h) =>
            h.id === editing.id
              ? habitShape({
                  ...h,
                  label,
                  group: editing.group,
                  book: editing.book || null,
                  min,
                  identity,
                  identityManual,
                })
              : h
          )
        : [
            ...s.habits,
            habitShape({
              label,
              group: editing.group,
              book: editing.book || null,
              min,
              identity,
              identityManual,
            }),
          ],
    }));
    setEditing(null);
  };

  const remove = (id) => {
    /* The whole list, not the row: a habit put back at the end of the list
       is a habit in the wrong block and the wrong order, which is its own
       small loss. */
    arm("حُذفت العادة", { habits: state.habits });
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
  };

  const reorder = (dragId, targetId) =>
    setState((s) => ({ ...s, habits: dropHabit(s.habits, dragId, targetId) }));

  const moveToGroup = (dragId, group) =>
    setState((s) => ({ ...s, habits: dropHabitInGroup(s.habits, dragId, group) }));

  const nudge = (id, dir) =>
    setState((s) => ({ ...s, habits: nudgeHabit(s.habits, id, dir) }));

  /* Refused at the cap, and told why — the same contract the three tasks
     hold. A sixth star that silently does nothing teaches that the button is
     broken; one that says «خمس أساسيات تكفي» teaches what the cap is for. */
  const [coreNote, setCoreNote] = useState(null);
  const toggleCore = (id) =>
    setState((s) => {
      const h = s.habits.find((x) => x.id === id);
      if (!h) return s;
      if (!h.core && coreOf(s.habits).length >= CORE_CAP) {
        setCoreNote(id);
        return s;
      }
      setCoreNote(null);
      return {
        ...s,
        habits: s.habits.map((x) => (x.id === id ? { ...x, core: !x.core } : x)),
      };
    });
  /* The refusal is a moment, not a state. Left on screen it becomes part of
     the layout and stops being read. */
  useEffect(() => {
    if (coreNote === null) return;
    const t = setTimeout(() => setCoreNote(null), 4000);
    return () => clearTimeout(t);
  }, [coreNote]);

  const core = coreOf(state.habits);
  const coreDone = core.filter((h) => h.done).length;
  const extra = core.length ? state.habits.filter((h) => !h.core) : [];
  const extraDone = extra.filter((h) => h.done).length;
  const done = state.habits.filter((h) => h.done).length;
  /* Indexed once for the whole screen: every row asks for its own run, and
     rebuilding the map per row would walk the archive once per habit. */
  const archive = useMemo(() => historyIndex(state.history), [state.history]);
  const flame =
    discipline >= STREAK_TARGET
      ? { color: T.ember, glow: `drop-shadow(0 0 14px ${T.ember})`, animate: true }
      : discipline >= 50
      ? { color: "#B45309", glow: "none", animate: false }
      : { color: "rgba(255,255,255,0.22)", glow: "none", animate: false };

  /* ==================================================================== *
   * ترتيب أقسام شاشة «الروتين اليومي» يُضبط الآن من src/life-config.js
   * (مصفوفة routineBlocks) — افتح ذلك الملف لتحريك قسم أو إخفاءه، أو لنقل
   * إحدى الكتل الست المرتبطة بالصلاة قبل أو بعد أيّ قسم آخر بحرية كاملة.
   * ترتيبها الزمني الفعلي (أيّ بلوك "مفتوح الآن") يبقى محكومًا بأوقات
   * الصلاة الحقيقية ولا يتأثر بهذا الترتيب البصري — راجع التحذير أعلى
   * routineBlocks في ذلك الملف. ConfigBlockBoundary يحمي الشاشة إن كان
   * مفتاح مكتوبًا خطأ أو قسم انكسر: يختفي ذلك القسم وحده لا الشاشة كلها.
   * ==================================================================== */
  const blockRegistry = {
    cueImage: (
      <CueImageCard
        src={state.cueImage}
        onChange={(dataUrl) => setState((s) => ({ ...s, cueImage: dataUrl }))}
      />
    ),
    dailyQuote: (
      <RoutineQuoteBlock
        quote={quote}
        onShuffle={onShuffleQuote}
        onManage={() => setQuotesOpen(true)}
      />
    ),
    scoreHeader: (
      <RoutineScoreBlock
        title={cardTitles.routineTitle}
        dateLabel={dateLabel}
        savedAt={savedAt}
        diskAt={diskAt}
        diskStuck={diskStuck}
        core={core}
        coreDone={coreDone}
        extra={extra}
        extraDone={extraDone}
        done={done}
        totalHabits={state.habits.length}
        discipline={discipline}
        coreNote={coreNote}
        flame={flame}
        streak={streak}
        reflected={reflected}
        prepped={prepped}
        mirror={mirror}
        onOpenReflect={onOpenReflect}
        onOpenTomorrow={onOpenTomorrow}
        onOpenFix={onOpenFix}
        onOpenMirror={onOpenMirror}
        onAddHabit={() => setEditing({ label: "", group: "morning", book: null, min: "", identity: "general", identityManual: false })}
        onPickCore={() => setPicking(true)}
      />
    ),
    /* العدّاد بجانب العادات لأن ما تحته هو ما يستهلك الأيام التي يعدّها —
       عدّاد في شاشة وحده رقم يُزار لا يُشعَر به. */
    goalsCountdown: <CountdownStrip state={state} onGo={onGoGoals} />,
  };

  /* كل مفتاح آخر في routineBlocks (morning, afternoon, asr, maghrib,
     postisha, night) هو بلوك صلاة — بطاقته الواحدة، لا الشبكة كلها، لأنها
     أصبحت أسطرًا مستقلة يتحرك كل واحد منها بمفرده. مفتاح لا يطابق بلوكًا
     حقيقيًا (خطأ مطبعي) يُترك بلا تسجيل، فتُعرضه ConfigBlockBoundary فراغًا
     بصمت بدل أن يكسر الشاشة. */
  for (const b of routineBlocks) {
    if (b.key in blockRegistry) continue;
    if (!GROUP_BY_ID.has(b.key)) continue;
    blockRegistry[b.key] = (
      <RoutineHabitBlockCard
        blockId={b.key}
        habits={state.habits}
        books={state.books}
        archive={archive}
        dragging={dragging}
        overGroup={overGroup}
        onDragStart={(id) => setDragging(id)}
        onDragEnd={() => {
          setDragging(null);
          setOverGroup(null);
        }}
        onDragOverGroup={(id) => setOverGroup(id)}
        onDragLeaveGroup={() => setOverGroup(null)}
        onDropGroup={(dragId, groupId) => moveToGroup(dragId, groupId)}
        onReorder={reorder}
        onNudge={nudge}
        onToggleCore={toggleCore}
        onToggle={(id) => toggle(id)}
        onToggleTiny={(id) => toggle(id, true)}
        onEdit={(h) =>
          setEditing({
            id: h.id,
            label: h.label,
            group: h.group,
            book: h.book || null,
            min: h.min || "",
            identity: h.identity || "general",
            identityManual: h.identityManual === true,
          })
        }
        onDelete={remove}
      />
    );
  }

  return (
    <div className="space-y-8">
      {routineBlocks
        .filter((b) => b.visible !== false)
        .map((b) => (
          <ConfigBlockBoundary key={b.key}>{blockRegistry[b.key] ?? null}</ConfigBlockBoundary>
        ))}

      <ReadLogModal
        open={!!logging}
        book={logging ? bookForHabit(logging, state.books) : null}
        onClose={closeLog}
        onLog={logRead}
      />

      <QuotesModal
        open={quotesOpen}
        onClose={() => setQuotesOpen(false)}
        quotes={state.quotes || []}
        setState={setState}
      />

      <CorePicker
        open={picking}
        onClose={() => setPicking(false)}
        habits={state.habits}
        onSave={(ids) =>
          setState((s) => ({
            ...s,
            habits: s.habits.map((h) => ({ ...h, core: ids.includes(h.id) })),
          }))
        }
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل العادة" : "عادة جديدة"}
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
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="los-habit-label"
                className="mb-1.5 block text-xs text-white/45"
              >
                اسم العادة
              </label>
              <Field
                id="los-habit-label"
                value={editing.label}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value;
                  setEditing((s) => ({
                    ...s,
                    label: val,
                    identity: s.identityManual ? s.identity : inferHabitIdentity(val),
                  }));
                }}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: قراءة ١٠ صفحات"
              />
            </div>
            {/* The floor. Written by him and nobody else — which smaller
                version of «ساعة في النادي» he would still accept on a bad
                day is not a question this app is in any position to answer,
                the same reason the core five are asked for rather than
                guessed. */}
            <div>
              <label
                htmlFor="los-habit-min"
                className="mb-1.5 flex items-center gap-1.5 text-xs text-white/45"
              >
                <Feather size={12} style={{ color: T.sky }} /> النسخة الصغيرة
                <span style={{ color: T.faint }}>— اختياري</span>
              </label>
              <Field
                id="los-habit-min"
                value={editing.min || ""}
                maxLength={HABIT_MIN_MAX}
                onChange={(e) => setEditing((s) => ({ ...s, min: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: عشر دقائق مشي"
              />
              <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
                أصغر نسخة تقبلها في أسوأ يوم. تظهر كزرّ ثانٍ في صف العادة،
                وتُحتسب منجزة بالكامل — وتُعلَّم في الأرشيف بأنك حملتها على
                الحد الأدنى.
              </p>
            </div>

            <div>
              <label
                htmlFor="los-habit-book"
                className="mb-1.5 block text-xs text-white/45"
              >
                ربط بالمكتبة
              </label>
              <select
                id="los-habit-book"
                value={editing.book || ""}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, book: e.target.value || null }))
                }
                className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
                style={{ borderColor: T.border, color: T.muted }}
              >
                <option value="" style={{ background: T.cardSolid }}>
                  ليست عادة قراءة
                </option>
                <option value={READ_ACTIVE} style={{ background: T.cardSolid }}>
                  الكتاب الذي أقرأه الآن
                </option>
                {state.books.map((b) => (
                  <option key={b.id} value={b.id} style={{ background: T.cardSolid }}>
                    {b.title}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
                عادة مربوطة تسألك كم صفحة قرأت عند كل علامة، وتسجّلها في
                المكتبة.
              </p>
            </div>

            <div>
              <span className="mb-1.5 block text-xs text-white/45">الفترة</span>
              <div className="grid grid-cols-2 gap-2">
                {GROUPS.map((g) => {
                  const active = editing.group === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setEditing((s) => ({ ...s, group: g.id }))}
                      aria-pressed={active}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all"
                      style={{
                        borderColor: active ? `${g.tint}80` : T.border,
                        background: active ? `${g.tint}16` : "transparent",
                        color: active ? g.tint : T.muted,
                      }}
                    >
                      <g.icon size={15} /> {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs text-white/45">عمود الهوية الشخصية</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(IDENTITIES).map(([id, def]) => {
                  const active = (editing.identity || "general") === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEditing((s) => ({ ...s, identity: id, identityManual: true }))}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition-all text-right"
                      style={{
                        borderColor: active ? `${def.tint}80` : T.border,
                        background: active ? `${def.tint}16` : "transparent",
                        color: active ? def.tint : T.muted,
                      }}
                    >
                      <span className="text-sm">{def.icon}</span>
                      <span className="font-bold truncate">{def.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
/* عبارة اليوم التحفيزية — بطاقة قائمة بذاتها، تأخذ العبارة وبابين: التبديل
   والتحرير. مرتبطة بشاشة الروتين وحدها، وتُستدعى من routineBlocks عبر
   المفتاح dailyQuote. */
function RoutineQuoteBlock({ quote, onShuffle, onManage }) {
  return (
    <Card className="los-cue group relative overflow-hidden p-6 text-center transition-all duration-300 sm:p-7">
      <button
        type="button"
        onClick={onShuffle}
        title="اضغط لاقتباس آخر"
        aria-label="اقتباس آخر"
        className="absolute inset-0 z-0 cursor-pointer"
      />
      <div
        className="pointer-events-none absolute -top-24 right-1/3 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: T.accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full opacity-25 blur-3xl"
        style={{ background: T.rose }}
      />
      <button
        type="button"
        onClick={onManage}
        aria-label="تحرير عبارات التحفيز"
        title="تحرير عبارات التحفيز"
        className="absolute left-3 top-3 z-20 rounded-lg border p-1.5 transition-all duration-200 hover:scale-105"
        style={{
          borderColor: `${T.accent}3D`,
          background: `${T.accent}14`,
          color: T.accent,
        }}
      >
        <MessageSquareQuote size={14} />
      </button>
      <div className="pointer-events-none relative z-10">
        <Quote
          size={20}
          className="mx-auto mb-2 opacity-45"
          style={{ color: T.accent }}
        />
        {quote ? (
          <>
            <p
              key={quote.text}
              className="los-in mx-auto max-w-2xl text-[15px] font-bold leading-relaxed sm:text-lg"
              style={{ color: T.fg }}
            >
              {quote.text}
            </p>
            <p className="mt-2 text-xs" style={{ color: T.accent }}>
              — {quote.author}
            </p>
          </>
        ) : (
          <p className="text-[13px]" style={{ color: T.muted }}>
            لا عبارات بعد — اضغط زر التحرير لإضافة أول عبارة.
          </p>
        )}
        <span
          className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ color: T.faint }}
        >
          <RotateCcw size={11} /> اضغط لاقتباس آخر
        </span>
      </div>
    </Card>
  );
}

/* العنوان، التاريخ، طابع الحفظ، نسبة الأساسيات، حلقة الانضباط، وأزرار
   الوقفة المسائية وجهّز غدك وعدّل أمس ومرآة المحاسبة. أكبر الأقسام، ولا
   يحتفظ بأي حالة خاصة به — كل ما يحتاجه وصل في الخصائص. */
function RoutineScoreBlock({
  title,
  dateLabel,
  savedAt,
  diskAt,
  diskStuck,
  core,
  coreDone,
  extra,
  extraDone,
  done,
  totalHabits,
  discipline,
  coreNote,
  flame,
  streak,
  reflected,
  prepped,
  mirror,
  onOpenReflect,
  onOpenTomorrow,
  onOpenFix,
  onOpenMirror,
  onAddHabit,
  onPickCore,
}) {
  return (
    <Card className="flex flex-col items-center gap-7 p-6 sm:p-7 lg:flex-row lg:justify-between">
      <div className="text-center lg:text-right">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">{title}</h2>
        <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
          <CalendarDays size={13} /> {dateLabel}
        </p>
        <SaveStamp at={savedAt} diskAt={diskAt} diskStuck={diskStuck} />
        {core.length ? (
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
            <span className="font-extrabold" style={{ color: T.accent }}>
              <span dir="ltr" className="tabular-nums">
                {coreDone} / {core.length}
              </span>{" "}
              أساسيات
            </span>
            {extra.length > 0 && (
              <>
                {" · إضافي "}
                <span dir="ltr" className="tabular-nums">
                  {extraDone} / {extra.length}
                </span>
              </>
            )}
            . المؤشر يقيس أساسياتك وحدها — وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
          </p>
        ) : (
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
            {done} من {totalHabits} عادة. المؤشر يمتلئ مع كل علامة —
            وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
          </p>
        )}

        {/* The invitation, shown only while there is no core. It sits here
            rather than in settings because this is the sentence it is
            arguing with: the percentage directly above it is the one that
            counts eighteen habits and calls three of them a failure. */}
        {!core.length && (
          <button
            onClick={onPickCore}
            className="los-in mt-3 flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 text-right transition-all duration-200"
            style={{
              borderColor: `${T.accent}3D`,
              background: `${T.accent}12`,
            }}
          >
            <Star size={15} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
            <span>
              <span className="block text-[12px] font-extrabold" style={{ color: T.accent }}>
                اختر أساسياتك
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
                حتى {CORE_CAP} عادات تحسب نسبتك وحدها، والباقي إضافي. ثلاث
                عادات حقيقية من {totalHabits} تقرأ الآن{" "}
                <span dir="ltr" className="tabular-nums">
                  {totalHabits ? Math.round((3 / totalHabits) * 100) : 0}
                  %
                </span>
                .
              </span>
            </span>
          </button>
        )}

        {coreNote !== null && (
          <p
            className="los-in mt-3 max-w-sm rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
            style={{
              borderColor: `${T.ember}4D`,
              background: `${T.ember}14`,
              color: T.ember,
            }}
          >
            {CORE_CAP} أساسيات تكفي. أزل نجمة قبل أن تضيف أخرى — الحدّ هو ما
            يجعلها أساسيات.
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ borderColor: T.border }}
          >
            <Flame
              size={22}
              className={flame.animate ? "los-flame" : ""}
              style={{
                color: flame.color,
                filter: flame.glow,
                transition: "all .5s ease",
              }}
            />
            <span className="text-xl font-extrabold tabular-nums">{streak}</span>
            <span className="text-[11px] text-white/35">{countedWord(streak)}</span>
          </div>
          <Btn variant="default" size="sm" onClick={onAddHabit}>
            <Plus size={14} strokeWidth={3} /> عادة جديدة
          </Btn>
          {/* The evening prompt comes on its own, but only inside its
              window and only on a day that fell short. This is how you
              reach it the rest of the time — and how you reopen what you
              already wrote to read or change it. */}
          <button
            onClick={onOpenReflect}
            title="وقفة آخر اليوم"
            aria-label="وقفة آخر اليوم"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
            style={{
              borderColor: reflected ? `${T.cta}80` : `${T.cta}3D`,
              background: reflected ? `${T.cta}24` : `${T.cta}0F`,
              color: T.cta,
              boxShadow: reflected ? `0 0 18px -6px ${T.cta}` : "none",
            }}
          >
            <MessageSquareQuote size={16} strokeWidth={2} />
          </button>
          {/* «اليوم» only invites it in the evening window, which is the
              right default and the wrong only door — the three can be
              chosen at any hour, and a prep already written has to be
              re-readable. Lit once tomorrow has its three. */}
          <button
            onClick={onOpenTomorrow}
            title="جهّز غدك"
            aria-label="جهّز غدك"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
            style={{
              borderColor: prepped ? `${T.violet}80` : `${T.violet}3D`,
              background: prepped ? `${T.violet}24` : `${T.violet}0F`,
              color: T.violet,
              boxShadow: prepped ? `0 0 18px -6px ${T.violet}` : "none",
            }}
          >
            <Sunrise size={16} strokeWidth={2} />
          </button>
          {/* Open for as long as today is today. A day missed because the
              app was never opened is the one failure the app itself caused,
              and it has to be answerable. */}
          <button
            onClick={onOpenFix}
            title="عدّل أمس"
            aria-label="عدّل أمس"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
            style={{
              borderColor: `${T.violet}3D`,
              background: `${T.violet}0F`,
              color: T.violet,
            }}
          >
            <History size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onOpenMirror}
            title="مرآة المحاسبة"
            aria-label="مرآة المحاسبة"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
            style={{
              borderColor: mirror ? `${T.danger}80` : `${T.danger}3D`,
              background: mirror ? `${T.danger}24` : `${T.danger}0F`,
              color: T.danger,
              boxShadow: mirror ? `0 0 18px -6px ${T.danger}` : "none",
            }}
          >
            <ScanFace size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
      <ProgressRing value={discipline} size={176} />
    </Card>
  );
}

/* بطاقة بلوك صلاة واحد وعاداته. كل بلوك من الستة أصبح قسمًا مستقلًا تمامًا
   في routineBlocks (src/life-config.js) — اسمه وأيقونته ولونه هناك، وهذا
   المكوّن يرسم بطاقة واحدة فقط لما يُعطى من `blockId`، فيتحرك كل بلوك
   بمفرده في ترتيب الشاشة. */
function RoutineHabitBlockCard({
  blockId,
  habits,
  books,
  archive,
  dragging,
  overGroup,
  onDragStart,
  onDragEnd,
  onDragOverGroup,
  onDragLeaveGroup,
  onDropGroup,
  onReorder,
  onNudge,
  onToggleCore,
  onToggle,
  onToggleTiny,
  onEdit,
  onDelete,
}) {
  const g = groupOf(blockId);
  const list = habits.filter((h) => h.group === g.id);
  const gDone = list.filter((h) => h.done).length;
  const Icon = g.icon;
  return (
    <Card
      className="p-5 transition-all duration-200"
      style={
        overGroup === g.id
          ? { borderColor: `${T.cta}80`, boxShadow: `0 0 0 1px ${T.cta}4D, ${GLASS.boxShadow}` }
          : undefined
      }
      onDragOver={(e) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverGroup(g.id);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        onDragLeaveGroup();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeaveGroup();
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropGroup(id, g.id);
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${g.tint}33`,
            background: `${g.tint}14`,
            color: g.tint,
          }}
        >
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <h3 className="text-[15px] font-bold">{g.label}</h3>
        <span className="mr-auto text-[11px] tabular-nums text-white/30">
          {gDone}/{list.length}
        </span>
      </div>

      <div
        className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: list.length ? `${(gDone / list.length) * 100}%` : "0%",
            backgroundImage:
              gDone === list.length && list.length
                ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                : `linear-gradient(90deg, ${g.tint}, ${g.tint}AA)`,
            boxShadow: `0 0 12px ${
              gDone === list.length && list.length ? T.primary : g.tint
            }99`,
          }}
        />
      </div>

      <div className="mt-2 space-y-0.5">
        {list.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-white/25">
            {dragging
              ? "أفلت هنا لنقل العادة إلى هذه الفترة"
              : "لا عادات في هذه الفترة بعد"}
          </p>
        ) : (
          list.map((h, idx) => (
            <HabitRow
              key={h.id}
              habit={h}
              linkedBook={bookForHabit(h, books)}
              streak={habitStreak(archive, h.id)}
              first={idx === 0}
              last={idx === list.length - 1}
              dragging={dragging}
              onDragStart={() => onDragStart(h.id)}
              onDragEnd={onDragEnd}
              onDrop={(dragId) => onReorder(dragId, h.id)}
              onNudge={(dir) => onNudge(h.id, dir)}
              onToggleCore={() => onToggleCore(h.id)}
              onToggle={() => onToggle(h.id)}
              onToggleTiny={() => onToggleTiny(h.id)}
              onEdit={() => onEdit(h)}
              onDelete={() => onDelete(h.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}




function HabitRow({
  habit,
  linkedBook,
  streak = 0,
  onToggle,
  onToggleTiny,
  onEdit,
  onDelete,
  onNudge,
  onDrop,
  onToggleCore,
  first,
  last,
  dragging,
  onDragStart,
  onDragEnd,
}) {
  const [burst, fireBurst] = useBurst(700);
  const [over, setOver] = useState(false);

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };

  /* The same payout as the full tick, deliberately. A completion that
     animates less than the one beside it is a completion that reads as
     worth less, and the whole point of the floor is that taking it is not a
     defeat. */
  const handleTiny = () => {
    if (!habit.done) fireBurst();
    onToggleTiny();
  };

  const edge = over
    ? T.cta
    : burst
    ? T.primary
    : "transparent";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", habit.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={() => {
        setOver(false);
        onDragEnd();
      }}
      onDragOver={(e) => {
        if (!dragging || dragging === habit.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={`group flex items-center gap-1 rounded-lg border transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: edge,
        background: over
          ? `${T.cta}1F`
          : burst
          ? `${T.primary}26`
          : habit.done
          ? `${T.primary}0F`
          : "transparent",
        opacity: dragging === habit.id ? 0.4 : 1,
        cursor: "grab",
      }}
    >
      <span
        aria-hidden="true"
        className="shrink-0 pr-1 text-white/20 transition-colors group-hover:text-white/45"
      >
        <GripVertical size={13} />
      </span>
      <Checkbox
        checked={habit.done}
        onToggle={handle}
        label={habit.label}
        tint={T.primary}
      />
      {/* Amber, because being core is an achievement marker and not an action
          — and never emerald, which in this app means only that something was
          finished. Always visible once set, so the five can be read off the
          screen at a glance; faint and hover-revealed while unset, so twelve
          grey stars do not compete with the twelve checkboxes beside them. */}
      <button
        onClick={onToggleCore}
        title={habit.core ? "إزالة من الأساسيات" : "تعيين كعادة أساسية"}
        aria-label={`${habit.core ? "إزالة" : "تعيين"} ${habit.label} ${
          habit.core ? "من" : "ضمن"
        } الأساسيات`}
        aria-pressed={!!habit.core}
        className={`shrink-0 rounded p-1 transition-all duration-200${
          habit.core
            ? ""
            : " opacity-40 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        style={{ color: habit.core ? T.accent : "rgba(255,255,255,0.25)" }}
      >
        <Star
          size={13}
          fill={habit.core ? T.accent : "none"}
          style={habit.core ? { filter: `drop-shadow(0 0 5px ${T.accent}AA)` } : undefined}
        />
      </button>
      {/* The floor, reachable in one tap from the row it belongs to. Shown
          only once a floor has actually been written: a second button on
          twenty-two rows that names nothing is twenty-two dead buttons. */}
      {!!habit.min && (habit.tiny || !habit.done) && (
        <button
          onClick={handleTiny}
          title={habit.tiny ? `أُنجزت كنسخة صغيرة: ${habit.min}` : `نسخة صغيرة: ${habit.min}`}
          aria-label={`${habit.tiny ? "إلغاء" : "إنجاز"} النسخة الصغيرة من ${habit.label}`}
          aria-pressed={!!habit.tiny}
          className={`shrink-0 rounded p-1 transition-all duration-200${
            habit.tiny
              ? ""
              : " opacity-40 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          style={{ color: habit.tiny ? T.sky : "rgba(255,255,255,0.25)" }}
        >
          <Feather
            size={13}
            style={habit.tiny ? { filter: `drop-shadow(0 0 5px ${T.sky}AA)` } : undefined}
          />
        </button>
      )}
      {/* The run you are protecting, where you are protecting it. Two days is
          not a streak yet, so it stays quiet until there is something to
          lose — a badge that reads «١» next to every habit is noise. */}
      {streak >= 2 && (
        <span
          title={`${streak} ${dayWord(streak)} متتالية`}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
          style={{
            background: streak >= 7 ? `${T.ember}24` : "rgba(255,255,255,0.05)",
            color: streak >= 7 ? T.ember : T.muted,
          }}
        >
          <Flame size={10} />
          <span dir="ltr" className="tabular-nums">
            {streak}
          </span>
        </span>
      )}
      {linkedBook && (
        <span
          title={`مربوطة بـ«${linkedBook.title}»`}
          className="hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:inline-flex"
          style={{ background: `${T.accent}1A`, color: T.accent }}
        >
          <Library size={10} />
          <span className="max-w-[7rem] truncate">{linkedBook.title}</span>
        </span>
      )}
      {/* Arrows, not the handle, are what works under a finger. */}
      <button
        onClick={() => onNudge("up")}
        disabled={first}
        aria-label={`تحريك ${habit.label} لأعلى`}
        className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
      >
        <ChevronUp size={13} />
      </button>
      <button
        onClick={() => onNudge("down")}
        disabled={last}
        aria-label={`تحريك ${habit.label} لأسفل`}
        className="shrink-0 rounded p-1 text-white/30 transition-all hover:text-white/80 disabled:pointer-events-none disabled:opacity-20"
      >
        <ChevronDown size={13} />
      </button>
      <button
        onClick={onEdit}
        aria-label={`تعديل ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}


/* --- choosing the five ------------------------------------------------ *
 *  A draft, not a live edit. Picking the core means weighing five against
 *  seventeen, and that is done by trying combinations — so the checkboxes
 *  move a local list and only «احفظ» writes it. Toggling state directly here
 *  would change the discipline score behind the modal while he is still
 *  deciding, which turns the thing he is measuring into a moving target.
 * ---------------------------------------------------------------------- */
function CorePicker({ open, onClose, habits, onSave }) {
  const [picked, setPicked] = useState([]);

  /* Seeded on each open, not once: he comes back to change it, and a draft
     left over from the previous visit would quietly discard the five he
     has been keeping. */
  useEffect(() => {
    if (open) setPicked(habits.filter((h) => h.core).map((h) => h.id));
  }, [open, habits]);

  const full = picked.length >= CORE_CAP;
  const flip = (id) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : full ? p : [...p, id],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="اختر أساسياتك"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => {
              onSave(picked);
              onClose();
            }}
          >
            احفظ{" "}
            <span dir="ltr" className="tabular-nums">
              ({picked.length}/{CORE_CAP})
            </span>
          </Btn>
          <Btn variant="outline" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <p className="text-[11.5px] leading-relaxed text-white/50">
        هذي العادات وحدها تحسب نسبة انضباطك اليومية. الباقي يبقى في مكانه،
        بسلسلته وسجلّه، لكنه إضافي — لأن مقياسًا يعدّ كل شيء لا يقيس شيئًا.
      </p>
      {!picked.length && (
        <p className="text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          واحدة على الأقل، وإلا رجع المؤشر يعدّ كل عاداتك.
        </p>
      )}

      <div className="space-y-4">
        {GROUPS.map((g) => {
          const list = habits.filter((h) => h.group === g.id);
          if (!list.length) return null;
          const Icon = g.icon;
          return (
            <div key={g.id}>
              <p
                className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold"
                style={{ color: g.tint }}
              >
                <Icon size={12} /> {g.label}
              </p>
              <div className="space-y-1">
                {list.map((h) => {
                  const on = picked.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      className="rounded-lg px-2 py-1 transition-opacity duration-200"
                      style={{
                        backgroundColor: on ? `${T.accent}14` : "transparent",
                        /* Dimmed, not disabled: a greyed-out row reads as
                           broken, while a faded one reads as "not until you
                           free a slot" — which is what it means. */
                        opacity: !on && full ? 0.35 : 1,
                      }}
                    >
                      <Checkbox
                        checked={on}
                        onToggle={() => flip(h.id)}
                        label={h.label}
                        tint={T.accent}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {full && (
        <p className="text-[11px] leading-relaxed" style={{ color: T.ember }}>
          وصلت الحدّ. أزل واحدة لتختار غيرها.
        </p>
      )}
    </Modal>
  );
}


export function EditYesterdayModal({ open, onClose, state, setState }) {
  const ykey = yesterdayKey();
  const row = useMemo(
    () => (state.history || []).find((h) => h.date === ykey) || null,
    [state.history, ykey],
  );

  /* The roster as it stood that day where the row recorded one, and the live
     routine where it did not. A habit since deleted stays on the list, named
     the way the roll call names it — it was asked that day, and dropping it
     would rescore a finished day every time the routine is edited. */
  const roster = useMemo(() => {
    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const ids =
      Array.isArray(row?.all) && row.all.length
        ? row.all
        : (state.habits || []).map((h) => h.id);
    return ids.map((id) => {
      const h = live.get(id);
      return h
        ? { ...h, gone: false }
        : { id, label: "عادة لم تعد في روتينك", group: null, core: false, gone: true };
    });
  }, [row, state.habits]);

  const [picked, setPicked] = useState([]);
  /* Seeded from the archive each time it opens, exactly like the reflection
     box: opening it a second time on an empty list and saving would wipe the
     correction with nothing. */
  useEffect(() => {
    if (!open) return;
    const asked = new Set(roster.map((h) => h.id));
    setPicked((Array.isArray(row?.done) ? row.done : []).filter((id) => asked.has(id)));
  }, [open, row, roster]);

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* Through `pctOfRow`, which goes through `disciplineOf` — the five core
     habits carry the number here too, or the ring and this screen would
     disagree about the same day the moment a core is set. */
  const pct = pctOfRow({ all: roster.map((h) => h.id), done: picked }, state.habits);
  const was = isGap(row) ? null : Number.isFinite(Number(row?.pct)) ? Number(row.pct) : null;

  /* Grouped by the block each habit belongs to, in the order the day runs.
     A habit whose block this build no longer has goes through `groupOf` into
     the night block, exactly as it does on every other screen. */
  const byBlock = useMemo(() => {
    const live = roster.filter((h) => !h.gone);
    return GROUPS.map((g) => ({
      g,
      list: live.filter((h) => groupOf(h.group).id === g.id),
    })).filter((x) => x.list.length);
  }, [roster]);
  /* The deleted habits get a heading of their own rather than being swept
     into the last block — they were asked that day and still count in the
     denominator, but saying «قبل النوم» over them would be a plain lie. */
  const gone = roster.filter((h) => h.gone);

  const commit = () => {
    setState((s) => {
      const history = setDayDone(s.history, ykey, picked, s.habits);
      /* The streak is read back off the rows rather than nudged: correcting
         yesterday can make or break the run that ends today, and a counter
         adjusted by hand here would be a second opinion about the same
         archive. */
      return { ...s, history, streakBase: streakBaseFrom(history) };
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`عدّل ${arDate(ykey)}`}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={commit}>
            <Check size={14} strokeWidth={3} /> احفظ أمس
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-3"
          style={{ borderColor: `${T.violet}3D`, background: `${T.violet}12` }}
        >
          <p className="text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
            {isGap(row)
              ? "هذا اليوم لم يُسجَّل. أشّر ما أنجزته فعلًا فيه."
              : "تعديل صف أمس فقط — عادات اليوم لا تتغيّر."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {was !== null && was !== pct && (
              <Badge tint={T.faint}>
                <span dir="ltr" className="tabular-nums">
                  {was}%
                </span>
                {" كان"}
              </Badge>
            )}
            <Badge tint={pct >= STREAK_TARGET ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {pct}%
              </span>
            </Badge>
          </div>
        </div>

        {!roster.length ? (
          <p
            className="rounded-xl border border-dashed px-3.5 py-5 text-center text-[11.5px] leading-relaxed"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا عادات في روتينك بعد — أضف عادة أولًا ثم ارجع لهذا اليوم.
          </p>
        ) : (
          <div className="space-y-3.5">
            {[...byBlock, ...(gone.length ? [{ g: GONE_BLOCK, list: gone }] : [])].map(
              ({ g, list }) => {
                const Icon = g.icon;
                return (
                  <div key={g.id}>
                    <p
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold"
                      style={{ color: g.tint }}
                    >
                      <Icon size={12} /> {g.label}
                    </p>
                    <div className="space-y-1">
                      {list.map((h) => (
                        <div key={h.id} className="flex items-center gap-2">
                          <Checkbox
                            size="sm"
                            checked={picked.includes(h.id)}
                            onToggle={() => toggle(h.id)}
                            label={h.label}
                            /* The completion colour, never the block's tint —
                               a done row that borrows its category colour
                               stops reading as done. */
                            tint={T.primary}
                          />
                          {h.core && (
                            <Star
                              size={11}
                              aria-label="أساسية"
                              style={{ color: T.accent, fill: T.accent }}
                            />
                          )}

                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}


/* The cue list, editable. Seeded from QUOTES on first load, then entirely
   the user's: a deleted quote stays deleted through a day rollover, and the
   card falls back to an invitation rather than a blank when the list empties. */
function QuotesModal({ open, onClose, quotes, setState }) {
  const [draft, setDraft] = useState({ id: null, text: "", author: "" });
  const arm = useUndo();

  const commit = () => {
    const text = draft.text.trim();
    if (!text) return;
    const author = draft.author.trim() || "بلا نسبة";
    setState((s) => ({
      ...s,
      quotes: draft.id
        ? s.quotes.map((q) => (q.id === draft.id ? { ...q, text, author } : q))
        : [...s.quotes, { id: uid(), text, author }],
    }));
    setDraft({ id: null, text: "", author: "" });
  };

  const drop = (id) => {
    arm("حُذف الاقتباس", { quotes });
    setState((s) => ({ ...s, quotes: s.quotes.filter((q) => q.id !== id) }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="عبارات التحفيز"
      footer={
        <Btn variant="outline" className="flex-1" onClick={onClose}>
          إغلاق
        </Btn>
      }
    >
      <div className="space-y-4">
        <div
          className="space-y-2.5 rounded-2xl border p-3.5"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <div>
            <label
              htmlFor="los-quote-text"
              className="mb-1.5 block text-xs text-white/45"
            >
              {draft.id ? "تعديل العبارة" : "عبارة جديدة"}
            </label>
            <Field
              id="los-quote-text"
              as="textarea"
              rows={2}
              className="resize-none leading-relaxed"
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              placeholder="اكتب العبارة التي تحرّكك"
            />
          </div>
          <div>
            <label
              htmlFor="los-quote-author"
              className="mb-1.5 block text-xs text-white/45"
            >
              القائل
            </label>
            <Field
              id="los-quote-author"
              value={draft.author}
              onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
              placeholder="اتركه فارغًا إن لم تعرف القائل"
            />
          </div>
          <div className="flex gap-2">
            <Btn variant="default" size="sm" className="flex-1" onClick={commit}>
              <Plus size={14} strokeWidth={3} /> {draft.id ? "حفظ التعديل" : "إضافة"}
            </Btn>
            {draft.id && (
              <Btn
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDraft({ id: null, text: "", author: "" })}
              >
                إلغاء
              </Btn>
            )}
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pl-1">
          {quotes.length === 0 ? (
            <p className="py-4 text-center text-[11.5px]" style={{ color: T.faint }}>
              القائمة فارغة — أضف عبارتك الأولى بالأعلى.
            </p>
          ) : (
            quotes.map((q) => (
              <div
                key={q.id}
                className="group flex items-start gap-2 rounded-xl border p-3 transition-colors duration-200"
                style={{
                  borderColor: draft.id === q.id ? `${T.accent}66` : T.border,
                  background:
                    draft.id === q.id ? `${T.accent}12` : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold leading-relaxed">{q.text}</p>
                  <p className="mt-1 text-[10.5px]" style={{ color: T.accent }}>
                    — {q.author}
                  </p>
                </div>
                <button
                  onClick={() => setDraft({ id: q.id, text: q.text, author: q.author })}
                  aria-label={`تعديل: ${q.text}`}
                  className="shrink-0 rounded p-1.5 text-white/30 transition-colors hover:text-white/80"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => drop(q.id)}
                  aria-label={`حذف: ${q.text}`}
                  className="shrink-0 rounded p-1.5 text-white/30 transition-colors hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}


/* ==================================================================== *
 *  The accountability mirror — no styling softener, on purpose
 * ==================================================================== */
export function MirrorModal({ open, onClose, value, onSave }) {
  const [draft, setDraft] = useState("");

  /* Reopened on a new day, the stored value is empty and so is the box —
     the entry is keyed by date, which is what "clears at midnight" means. */
  useEffect(() => {
    if (open) setDraft(value || "");
  }, [open, value]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مرآة المحاسبة"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => onSave(draft.trim())}
            style={{
              backgroundImage: `linear-gradient(135deg, ${T.danger}, ${T.ember})`,
              boxShadow: `0 8px 24px -10px ${T.danger}`,
              color: "#1A0603",
            }}
          >
            <Flame size={15} /> واجه الحقيقة
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إغلاق
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.danger}45`,
            background: `${T.danger}12`,
            color: T.danger,
          }}
        >
          هنا لا تُجمّل ولا تبرّر. اكتب ما تهرب منه — الكسل الذي سمّيته راحة،
          والتأجيل الذي سمّيته انتظارًا. لا أحد يقرأ هذا غيرك.
        </p>
        <Field
          as="textarea"
          rows={8}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="resize-none leading-relaxed"
          style={{
            borderColor: `${T.danger}59`,
            background: `${T.danger}0A`,
          }}
          placeholder="قل الحقيقة كاملة…"
        />
      </div>
    </Modal>
  );
}


/* The same three clocks, slimmed for the routine screen. It sits above the
   habit blocks on purpose: the habits are what spend the days it counts. */
function CountdownStrip({ state, onGo }) {
  const all = useMemo(() => (state.goals || []).map(goalShape), [state.goals]);
  /* نفس النافذة التي تفتح عليها شاشة الأهداف بالضبط، من نفس الدالة: السنة
     والربع اللذان يعيشهما فعلًا إن كان فيهما أهداف، وإلا أقرب ربع مكتوب.
     كانت هنا نسخة ثانية من هذا الحساب تقول «السنة الحالية دائمًا» — ومع
     فتح سنة المدرج صارت تعرض ربعًا فارغًا بلا هدف واحد فيه. */
  const { year, quarter } = useMemo(() => openingWindow(state.goals), [state.goals]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="flex items-center gap-2 text-[14.5px] font-extrabold"
          style={{ color: T.ctaLift }}
        >
          <Hourglass size={15} /> كم بقي؟
        </h3>
        <button
          onClick={onGo}
          className="inline-flex items-center gap-1 text-[10.5px] font-bold transition-colors hover:brightness-125"
          style={{ color: T.cta }}
        >
          أهدافي <ArrowLeft size={11} />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return (
            <HorizonRow
              key={h.id}
              h={h}
              compact
              clock={{ ...clock, label: clockLabel(h.id, year, quarter) }}
            />
          );
        })}
      </div>
    </Card>
  );
}


/* The motivation photo, in a card of its own above the cue. Stored in state
   rather than a side key so a backup carries it, and shrunk on the way in so
   it does not eat the storage quota the rest of the app depends on. */
function CueImageCard({ src, onChange }) {
  const fileRef = useRef(null);
  const [err, setErr] = useState(null);

  const pick = async (file) => {
    if (!file) return;
    setErr(null);
    try {
      onChange(await shrinkImage(file));
    } catch (e) {
      setErr(
        e?.message === "too-large"
          ? "الصورة كبيرة جدًا حتى بعد التصغير — اختر صورة أصغر."
          : "تعذّرت قراءة الصورة — جرّب صورة أخرى.",
      );
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {src ? (
        <Card className="group relative overflow-hidden p-0">
          <img
            src={src}
            alt="صورتك التحفيزية"
            className="block max-h-[22rem] w-full object-cover"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="استبدال الصورة التحفيزية"
              title="استبدال الصورة"
              className="rounded-lg border p-2 backdrop-blur transition-all duration-200 hover:scale-105"
              style={{
                borderColor: `${T.cta}59`,
                background: `${T.bgDeep}B3`,
                color: T.cta,
              }}
            >
              <ImagePlus size={15} />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="حذف الصورة التحفيزية"
              title="حذف الصورة"
              className="rounded-lg border p-2 backdrop-blur transition-all duration-200 hover:scale-105"
              style={{
                borderColor: `${T.danger}59`,
                background: `${T.bgDeep}B3`,
                color: T.danger,
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-[12.5px] font-bold transition-all duration-200 hover:scale-[1.01]"
          style={{
            borderColor: `${T.cta}4D`,
            background: `${T.cta}0D`,
            color: T.cta,
          }}
        >
          <ImagePlus size={15} /> أضف صورة تحفيزية
        </button>
      )}
      {err && (
        <p className="mt-2 text-center text-[11px]" style={{ color: T.danger }}>
          {err}
        </p>
      )}
    </>
  );
}


/* --- yesterday, corrected --------------------------------------------- *
 *  A habit system that only accepts today's answer punishes the one failure
 *  it cannot do anything about: forgetting to open the app. The day went to
 *  zero, the streak broke, and the number on the ring was about his memory
 *  rather than his discipline.
 *
 *  So yesterday stays open for exactly as long as today lasts — until the
 *  logical day boundary at 04:00, which is also when yesterday stops being
 *  the day before and becomes the day before that. One row is rewritten and
 *  nothing else moves: today's habits are not touched, because today is a
 *  different day and the whole value of a hard boundary is that it holds.
 *
 *  It works on a gap row too, which is the common case — the day he did not
 *  open the app is precisely the day worth going back for. A gap has no
 *  roster of its own, so the live routine is what it is asked against.
 * ---------------------------------------------------------------------- */
const GONE_BLOCK = {
  id: "__gone",
  label: "عادات لم تعد في روتينك",
  tint: T.faint,
  icon: Trash2,
};


/* The failure banner shouts; nothing ever said the quiet half. A tick that
   lands and is never confirmed looks exactly like one that was dropped, and
   this app is the kind a person leaves open for days and trusts blindly.

   Two destinations, said separately, because they fail separately. The
   browser is the working copy; the disk is the copy that survives the
   browser. For a while this said «محفوظ» off the browser write alone, so a
   sync server that had been off for two days read exactly like one keeping
   up. Both timestamps are the writes' own — set when each one returned,
   never guessed from a render. */
export function SaveStamp({ at, diskAt, diskStuck }) {
  if (!at) return null;
  const clock = (ms) =>
    new Date(ms).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  const pill = (tone, key, children) => (
    <span
      key={key}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
      style={{
        borderColor: `${tone}44`,
        color: tone,
        backgroundColor: `${tone}14`,
      }}
    >
      {children}
    </span>
  );
  return (
    <span className="mt-2.5 inline-flex flex-wrap items-center gap-1.5">
      {pill(
        T.primary,
        "browser",
        <>
          <Check size={10} strokeWidth={3.2} />
          {"المتصفح "}
          <span dir="ltr" className="tabular-nums">
            {clock(at)}
          </span>
        </>,
      )}
      {diskStuck
        ? pill(
            T.accent,
            "disk",
            <>
              <AlertTriangle size={10} strokeWidth={3} />
              {"القرص متوقف"}
            </>,
          )
        : diskAt
          ? pill(
              T.sky,
              "disk",
              <>
                <Database size={10} strokeWidth={3} />
                {"القرص "}
                <span dir="ltr" className="tabular-nums">
                  {clock(diskAt)}
                </span>
              </>,
            )
          : null}
    </span>
  );
}


/* ==================================================================== *
 *  MODULE 1 — Daily routine
 * ==================================================================== */
/* Habits live in one flat array and the blocks are a filtered view of it,
   so a move is a splice on that array — never a per-block list, which would
   drift out of sync with the order the archive and the discipline count read.
   Both callers below go through these two helpers for that reason. */

/* Drops `dragId` onto `targetId`, adopting the target's block. Dropping a
   habit on itself is a no-op rather than a reshuffle. */
function dropHabit(habits, dragId, targetId) {
  if (dragId === targetId) return habits;
  const from = habits.findIndex((h) => h.id === dragId);
  const target = habits.find((h) => h.id === targetId);
  if (from < 0 || !target) return habits;
  const moved = { ...habits[from], group: target.group };
  const rest = habits.filter((h) => h.id !== dragId);
  const at = rest.findIndex((h) => h.id === targetId);
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}


/* Drops a habit at the end of a block — the path for an empty block and for
   the header, which is the only target when a block has no rows yet. */
function dropHabitInGroup(habits, dragId, group) {
  const from = habits.findIndex((h) => h.id === dragId);
  if (from < 0) return habits;
  const moved = { ...habits[from], group };
  const rest = habits.filter((h) => h.id !== dragId);
  const last = rest.map((h) => h.group).lastIndexOf(group);
  const at = last < 0 ? rest.length : last + 1;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}


/* Swaps a habit with its neighbour inside its own block. Touch has no HTML5
   drag, so these arrows — not the drag handle — are the reliable path on a
   phone, and they stay visible there instead of waiting for a hover. */
function nudgeHabit(habits, id, dir) {
  const me = habits.find((h) => h.id === id);
  if (!me) return habits;
  const idx = habits.map((h) => h.id).indexOf(id);
  const step = dir === "up" ? -1 : 1;
  for (let i = idx + step; i >= 0 && i < habits.length; i += step) {
    if (habits[i].group !== me.group) continue;
    const next = habits.slice();
    next[idx] = habits[i];
    next[i] = habits[idx];
    return next;
  }
  return habits;
}